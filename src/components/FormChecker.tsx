"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Camera, X, RotateCcw, AlertTriangle, CheckCircle, Loader2, Info } from "lucide-react";
import Button from "@/components/Button";
import { useWebcam } from "@/hooks/useWebcam";
import { initPoseDetector, detectPose, releasePoseDetector } from "@/lib/pose-detector";
import type { ExerciseFormRules } from "@/types";
import {
  areLandmarksVisible,
  calculateAngle2D,
  calculateAngle3D,
  detectCameraAngle,
  getLandmarkVisibility,
  getSymmetryChecks,
  checkSpinalAlignment,
  LandmarkSmoother,
  projectAllLandmarks,
  POSE_CONNECTIONS,
  TempoTracker,
  JitterDetector,
  type CameraViewStatus,
} from "@/lib/form-geometry";
import { resolveExerciseFormRules, type ResolvedExerciseFormRules, type ResolvedFormRule } from "@/lib/form-rules";

interface FormFeedback {
  type: "error" | "warning" | "info";
  message: string;
  landmarkIndices?: number[];
}

interface FormCheckerProps {
  exerciseId: string;
  exerciseName: string;
  formRules: ExerciseFormRules | null;
  onClose: () => void;
}

function CameraGuideOverlay({
  status,
  calibrationMessage,
  showCalibration,
}: {
  status: CameraViewStatus | "calibrating";
  calibrationMessage: string;
  showCalibration: boolean;
}) {
  if (status === "good") return null;
  if (status === "calibrating" && !showCalibration) return null;

  const messages: Record<string, { title: string; desc: string }> = {
    calibrating: {
      title: "Calibrating",
      desc: calibrationMessage,
    },
    "too-far": {
      title: "Too far from camera",
      desc: "Move closer so your full body fills most of the frame.",
    },
    "not-detected": {
      title: "No pose detected",
      desc: "Make sure your full body is visible and there is adequate lighting.",
    },
    "front-view": {
      title: "Adjust camera angle",
      desc: "A side or three-quarter camera angle works better for this exercise.",
    },
    "back-view": {
      title: "Turn toward the camera",
      desc: "Make sure the exercise stays visible from the expected angle.",
    },
  };

  const msg = messages[status] ?? messages["not-detected"];

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
      <div className="bg-[var(--surface-overlay)] rounded-xl p-6 max-w-sm mx-4 text-center border border-[var(--border)]">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="font-bold text-[var(--foreground)] mb-1">{msg.title}</p>
        <p className="text-sm text-[var(--muted-foreground)]">{msg.desc}</p>
      </div>
    </div>
  );
}

