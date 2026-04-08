// ── FormChecker Component ────────────────────────────────────────────────────
// Client component. Overlay webcam + MediaPipe pose detection + real-time
// form feedback. Combines camera guide, skeleton visualization, and rule
// checking into a single component.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Camera, X, RotateCcw, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import Button from "@/components/Button";
import { useWebcam } from "@/hooks/useWebcam";
import {
  initPoseDetector,
  detectPose,
  releasePoseDetector,
} from "@/lib/pose-detector";
import type { ExerciseFormRules } from "@/types";
import {
  calculateAngle2D,
  calculateAngle3D,
  detectCameraAngle,
  getSymmetryChecks,
  checkSpinalAlignment,
  projectAllLandmarks,
  POSE_CONNECTIONS,
  TempoTracker,
  JitterDetector,
} from "@/lib/form-geometry";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormFeedback {
  type: "error" | "warning" | "info";
  message: string;
  landmarkIndices?: number[];
}

type CameraViewStatus = "calibrating" | "good" | "front-view" | "back-view" | "too-far" | "not-detected";

interface FormCheckerProps {
  exerciseId: string;
  exerciseName: string;
  formRules: ExerciseFormRules | null;
  onClose: () => void;
}

// ── Camera Guide Overlay ─────────────────────────────────────────────────────