function SkeletonCanvas({
  landmarks,
  feedback,
  canvasWidth,
  canvasHeight,
}: {
  landmarks: NormalizedLandmark[] | null;
  feedback: FormFeedback[];
  canvasWidth: number;
  canvasHeight: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const feedbackLandmarks = useRef(new Set<number>());

  useEffect(() => {
    feedbackLandmarks.current.clear();
    for (const cue of feedback) {
      if (!cue.landmarkIndices) continue;
      for (const idx of cue.landmarkIndices) feedbackLandmarks.current.add(idx);
    }
  }, [feedback]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (!landmarks) return;

    const projected = projectAllLandmarks(landmarks, canvasWidth, canvasHeight);

    ctx.lineWidth = 3;
    for (const [a, b] of POSE_CONNECTIONS) {
      const pa = projected[a];
      const pb = projected[b];
      if (!pa || !pb) continue;

      const hasError = feedbackLandmarks.current.has(a) || feedbackLandmarks.current.has(b);
      ctx.strokeStyle = hasError ? "rgba(239, 68, 68, 0.85)" : "rgba(59, 130, 246, 0.75)";
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    for (let i = 0; i < projected.length; i += 1) {
      const point = projected[i];
      if (!point) continue;
      const hasError = feedbackLandmarks.current.has(i);
      ctx.beginPath();
      ctx.arc(point.x, point.y, hasError ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = hasError ? "#ef4444" : "#3b82f6";
      ctx.fill();
    }
  }, [landmarks, canvasWidth, canvasHeight, feedback]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="absolute inset-0 z-10 pointer-events-none"
    />
  );
}

const MAX_VISIBLE_CUES = 3;

function FeedbackPanel({
  feedback,
  repCount,
  formScore,
}: {
  feedback: FormFeedback[];
  repCount: number;
  formScore: number;
}) {
  const errors = feedback.filter((item) => item.type === "error");
  const warnings = feedback.filter((item) => item.type === "warning");
  const infos = feedback.filter((item) => item.type === "info");
  const visibleCues = [...errors, ...warnings, ...infos].slice(0, MAX_VISIBLE_CUES);

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent z-[15]">
      <div className="flex items-end justify-between mb-2">
        <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
          {visibleCues.length === 0 ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-emerald-300">Good form!</span>
            </div>
          ) : (
            visibleCues.map((cue, index) => (
              <div key={`${cue.message}-${index}`} className="flex items-center gap-2">
                <AlertTriangle
                  className={`w-4 h-4 flex-shrink-0 ${
                    cue.type === "error" ? "text-red-400" : cue.type === "warning" ? "text-amber-400" : "text-sky-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium leading-tight ${
                    cue.type === "error"
                      ? "text-red-300"
                      : cue.type === "warning"
                        ? "text-amber-300"
                        : "text-sky-300"
                  }`}
                >
                  {cue.message}
                </span>
              </div>
            ))
          )}
          {feedback.length > MAX_VISIBLE_CUES && (
            <p className="text-xs text-white/50 pl-6">+{feedback.length - MAX_VISIBLE_CUES} more</p>
          )}
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Reps</p>
            <p className="text-xl font-bold text-white leading-none">{repCount}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Score</p>
            <p
              className={`text-xl font-bold leading-none ${
                formScore >= 80 ? "text-emerald-400" : formScore >= 60 ? "text-amber-400" : "text-red-400"
              }`}
            >
              {formScore}%
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            formScore >= 80 ? "bg-emerald-400" : formScore >= 60 ? "bg-amber-400" : "bg-red-400"
          }`}
          style={{ width: `${formScore}%` }}
        />
      </div>
    </div>
  );
}

function getRepWindow(resolvedRules: ResolvedExerciseFormRules | null): ResolvedFormRule | null {
  if (!resolvedRules || resolvedRules.rules.length === 0) return null;
  const primaryLandmarks = resolvedRules.primaryMetric.landmarks.join(",");
  return resolvedRules.rules.find((rule) => rule.landmarks.join(",") === primaryLandmarks) ?? resolvedRules.rules[0];
}

export default function FormChecker({ exerciseId, exerciseName, formRules, onClose }: FormCheckerProps) {
  const { videoRef, isReady, isLoading, error: camError, startCamera, stopCamera } = useWebcam({
    facingMode: "environment",
    zoom: 0.7,
  });

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });

  const detectorRef = useRef<PoseLandmarker | null>(null);
  const [detectorReady, setDetectorReady] = useState(false);
  const animationFrameRef = useRef<number>(0);
  const loopActiveRef = useRef(false);

  const [cameraStatus, setCameraStatus] = useState<CameraViewStatus>("calibrating");
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [feedback, setFeedback] = useState<FormFeedback[]>([]);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationMessage, setCalibrationMessage] = useState("Hold still while we lock in your pose.");

  const tempoTrackerRef = useRef(new TempoTracker());
  const jitterDetectorRef = useRef(new JitterDetector());
  const landmarkSmootherRef = useRef(new LandmarkSmoother());
  const scoreHistoryRef = useRef<number[]>([]);
  const ruleFailureCountsRef = useRef<Record<string, number>>({});
  const calibrationFramesRef = useRef(0);
  const sessionStartRef = useRef(performance.now());
  const sessionStartedRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  const resolvedRules = resolveExerciseFormRules(formRules);
  const hasUnsavedData = !isRunning && sessionStartedRef.current && (repCount > 0 || formScore < 100) && !sessionSaved;
  const rulesNotApplicable = resolvedRules?.applicability === "not_applicable";
  const postSetOnly = resolvedRules?.applicability === "post_set_only";
  const hasRealtimeRules = resolvedRules?.applicability === "realtime" && resolvedRules.rules.length > 0;

  const getRequiredLandmarks = useCallback((rules: ResolvedExerciseFormRules | null): number[] => {
    if (!rules) return [11, 12, 23, 24, 25, 26, 27, 28];
    const indices = new Set<number>(rules.primaryMetric.landmarks);
    for (const rule of rules.rules) {
      for (const index of rule.landmarks) indices.add(index);
    }
    return Array.from(indices);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (!canvasContainerRef.current) return;
      const { width, height } = canvasContainerRef.current.getBoundingClientRect();
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    initPoseDetector()
      .then((detector) => {
        if (cancelled) return;
        detectorRef.current = detector;
        setDetectorReady(true);
      })
      .catch((err) => {
        console.error("Failed to init pose detector:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const detectionLoop = useCallback(() => {
    if (!loopActiveRef.current) return;

    if (!detectorRef.current || !videoRef.current || !isReady) {
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    detectPose(detectorRef.current, videoRef.current, performance.now()).then((result) => {
      if (!loopActiveRef.current) return;

      if (!result) {
        setCameraStatus("not-detected");
        setLandmarks(null);
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      const smoothedLandmarks = landmarkSmootherRef.current.smooth(result);
      setLandmarks(smoothedLandmarks);

      const angleStatus = detectCameraAngle(smoothedLandmarks, resolvedRules?.view ?? "side");
      const requiredLandmarks = getRequiredLandmarks(resolvedRules);
      const requiredVisibility = requiredLandmarks.length > 0
        ? getLandmarkVisibility(smoothedLandmarks, requiredLandmarks)
        : 0;

      jitterDetectorRef.current.addFrame(smoothedLandmarks);
      const calibrationVariance = requiredLandmarks.length > 0
        ? jitterDetectorRef.current.getAverageVariance(requiredLandmarks)
        : 0;

      if (
        angleStatus !== "good"
        || requiredVisibility < 0.55
        || calibrationVariance > 0.003
      ) {
        calibrationFramesRef.current = 0;
        setIsCalibrated(false);
        setCameraStatus(angleStatus === "good" ? "calibrating" : angleStatus);
        if (angleStatus !== "good") {
          setCalibrationMessage("Adjust your camera so the expected view stays visible.");
        } else if (requiredVisibility < 0.55) {
          setCalibrationMessage("Keep your full body visible and stay in frame.");
        } else {
          setCalibrationMessage("Hold still for a moment so tracking can stabilize.");
        }
        setFeedback([]);
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      if (!isCalibrated) {
        calibrationFramesRef.current += 1;
        setCameraStatus("calibrating");
        setCalibrationMessage("Great, stay steady for a second...");
        if (calibrationFramesRef.current < 12) {
          setFeedback([]);
          animationFrameRef.current = requestAnimationFrame(detectionLoop);
          return;
        }
        setIsCalibrated(true);
      }

      setCameraStatus("good");

      const newFeedback: FormFeedback[] = [];
      let activeChecks = 0;

      if (hasRealtimeRules && resolvedRules) {
        for (const rule of resolvedRules.rules) {
          if (!areLandmarksVisible(smoothedLandmarks, [...rule.landmarks], rule.visibilityThreshold)) {
            ruleFailureCountsRef.current[rule.id] = 0;
            continue;
          }

          activeChecks += 1;
          const angle = calculateAngle3D(smoothedLandmarks, rule.landmarks[0], rule.landmarks[1], rule.landmarks[2]);
          if (angle < 0) continue;

          const failed = angle < rule.min || angle > rule.max;
          ruleFailureCountsRef.current[rule.id] = failed ? (ruleFailureCountsRef.current[rule.id] ?? 0) + 1 : 0;

          if (ruleFailureCountsRef.current[rule.id] >= rule.holdFrames) {
            newFeedback.push({
              type: rule.severity,
              message: rule.cue,
              landmarkIndices: rule.landmarks,
            });
          }
        }
      }

      if (resolvedRules?.pattern.universalChecks.symmetry) {
        if (areLandmarksVisible(smoothedLandmarks, [11, 13, 15, 12, 14, 16], 0.55)) {
          activeChecks += 1;
          const symmetry = getSymmetryChecks(smoothedLandmarks);
          if (symmetry.elbowSymmetry > 15 && symmetry.elbowSymmetry >= 0) {
            newFeedback.push({ type: "warning", message: "Uneven arm position", landmarkIndices: [11, 13, 15, 12, 14, 16] });
          }
        }
        if (areLandmarksVisible(smoothedLandmarks, [23, 25, 27, 24, 26, 28], 0.55)) {
          activeChecks += 1;
          const symmetry = getSymmetryChecks(smoothedLandmarks);
          if (symmetry.kneeSymmetry > 15 && symmetry.kneeSymmetry >= 0) {
            newFeedback.push({ type: "warning", message: "Knee imbalance detected", landmarkIndices: [23, 25, 27, 24, 26, 28] });
          }
        }
      }

      if (resolvedRules?.pattern.universalChecks.spine) {
        if (areLandmarksVisible(smoothedLandmarks, [11, 12, 23, 24], 0.55)) {
          activeChecks += 1;
          const spineAngle = checkSpinalAlignment(smoothedLandmarks);
          if (spineAngle > 0 && spineAngle < 30) {
            newFeedback.push({ type: "error", message: "Round your back less", landmarkIndices: [11, 12, 23, 24] });
          }
        }
      }

      if (resolvedRules?.pattern.universalChecks.stability) {
        activeChecks += 1;
        const jittery = jitterDetectorRef.current.getJitteryJoints();
        if (jittery.size > 2) {
          newFeedback.push({
            type: "warning",
            message: "Unstable movement, slow down",
            landmarkIndices: Array.from(jittery.keys()),
          });
        }
      }

      setFeedback(newFeedback);

      if (hasRealtimeRules && resolvedRules) {
        const repWindow = getRepWindow(resolvedRules);
        if (
          repWindow
          && areLandmarksVisible(
            smoothedLandmarks,
            [...resolvedRules.primaryMetric.landmarks],
            Math.max(repWindow.visibilityThreshold, 0.55),
          )
        ) {
          const angle = calculateAngle2D(
            smoothedLandmarks,
            resolvedRules.primaryMetric.landmarks[0],
            resolvedRules.primaryMetric.landmarks[1],
            resolvedRules.primaryMetric.landmarks[2],
          );
          if (angle >= 0) {
            const counted = tempoTrackerRef.current.checkRep(
              angle,
              repWindow.min,
              repWindow.max,
              resolvedRules.primaryMetric.phaseLogic,
            );
            if (counted) setRepCount((prev) => prev + 1);
          }
        }
      }

      const totalChecks = activeChecks;
      const penalty = newFeedback.reduce((sum, cue) => sum + (cue.type === "error" ? 1 : cue.type === "warning" ? 0.5 : 0.25), 0);
      const passedChecks = Math.max(0, totalChecks - penalty);
      const instantScore = totalChecks === 0 ? 100 : Math.round((passedChecks / totalChecks) * 100);

      scoreHistoryRef.current.push(instantScore);
      if (scoreHistoryRef.current.length > 30) scoreHistoryRef.current.shift();
      const avgScore = Math.round(
        scoreHistoryRef.current.reduce((sum, value) => sum + value, 0) / scoreHistoryRef.current.length,
      );
      setFormScore(avgScore);

      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    });
  }, [videoRef, isReady, resolvedRules, hasRealtimeRules]);

  useEffect(() => {
    if (isRunning && isReady && detectorRef.current) {
      tempoTrackerRef.current.reset();
      jitterDetectorRef.current.reset();
      landmarkSmootherRef.current.reset();
      scoreHistoryRef.current = [];
      ruleFailureCountsRef.current = {};
      calibrationFramesRef.current = 0;
      setIsCalibrated(false);
      setCameraStatus("calibrating");
      setCalibrationMessage("Hold still while we lock in your pose.");
      setRepCount(0);
      setFormScore(100);
      setFeedback([]);
      loopActiveRef.current = true;
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    }

    return () => {
      loopActiveRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
    };
  }, [isRunning, isReady, detectionLoop]);

  useEffect(() => () => {
    loopActiveRef.current = false;
    stopCamera();
    releasePoseDetector();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, [stopCamera]);

  const handleToggle = () => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    sessionStartRef.current = performance.now();
    sessionStartedRef.current = true;
    setIsRunning(true);
    setSessionSaved(false);
  };

  const handleReset = () => {
    loopActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    setIsRunning(false);
    tempoTrackerRef.current.reset();
    jitterDetectorRef.current.reset();
    landmarkSmootherRef.current.reset();
    scoreHistoryRef.current = [];
    ruleFailureCountsRef.current = {};
    calibrationFramesRef.current = 0;
    setIsCalibrated(false);
    setCameraStatus("calibrating");
    setCalibrationMessage("Hold still while we lock in your pose.");
    setRepCount(0);
    setFormScore(100);
    setFeedback([]);
    setSessionSaved(false);
    sessionStartedRef.current = false;
  };

  const handleSaveSession = async () => {
    setIsSaving(true);
    const durationMs = Math.round(performance.now() - sessionStartRef.current);
    try {
      const res = await fetch("/api/form-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: exerciseId,
          score: formScore,
          reps: repCount,
          duration_ms: durationMs,
          feedback_notes: resolvedRules?.review.notes ?? null,
        }),
      });
      if (res.ok) setSessionSaved(true);
    } catch {
      // Silently fail
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = async () => {
    if (hasUnsavedData && !isSaving) {
      await handleSaveSession();
    }
    onClose();
  };

  const startButtonLabel = () => {
    if (isRunning) return "Pause";
    if (!detectorReady || !isReady) return "Loading...";
    if (cameraStatus === "not-detected") return "Waiting for pose...";
    if (rulesNotApplicable || postSetOnly) return "Realtime not available";
    if (!isCalibrated) return "Start Detection";
    return "Start Detection";
  };

  const isButtonLoading = (!isReady || !detectorReady) && !isRunning;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-20">
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">{exerciseName}</h2>
          <p className="text-xs text-white/50 mt-0.5">
            {rulesNotApplicable
              ? "Not applicable for realtime checks"
              : postSetOnly
                ? "Post-set review only"
                : hasRealtimeRules
                  ? `${resolvedRules?.rules.length ?? 0} pattern rules active`
                  : "Universal checks only"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Reset session"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div ref={canvasContainerRef} className="flex-1 relative bg-black overflow-hidden">
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ transform: "scaleX(-1)" }}
        />

        <SkeletonCanvas
          landmarks={landmarks}
          feedback={feedback}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
        />
        <CameraGuideOverlay
          status={cameraStatus}
          calibrationMessage={calibrationMessage}
          showCalibration={isRunning && !isCalibrated}
        />

        {isRunning && (rulesNotApplicable || postSetOnly) && cameraStatus === "good" && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="flex items-start gap-2 bg-amber-900/80 backdrop-blur-sm border border-amber-500/30 rounded-lg px-3 py-2">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-snug">
                This exercise is configured for post-set review or is not suitable for realtime angle checks.
              </p>
            </div>
          </div>
        )}

        {isRunning && cameraStatus === "good" && isCalibrated && (
          <FeedbackPanel feedback={feedback} repCount={repCount} formScore={formScore} />
        )}

        {(isLoading || (!detectorReady && !camError && !isRunning)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-sm text-white/60">
              {isLoading ? "Starting camera..." : "Loading AI model..."}
            </p>
          </div>
        )}

        {camError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center px-6">
              <Camera className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="font-bold text-white mb-1">Camera Error</p>
              <p className="text-sm text-white/60 mb-4">{camError}</p>
              <Button onClick={startCamera}>Try Again</Button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4 bg-[var(--surface-overlay)] border-t border-[var(--border)] z-20">
        <div className="flex gap-3">
          <Button
            onClick={handleToggle}
            disabled={!isReady || !detectorReady || cameraStatus === "not-detected" || rulesNotApplicable || postSetOnly}
            className="flex-1"
          >
            {isButtonLoading ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                {startButtonLabel()}
              </span>
            ) : (
              startButtonLabel()
            )}
          </Button>

          {hasUnsavedData && (
            <Button onClick={handleSaveSession} disabled={isSaving} variant="secondary">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : (
                "Save Session"
              )}
            </Button>
          )}

          {sessionSaved && (
            <div className="flex items-center gap-2 px-4 py-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" /> Saved
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