function CameraGuideOverlay({ status }: { status: CameraViewStatus }) {
  if (status === "good" || status === "calibrating") return null;

  const messages: Record<string, { title: string; desc: string }> = {
    "front-view": {
      title: "Front view detected",
      desc: "Please move to the side of your body so the camera can see your profile.",
    },
    "back-view": {
      title: "Back view detected",
      desc: "Please move to the side of your body so the camera can see your profile.",
    },
    "too-far": {
      title: "Too far from camera",
      desc: "Move closer so your full body is visible but fills most of the frame.",
    },
    "not-detected": {
      title: "No pose detected",
      desc: "Make sure your full body is visible in the camera and there is adequate lighting.",
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

// ── Skeleton Canvas ──────────────────────────────────────────────────────────

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

  // Collect landmark indices that have errors
  useEffect(() => {
    feedbackLandmarks.current.clear();
    for (const f of feedback) {
      if (f.landmarkIndices) {
        for (const idx of f.landmarkIndices) {
          feedbackLandmarks.current.add(idx);
        }
      }
    }
  }, [feedback]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const projected = projectAllLandmarks(landmarks, canvasWidth, canvasHeight);

    // Draw skeleton lines
    ctx.lineWidth = 3;
    for (const [a, b] of POSE_CONNECTIONS) {
      const pa = projected[a];
      const pb = projected[b];
      if (!pa || !pb) continue;

      const hasError = feedbackLandmarks.current.has(a) || feedbackLandmarks.current.has(b);
      ctx.strokeStyle = hasError ? "rgba(239, 68, 68, 0.8)" : "rgba(59, 130, 246, 0.7)";
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    // Draw landmark dots
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      if (!p) continue;

      const hasError = feedbackLandmarks.current.has(i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, hasError ? 6 : 4, 0, 2 * Math.PI);
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

// ── Feedback Panel ───────────────────────────────────────────────────────────

function FeedbackPanel({ feedback, repCount, formScore }: {
  feedback: FormFeedback[];
  repCount: number;
  formScore: number;
}) {
  const errors = feedback.filter((f) => f.type === "error");
  const warnings = feedback.filter((f) => f.type === "warning");
  const currentFeedback = errors.length > 0 ? errors[0] : warnings.length > 0 ? warnings[0] : null;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-15">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {currentFeedback ? (
            <>
              {currentFeedback.type === "error" ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <span className="text-sm font-medium text-white">{currentFeedback.message}</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Good form!</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-white/60">Reps</p>
            <p className="text-lg font-bold text-white">{repCount}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">Score</p>
            <p className={`text-lg font-bold ${formScore >= 80 ? "text-emerald-400" : formScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
              {formScore}%
            </p>
          </div>
        </div>
      </div>
      {/* Score bar */}
      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            formScore >= 80 ? "bg-emerald-400" : formScore >= 60 ? "bg-amber-400" : "bg-red-400"
          }`}
          style={{ width: `${formScore}%` }}
        />
      </div>
    </div>
  );
}

// ── Main FormChecker Component ───────────────────────────────────────────────

export default function FormChecker({ exerciseId, exerciseName, formRules, onClose }: FormCheckerProps) {
  const { videoRef, isReady, isLoading, error: camError, startCamera, stopCamera } = useWebcam({
    facingMode: "environment", // Use back camera on mobile
  });

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });

  const detectorRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [cameraStatus, setCameraStatus] = useState<CameraViewStatus>("calibrating");
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [feedback, setFeedback] = useState<FormFeedback[]>([]);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [isRunning, setIsRunning] = useState(false);

  const tempoTrackerRef = useRef(new TempoTracker());
  const jitterDetectorRef = useRef(new JitterDetector());
  const scoreHistoryRef = useRef<number[]>([]);
  const sessionStartRef = useRef(performance.now());
  const [isSaving, setIsSaving] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        const { width, height } = canvasContainerRef.current.getBoundingClientRect();
        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Initialize pose detector
  useEffect(() => {
    let cancelled = false;
    initPoseDetector().then((detector) => {
      if (!cancelled) {
        detectorRef.current = detector;
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Detection loop
  const detectionLoop = useCallback(() => {
    if (!detectorRef.current || !videoRef.current || !isReady) {
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    detectPose(detectorRef.current, videoRef.current, performance.now()).then((result) => {
      if (!result) {
        setCameraStatus("not-detected");
        setLandmarks(null);
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      setLandmarks(result);

      // Detect camera angle
      const angleStatus = detectCameraAngle(result);
      setCameraStatus(angleStatus as CameraViewStatus);

      if (angleStatus !== "good") {
        setFeedback([]);
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      // Run form checks
      const newFeedback: FormFeedback[] = [];

      // 1. Check exercise-specific rules
      if (formRules?.rules) {
        for (const rule of formRules.rules) {
          const angle = calculateAngle3D(result, rule.landmarks[0], rule.landmarks[1], rule.landmarks[2]);
          if (angle < 0) continue;

          if (angle < rule.min || angle > rule.max) {
            newFeedback.push({
              type: "error",
              message: rule.cue,
              landmarkIndices: rule.landmarks,
            });
          }
        }
      }

      // 2. Universal: Symmetry checks
      const symmetry = getSymmetryChecks(result);
      if (symmetry.elbowSymmetry > 15 && symmetry.elbowSymmetry >= 0) {
        newFeedback.push({
          type: "warning",
          message: "Uneven arm position",
          landmarkIndices: [11, 13, 15, 12, 14, 16],
        });
      }
      if (symmetry.kneeSymmetry > 15 && symmetry.kneeSymmetry >= 0) {
        newFeedback.push({
          type: "warning",
          message: "Knee imbalance detected",
          landmarkIndices: [23, 25, 27, 24, 26, 28],
        });
      }

      // 3. Universal: Spinal alignment
      const spineAngle = checkSpinalAlignment(result);
      if (spineAngle > 0 && spineAngle < 30) {
        newFeedback.push({
          type: "error",
          message: "Round your back less",
          landmarkIndices: [11, 12, 23, 24],
        });
      }

      // 4. Universal: Jitter detection
      jitterDetectorRef.current.addFrame(result);
      const jittery = jitterDetectorRef.current.getJitteryJoints();
      if (jittery.size > 2) {
        newFeedback.push({
          type: "warning",
          message: "Unstable movement — slow down",
          landmarkIndices: Array.from(jittery.keys()),
        });
      }

      setFeedback(newFeedback);

      // Rep counting (use first rule's landmarks as reference)
      if (formRules?.rules && formRules.rules.length > 0) {
        const primaryRule = formRules.rules[0];
        const angle = calculateAngle2D(result, primaryRule.landmarks[0], primaryRule.landmarks[1], primaryRule.landmarks[2]);
        if (angle >= 0) {
          const counted = tempoTrackerRef.current.checkRep(angle, primaryRule.min, primaryRule.max);
          if (counted) {
            setRepCount((prev) => prev + 1);
          }
        }
      }

      // Form score calculation
      const totalChecks = (formRules?.rules?.length ?? 0) + 3; // +3 for universal checks
      const passedChecks = totalChecks - newFeedback.length;
      const instantScore = Math.round((passedChecks / Math.max(totalChecks, 1)) * 100);

      scoreHistoryRef.current.push(instantScore);
      if (scoreHistoryRef.current.length > 30) scoreHistoryRef.current.shift();
      const avgScore = Math.round(
        scoreHistoryRef.current.reduce((a, b) => a + b, 0) / scoreHistoryRef.current.length
      );
      setFormScore(avgScore);

      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    });
  }, [videoRef, isReady, formRules]);

  // Start/stop detection loop
  useEffect(() => {
    if (isRunning && isReady && detectorRef.current) {
      tempoTrackerRef.current.reset();
      jitterDetectorRef.current.reset();
      scoreHistoryRef.current = [];
      setRepCount(0);
      setFormScore(100);
      setFeedback([]);
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isReady, detectionLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      releasePoseDetector();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [stopCamera]);

  const handleToggle = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      sessionStartRef.current = performance.now();
      setIsRunning(true);
      setSessionSaved(false);
    }
  };

  const handleReset = () => {
    tempoTrackerRef.current.reset();
    jitterDetectorRef.current.reset();
    scoreHistoryRef.current = [];
    setRepCount(0);
    setFormScore(100);
    setFeedback([]);
    setSessionSaved(false);
  };

  const handleSaveSession = async () => {
    if (repCount === 0 && formScore === 100) return; // Nothing to save
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
        }),
      });

      if (res.ok) {
        setSessionSaved(true);
      }
    } catch {
      // Silently fail — logging is optional
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-20">
        <div>
          <h2 className="text-lg font-bold text-white">{exerciseName}</h2>
          <p className="text-xs text-white/60">
            {formRules?.rules?.length ? `${formRules.rules.length} active rules` : "Universal rules only"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div ref={canvasContainerRef} className="flex-1 relative bg-black overflow-hidden">
        {/* Hidden video element for MediaPipe */}
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ transform: "scaleX(-1)" }} // Mirror
        />

        {/* Skeleton overlay */}
        <SkeletonCanvas
          landmarks={landmarks}
          feedback={feedback}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
        />

        {/* Camera guide overlay */}
        <CameraGuideOverlay status={cameraStatus} />

        {/* Feedback panel */}
        {isRunning && cameraStatus === "good" && (
          <FeedbackPanel feedback={feedback} repCount={repCount} formScore={formScore} />
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Camera error */}
        {camError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="text-center px-6">
              <Camera className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="font-bold text-white mb-1">Camera Error</p>
              <p className="text-sm text-white/60">{camError}</p>
              <Button onClick={startCamera} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-4 bg-[var(--surface-overlay)] border-t border-[var(--border)] z-20">
        <div className="flex gap-3">
          <Button
            onClick={handleToggle}
            disabled={!isReady || !detectorRef.current || cameraStatus === "not-detected"}
            className="flex-1"
          >
            {isRunning ? "Pause" : cameraStatus === "not-detected" ? "Waiting for pose..." : "Start Detection"}
          </Button>
          {!isRunning && repCount > 0 && !sessionSaved && (
            <Button
              onClick={handleSaveSession}
              disabled={isSaving}
              variant="secondary"
            >
              {isSaving ? "Saving..." : "Save Session"}
            </Button>
          )}
          {sessionSaved && (
            <div className="flex items-center gap-2 px-4 py-2 text-emerald-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Saved
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
