"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Camera, X, RotateCcw, AlertTriangle, CheckCircle, Loader2, Info } from "lucide-react";
import Button from "@/components/Button";
import { useWebcam } from "@/hooks/useWebcam";
import { initPoseDetector, detectPose, releasePoseDetector } from "@/lib/pose-detector";
import type {
  ExerciseFormRules,
  FormCoachingResult,
  FormMetricSample,
  FormRepMetric,
  FormSessionAnalysis,
  FormSessionFeedbackItem,
} from "@/types";
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
import {
  FORM_DETECTOR_VERSION,
  LandmarkStreamRecorder,
  adjustThresholdForConfidence,
  buildSessionAnalysis,
  downgradeSeverityForConfidence,
  getMetricPhase,
  shouldEvaluateRule,
  shouldUseCloudCoaching,
  summarizeRepSamples,
} from "@/lib/form-analysis";

interface FormCheckerProps {
  exerciseId: string;
  exerciseName: string;
  formRules: ExerciseFormRules | null;
  onClose: () => void;
}

type FormCheckerCameraStatus = CameraViewStatus | "calibrating";
type FormFeedback = FormSessionFeedbackItem;
type JointVisualStatus = "neutral" | "warning" | "error";

interface TrackedRuleState {
  failFrames: number;
  passFrames: number;
  active: boolean;
  lastSeenMs: number;
  severity: FormFeedback["type"];
  feedback: FormFeedback | null;
}

interface StableJointStatus {
  status: JointVisualStatus;
  expiresAt: number;
}

type JointStatusMap = Record<number, StableJointStatus>;

interface StableFeedbackState {
  items: FormFeedback[];
  jointStatusMap: JointStatusMap;
  trackingInterrupted: boolean;
  recentRepDetectedUntilMs: number;
}

interface DetectionCadenceConfig {
  targetFps: number;
  minFrameIntervalMs: number;
  missingPoseGraceFrames: number;
  enterCalibrationFrames: number;
  exitCalibrationFrames: number;
  feedbackTtlMs: number;
  clearFrames: number;
  minRepRangeDegrees: number;
  primaryLossResetFrames: number;
}

const DETECTION_CONFIG: DetectionCadenceConfig = {
  targetFps: 28,
  minFrameIntervalMs: Math.round(1000 / 28),
  missingPoseGraceFrames: 5,
  enterCalibrationFrames: 12,
  exitCalibrationFrames: 7,
  feedbackTtlMs: 850,
  clearFrames: 5,
  minRepRangeDegrees: 24,
  primaryLossResetFrames: 8,
};

function getSeverityRank(status: JointVisualStatus): number {
  if (status === "error") return 2;
  if (status === "warning") return 1;
  return 0;
}

function toJointStatus(type: FormFeedback["type"]): JointVisualStatus {
  if (type === "error") return "error";
  if (type === "warning") return "warning";
  return "neutral";
}

function getStableFeedbackKey(items: FormFeedback[]): string {
  return items.map((item) => `${item.type}:${item.message}`).join("|");
}

function getPointVisualStatus(jointStatusMap: JointStatusMap, index: number, now: number): JointVisualStatus {
  const visual = jointStatusMap[index];
  if (!visual || visual.expiresAt < now) return "neutral";
  return visual.status;
}

function getSegmentVisualStatus(jointStatusMap: JointStatusMap, a: number, b: number, now: number): JointVisualStatus {
  const first = getPointVisualStatus(jointStatusMap, a, now);
  const second = getPointVisualStatus(jointStatusMap, b, now);
  return getSeverityRank(first) >= getSeverityRank(second) ? first : second;
}

function getSkeletonColor(status: JointVisualStatus, alpha: number): string {
  if (status === "error") return `rgba(239, 68, 68, ${alpha})`;
  if (status === "warning") return `rgba(245, 158, 11, ${alpha})`;
  return `rgba(59, 130, 246, ${alpha})`;
}

function CameraGuideOverlay({
  status,
  calibrationMessage,
  showCalibration,
}: {
  status: FormCheckerCameraStatus;
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
  jointStatusMap,
  canvasWidth,
  canvasHeight,
  sourceWidth,
  sourceHeight,
}: {
  landmarks: NormalizedLandmark[] | null;
  jointStatusMap: JointStatusMap;
  canvasWidth: number;
  canvasHeight: number;
  sourceWidth: number;
  sourceHeight: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (!landmarks) return;

    const projected = projectAllLandmarks(landmarks, canvasWidth, canvasHeight, sourceWidth, sourceHeight);
    const now = performance.now();

    ctx.lineWidth = 3;
    for (const [a, b] of POSE_CONNECTIONS) {
      const pa = projected[a];
      const pb = projected[b];
      if (!pa || !pb) continue;

      const visibility = Math.min(landmarks[a]?.visibility ?? 0, landmarks[b]?.visibility ?? 0);
      const alpha = Math.max(0.18, Math.min(0.85, 0.25 + (visibility * 0.6)));
      const status = getSegmentVisualStatus(jointStatusMap, a, b, now);
      ctx.strokeStyle = getSkeletonColor(status, alpha);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    for (let i = 0; i < projected.length; i += 1) {
      const point = projected[i];
      if (!point) continue;
      const status = getPointVisualStatus(jointStatusMap, i, now);
      const visibility = landmarks[i]?.visibility ?? 0;
      const alpha = Math.max(0.25, Math.min(0.95, 0.3 + (visibility * 0.65)));
      ctx.beginPath();
      ctx.arc(point.x, point.y, status === "neutral" ? 4 : 6, 0, 2 * Math.PI);
      ctx.fillStyle = getSkeletonColor(status, alpha);
      ctx.fill();
    }
  }, [landmarks, canvasWidth, canvasHeight, jointStatusMap, sourceWidth, sourceHeight]);

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
  trackingInterrupted,
  recentRepDetected,
}: {
  feedback: FormFeedback[];
  repCount: number;
  formScore: number;
  trackingInterrupted: boolean;
  recentRepDetected: boolean;
}) {
  const errors = feedback.filter((item) => item.type === "error");
  const warnings = feedback.filter((item) => item.type === "warning");
  const infos = feedback.filter((item) => item.type === "info");
  const visibleCues = [...errors, ...warnings, ...infos].slice(0, MAX_VISIBLE_CUES);
  const hasRepScore = repCount > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent z-[15]">
      <div className="flex items-end justify-between mb-2">
        <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
          {visibleCues.length === 0 ? (
            <div className="flex items-center gap-2 transition-all duration-200">
              {trackingInterrupted ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span className={`text-sm font-semibold ${trackingInterrupted ? "text-amber-300" : "text-emerald-300"}`}>
                {trackingInterrupted ? "Tracking interrupted" : recentRepDetected ? "Rep detected" : "Tracking"}
              </span>
            </div>
          ) : (
            visibleCues.map((cue, index) => (
              <div key={`${cue.message}-${index}`} className="flex items-center gap-2 transition-all duration-200">
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
                !hasRepScore ? "text-white/70" : formScore >= 80 ? "text-emerald-400" : formScore >= 60 ? "text-amber-400" : "text-red-400"
              }`}
            >
              {hasRepScore ? `${formScore}%` : "--"}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            !hasRepScore ? "bg-white/30" : formScore >= 80 ? "bg-emerald-400" : formScore >= 60 ? "bg-amber-400" : "bg-red-400"
          }`}
          style={{ width: `${hasRepScore ? formScore : 12}%` }}
        />
      </div>
      {!hasRepScore && (
        <p className="mt-2 text-xs text-white/60">Detecting first rep...</p>
      )}
    </div>
  );
}

function SessionSummaryCard({
  analysis,
  coachingLoading,
  coachingError,
}: {
  analysis: FormSessionAnalysis | null;
  coachingLoading: boolean;
  coachingError: string;
}) {
  if (!analysis) return null;
  const coaching = analysis.feedback_json.coaching;
  const topIssues = analysis.feedback_json.topIssues.slice(0, 3);

  return (
    <div className="px-4 py-4 bg-[var(--surface)] border-t border-[var(--border)] space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Post-set analysis</p>
          <p className="text-xs text-[var(--muted-foreground)]">{analysis.feedback_summary || "Session analyzed locally."}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Final</p>
          <p className="text-lg font-bold text-[var(--foreground)]">{analysis.score}%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-[var(--surface-raised)] px-3 py-2">
          <p className="text-[var(--muted-foreground)]">Realtime</p>
          <p className="font-semibold text-[var(--foreground)]">{analysis.realtime_score}%</p>
        </div>
        <div className="rounded-lg bg-[var(--surface-raised)] px-3 py-2">
          <p className="text-[var(--muted-foreground)]">Post-set</p>
          <p className="font-semibold text-[var(--foreground)]">{analysis.postset_score}%</p>
        </div>
        <div className="rounded-lg bg-[var(--surface-raised)] px-3 py-2">
          <p className="text-[var(--muted-foreground)]">Detector</p>
          <p className="font-semibold text-[var(--foreground)] text-[11px]">{FORM_DETECTOR_VERSION}</p>
        </div>
      </div>

      {topIssues.length > 0 && (
        <div className="space-y-2">
          {topIssues.map((item, index) => (
            <div key={`${item.message}-${index}`} className="text-sm text-[var(--foreground)] flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.type === "error" ? "text-red-400" : item.type === "warning" ? "text-amber-400" : "text-sky-400"}`} />
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-[var(--surface-raised)] px-3 py-3">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-semibold text-[var(--foreground)]">AI Coach review</p>
          {coachingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--muted-foreground)]" />}
        </div>
        {coaching ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--foreground)]">{coaching.summary}</p>
            {coaching.top_cues.slice(0, 3).map((cue, index) => (
              <p key={`${cue}-${index}`} className="text-xs text-[var(--muted-foreground)]">• {cue}</p>
            ))}
          </div>
        ) : coachingError ? (
          <p className="text-xs text-amber-400">{coachingError}</p>
        ) : (
          <p className="text-xs text-[var(--muted-foreground)]">
            {analysis.used_cloud_coach ? "Reviewing your set..." : "Local-only summary used for this set."}
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewOverlay({
  visible,
}: {
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-overlay)] px-6 py-5 text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-sky-400" />
        <p className="text-sm font-semibold text-[var(--foreground)]">Reviewing your set...</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Please wait while we finish the post-set analysis.</p>
      </div>
    </div>
  );
}

function StartupOverlay({
  visible,
}: {
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-overlay)] px-6 py-5 text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-sky-400" />
        <p className="text-sm font-semibold text-[var(--foreground)]">Starting detection...</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Please wait while the camera and pose tracking warm up.</p>
      </div>
    </div>
  );
}

function getRepWindow(
  resolvedRules: ResolvedExerciseFormRules | null,
): Pick<ResolvedFormRule, "min" | "max" | "visibilityThreshold"> | null {
  if (!resolvedRules || resolvedRules.rules.length === 0) return null;
  const primaryLandmarks = resolvedRules.primaryMetric.landmarks.join(",");
  const primaryRules = resolvedRules.rules.filter((rule) => rule.landmarks.join(",") === primaryLandmarks);
  const rules = primaryRules.length > 0 ? primaryRules : [resolvedRules.rules[0]];

  return {
    min: Math.min(...rules.map((rule) => rule.min)),
    max: Math.max(...rules.map((rule) => rule.max)),
    visibilityThreshold: Math.min(...rules.map((rule) => rule.visibilityThreshold)),
  };
}

function getEffectiveRepWindow(
  repWindow: Pick<ResolvedFormRule, "min" | "max" | "visibilityThreshold"> | null,
  observedRange: { min: number; max: number },
): Pick<ResolvedFormRule, "min" | "max" | "visibilityThreshold"> | null {
  if (!repWindow) return null;
  if (!Number.isFinite(observedRange.min) || !Number.isFinite(observedRange.max)) {
    return repWindow;
  }

  const span = observedRange.max - observedRange.min;
  if (span < 24) {
    return repWindow;
  }

  const dynamicMin = observedRange.min + (span * 0.2);
  const dynamicMax = observedRange.max - (span * 0.2);
  const min = Math.max(repWindow.min, Math.round(dynamicMin));
  const max = Math.min(repWindow.max, Math.round(dynamicMax));

  if (min >= max) {
    return repWindow;
  }

  return {
    min,
    max,
    visibilityThreshold: repWindow.visibilityThreshold,
  };
}

function dedupeFeedback(items: FormFeedback[]): FormFeedback[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getRunningRepAverage(repMetrics: FormRepMetric[]): number {
  if (repMetrics.length === 0) return 0;
  return Math.round(repMetrics.reduce((sum, rep) => sum + rep.score, 0) / repMetrics.length);
}

export default function FormChecker({ exerciseId, exerciseName, formRules, onClose }: FormCheckerProps) {
  const { videoRef, isReady, isLoading, error: camError, startCamera, stopCamera } = useWebcam({
    facingMode: "environment",
    zoom: 0.7,
  });

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });

  const detectorRef = useRef<PoseLandmarker | null>(null);
  const [detectorReady, setDetectorReady] = useState(false);
  const animationFrameRef = useRef<number>(0);
  const loopActiveRef = useRef(false);

  const [cameraStatus, setCameraStatus] = useState<FormCheckerCameraStatus>("calibrating");
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [feedback, setFeedback] = useState<FormFeedback[]>([]);
  const [jointStatusMap, setJointStatusMap] = useState<JointStatusMap>({});
  const [trackingInterrupted, setTrackingInterrupted] = useState(false);
  const [recentRepDetected, setRecentRepDetected] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationMessage, setCalibrationMessage] = useState("Hold still while we lock in your pose.");
  const [isSaving, setIsSaving] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [sessionAnalysis, setSessionAnalysis] = useState<FormSessionAnalysis | null>(null);
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [coachingError, setCoachingError] = useState("");
  const [startingDetection, setStartingDetection] = useState(false);
  const COACHING_TIMEOUT_MS = 180000;

  const tempoTrackerRef = useRef(new TempoTracker());
  const jitterDetectorRef = useRef(new JitterDetector());
  const landmarkSmootherRef = useRef(new LandmarkSmoother({
    positionAlpha: 0.52,
    visibilityAlpha: 0.42,
    visibilityDecay: 0.8,
    lowConfidenceThreshold: 0.55,
  }));
  const trackedRulesRef = useRef<Record<string, TrackedRuleState>>({});
  const calibrationGoodFramesRef = useRef(0);
  const calibrationBadFramesRef = useRef(0);
  const missingPoseFramesRef = useRef(0);
  const isDetectingRef = useRef(false);
  const lastDetectionMsRef = useRef(0);
  const primaryMissingFramesRef = useRef(0);
  const lastStableFeedbackKeyRef = useRef("");
  const isCalibratedRef = useRef(false);
  const sessionStartRef = useRef(performance.now());
  const sessionStartedRef = useRef(false);
  const repCountRef = useRef(0);
  const primaryAngleRef = useRef<number | null>(null);
  const currentRepSamplesRef = useRef<FormMetricSample[]>([]);
  const currentRepFeedbackRef = useRef<FormFeedback[]>([]);
  const completedRepMetricsRef = useRef<FormRepMetric[]>([]);
  const realtimeFeedbackLogRef = useRef<FormFeedback[]>([]);
  const recorderRef = useRef<LandmarkStreamRecorder | null>(null);
  const tempoCueExpiryRef = useRef(0);
  const tempTempoFeedbackRef = useRef<FormFeedback[]>([]);
  const finalizingRef = useRef(false);
  const scoringWarmupUntilRef = useRef(0);
  const observedPrimaryRangeRef = useRef<{ min: number; max: number }>({
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
  });
  const stableFeedbackRef = useRef<StableFeedbackState>({
    items: [],
    jointStatusMap: {},
    trackingInterrupted: false,
    recentRepDetectedUntilMs: 0,
  });

  const resolvedRules = useMemo(() => resolveExerciseFormRules(formRules), [formRules]);
  const rulesNotApplicable = resolvedRules?.applicability === "not_applicable";
  const postSetOnly = resolvedRules?.applicability === "post_set_only";
  const hasRealtimeRules = resolvedRules?.applicability === "realtime" && resolvedRules.rules.length > 0;
  const showFullHeightReview = Boolean(sessionAnalysis && sessionSaved && !isSaving);

  const updateCalibrationState = useCallback((value: boolean) => {
    isCalibratedRef.current = value;
    setIsCalibrated(value);
  }, []);

  const getRequiredLandmarks = useCallback((rules: ResolvedExerciseFormRules | null): number[] => {
    const base = [0, 11, 12, 23, 24, 25, 26, 27, 28];
    if (!rules) return base;
    const indices = new Set<number>([...base, ...rules.primaryMetric.landmarks]);
    for (const rule of rules.rules) {
      for (const index of rule.landmarks) indices.add(index);
    }
    return Array.from(indices);
  }, []);

  const getCalibrationLandmarks = useCallback((rules: ResolvedExerciseFormRules | null): number[] => {
    const base = [0, 11, 12, 23, 24];
    if (!rules) return base;
    const indices = new Set<number>([...base, ...rules.primaryMetric.landmarks]);
    for (const rule of rules.rules) {
      for (const index of rule.landmarks) {
        if (index !== 27 && index !== 28 && index !== 29 && index !== 30 && index !== 31 && index !== 32) {
          indices.add(index);
        }
      }
    }
    return Array.from(indices);
  }, []);

  const getVisibleRatio = useCallback((points: NormalizedLandmark[], indices: number[], threshold: number) => {
    if (indices.length === 0) return 0;
    const visible = indices.filter((index) => (points[index]?.visibility ?? 0) >= threshold).length;
    return visible / indices.length;
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
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoSize({
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
      });
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    handleLoadedMetadata();
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [videoRef, isReady]);

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

  const resetSessionState = useCallback(() => {
    tempoTrackerRef.current.reset();
    jitterDetectorRef.current.reset();
    landmarkSmootherRef.current.reset();
    trackedRulesRef.current = {};
    calibrationGoodFramesRef.current = 0;
    calibrationBadFramesRef.current = 0;
    missingPoseFramesRef.current = 0;
    isDetectingRef.current = false;
    lastDetectionMsRef.current = 0;
    primaryMissingFramesRef.current = 0;
    lastStableFeedbackKeyRef.current = "";
    updateCalibrationState(false);
    setCameraStatus("calibrating");
    setCalibrationMessage("Hold still while we lock in your pose.");
    setRepCount(0);
    repCountRef.current = 0;
    setFormScore(0);
    setFeedback([]);
    setJointStatusMap({});
    setTrackingInterrupted(false);
    setRecentRepDetected(false);
    setSessionSaved(false);
    setSessionAnalysis(null);
    setCoachingError("");
    setCoachingLoading(false);
    setStartingDetection(false);
    primaryAngleRef.current = null;
    currentRepSamplesRef.current = [];
    currentRepFeedbackRef.current = [];
    completedRepMetricsRef.current = [];
    realtimeFeedbackLogRef.current = [];
    tempTempoFeedbackRef.current = [];
    tempoCueExpiryRef.current = 0;
    scoringWarmupUntilRef.current = 0;
    observedPrimaryRangeRef.current = {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY,
    };
    stableFeedbackRef.current = {
      items: [],
      jointStatusMap: {},
      trackingInterrupted: false,
      recentRepDetectedUntilMs: 0,
    };
    recorderRef.current = new LandmarkStreamRecorder(getRequiredLandmarks(resolvedRules));
  }, [getRequiredLandmarks, resolvedRules, updateCalibrationState]);

  const maybeRequestCoaching = useCallback(async (analysis: FormSessionAnalysis): Promise<{ coaching: FormCoachingResult | null; cloudModel: string | null; }> => {
    if (!shouldUseCloudCoaching(formRules, { score: analysis.score, rules_confidence: analysis.rules_confidence, reps: analysis.reps })) {
      return { coaching: null, cloudModel: null };
    }

    setCoachingLoading(true);
    setCoachingError("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), COACHING_TIMEOUT_MS);
    try {
      const response = await fetch("/api/form-logs/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          exerciseName,
          formRules,
          analysis,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Coach request failed");
      }

      const payload = await response.json();
      return {
        coaching: payload.coaching ?? null,
        cloudModel: payload.model ?? null,
      };
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "AI coach timed out. Showing the local review instead."
          : error instanceof Error
            ? error.message
            : "Detailed coaching unavailable.";
      setCoachingError(message);
      return { coaching: null, cloudModel: null };
    } finally {
      window.clearTimeout(timeoutId);
      setCoachingLoading(false);
    }
  }, [exerciseName, formRules]);

  const persistSession = useCallback(async (analysis: FormSessionAnalysis): Promise<boolean> => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/form-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: exerciseId,
          ...analysis,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to save session");
      }
      setSessionSaved(true);
      return true;
    } catch (error) {
      console.error("Failed to save form session:", error);
      setSessionSaved(false);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [exerciseId]);

  const finalizeSession = useCallback(async () => {
    if (!sessionStartedRef.current || finalizingRef.current) return;
    finalizingRef.current = true;

    try {
      const durationMs = Math.round(performance.now() - sessionStartRef.current);
      const rulesConfidence = resolvedRules?.confidence ?? formRules?.confidence ?? 0;
      const realtimeFeedback = dedupeFeedback(realtimeFeedbackLogRef.current).slice(0, 20);
      const localAnalysis = buildSessionAnalysis({
        durationMs,
        realtimeScore: getRunningRepAverage(completedRepMetricsRef.current),
        rulesConfidence,
        reps: repCountRef.current,
        realtimeFeedback,
        repMetrics: completedRepMetricsRef.current,
        landmarkStream: recorderRef.current?.getSamples() ?? [],
        recorder: recorderRef.current ?? new LandmarkStreamRecorder(getRequiredLandmarks(resolvedRules)),
        coaching: null,
        usedCloudCoach: shouldUseCloudCoaching(formRules, { score: getRunningRepAverage(completedRepMetricsRef.current), rules_confidence: rulesConfidence, reps: repCountRef.current }),
        cloudModel: null,
      });

      let finalAnalysis = localAnalysis;
      const { coaching, cloudModel } = await maybeRequestCoaching(localAnalysis);
      if (coaching) {
        finalAnalysis = buildSessionAnalysis({
          durationMs,
          realtimeScore: getRunningRepAverage(completedRepMetricsRef.current),
          rulesConfidence,
          reps: repCountRef.current,
          realtimeFeedback,
          repMetrics: completedRepMetricsRef.current,
          landmarkStream: recorderRef.current?.getSamples() ?? [],
          recorder: recorderRef.current ?? new LandmarkStreamRecorder(getRequiredLandmarks(resolvedRules)),
          coaching,
          usedCloudCoach: true,
          cloudModel,
        });
      } else if (localAnalysis.used_cloud_coach) {
        finalAnalysis = {
          ...localAnalysis,
          analysis_status: "cloud_failed",
          cloud_model: cloudModel,
        };
      }

      const didSave = await persistSession(finalAnalysis);
      if (didSave) {
        setSessionAnalysis(finalAnalysis);
      } else {
        setSessionAnalysis(null);
        void startCamera();
      }
      sessionStartedRef.current = false;
    } finally {
      finalizingRef.current = false;
    }
  }, [formRules, getRequiredLandmarks, maybeRequestCoaching, persistSession, resolvedRules, startCamera]);

  const commitStableFeedback = useCallback((items: FormFeedback[], timestampMs: number, trackingLost = false) => {
    const now = performance.now();
    const nextJointStatusMap: JointStatusMap = {};

    for (const [index, visual] of Object.entries(stableFeedbackRef.current.jointStatusMap)) {
      if (visual.expiresAt > now) {
        nextJointStatusMap[Number(index)] = visual;
      }
    }

    for (const item of items) {
      if (!item.landmarkIndices) continue;
      const status = toJointStatus(item.type);
      if (status === "neutral") continue;

      for (const index of item.landmarkIndices) {
        const current = nextJointStatusMap[index];
        if (!current || getSeverityRank(status) >= getSeverityRank(current.status)) {
          nextJointStatusMap[index] = {
            status,
            expiresAt: now + DETECTION_CONFIG.feedbackTtlMs,
          };
        }
      }
    }

    const currentKeys = new Set(items.map((item) => `${item.type}:${item.message}`));
    const carriedItems = stableFeedbackRef.current.items.filter((item) => {
      const key = `${item.type}:${item.message}`;
      const itemTimestamp = item.timestampMs ?? timestampMs;
      return !currentKeys.has(key) && timestampMs - itemTimestamp <= DETECTION_CONFIG.feedbackTtlMs;
    });
    const stableItems = dedupeFeedback([...items, ...carriedItems]).slice(0, 8);
    stableFeedbackRef.current = {
      items: stableItems,
      jointStatusMap: nextJointStatusMap,
      trackingInterrupted: trackingLost,
      recentRepDetectedUntilMs: stableFeedbackRef.current.recentRepDetectedUntilMs,
    };

    const feedbackKey = getStableFeedbackKey(stableItems);
    if (feedbackKey !== lastStableFeedbackKeyRef.current) {
      lastStableFeedbackKeyRef.current = feedbackKey;
      setFeedback(stableItems);
    }
    setJointStatusMap(nextJointStatusMap);
    setTrackingInterrupted(trackingLost);
    setRecentRepDetected(timestampMs <= stableFeedbackRef.current.recentRepDetectedUntilMs);
  }, []);

  const updateTrackedRule = useCallback((
    rule: ResolvedFormRule,
    failed: boolean,
    canEvaluate: boolean,
    feedbackItem: FormFeedback,
    holdFrames: number,
    timestampMs: number,
  ): FormFeedback | null => {
    const existing = trackedRulesRef.current[rule.id] ?? {
      failFrames: 0,
      passFrames: 0,
      active: false,
      lastSeenMs: 0,
      severity: rule.severity,
      feedback: null,
    };

    if (!canEvaluate) {
      existing.passFrames += 1;
      if (existing.passFrames >= DETECTION_CONFIG.clearFrames) {
        existing.active = false;
        existing.feedback = null;
        existing.failFrames = 0;
      }
      trackedRulesRef.current[rule.id] = existing;
      return existing.active ? existing.feedback : null;
    }

    if (failed) {
      existing.failFrames += 1;
      existing.passFrames = 0;
      existing.lastSeenMs = timestampMs;
      existing.severity = feedbackItem.type;
      existing.feedback = feedbackItem;
      if (existing.failFrames >= holdFrames) {
        existing.active = true;
      }
    } else {
      existing.passFrames += 1;
      existing.failFrames = Math.max(0, existing.failFrames - 1);
      if (existing.passFrames >= DETECTION_CONFIG.clearFrames) {
        existing.active = false;
        existing.feedback = null;
      }
    }

    trackedRulesRef.current[rule.id] = existing;
    return existing.active ? existing.feedback : null;
  }, []);

  const detectionLoop = useCallback(() => {
    if (!loopActiveRef.current) return;

    if (!detectorRef.current || !videoRef.current || !isReady) {
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    const now = performance.now();
    if (isDetectingRef.current || now - lastDetectionMsRef.current < DETECTION_CONFIG.minFrameIntervalMs) {
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    isDetectingRef.current = true;
    lastDetectionMsRef.current = now;

    detectPose(detectorRef.current, videoRef.current, performance.now()).then((result) => {
      isDetectingRef.current = false;
      if (!loopActiveRef.current) return;

      if (!result) {
        missingPoseFramesRef.current += 1;
        const trackingLost = missingPoseFramesRef.current >= DETECTION_CONFIG.missingPoseGraceFrames;
        if (trackingLost) {
          setCameraStatus("not-detected");
          setLandmarks(null);
          updateCalibrationState(false);
          calibrationGoodFramesRef.current = 0;
          calibrationBadFramesRef.current = DETECTION_CONFIG.exitCalibrationFrames;
          primaryMissingFramesRef.current += 1;
          if (primaryMissingFramesRef.current >= DETECTION_CONFIG.primaryLossResetFrames) {
            primaryAngleRef.current = null;
            currentRepSamplesRef.current = [];
          }
        }
        const timestampMs = Math.max(0, Math.round(performance.now() - sessionStartRef.current));
        commitStableFeedback(stableFeedbackRef.current.items, timestampMs, trackingLost);
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      missingPoseFramesRef.current = 0;
      const smoothedLandmarks = landmarkSmootherRef.current.smooth(result);
      setLandmarks(smoothedLandmarks);
      if (startingDetection) {
        setStartingDetection(false);
      }
      const timestampMs = Math.max(0, Math.round(performance.now() - sessionStartRef.current));

      const angleStatus = detectCameraAngle(smoothedLandmarks, resolvedRules?.view ?? "side");
      const requiredLandmarks = getCalibrationLandmarks(resolvedRules);
      const requiredVisibility = requiredLandmarks.length > 0
        ? getVisibleRatio(smoothedLandmarks, requiredLandmarks, 0.45)
        : 0;

      jitterDetectorRef.current.addFrame(smoothedLandmarks);
      const calibrationVariance = requiredLandmarks.length > 0
        ? jitterDetectorRef.current.getAverageVariance(requiredLandmarks)
        : 0;

      const frameIsCalibrated =
        angleStatus === "good"
        && requiredVisibility >= 0.6
        && calibrationVariance <= 0.0045;

      if (!frameIsCalibrated) {
        calibrationGoodFramesRef.current = 0;
        calibrationBadFramesRef.current += 1;
        if (calibrationBadFramesRef.current >= DETECTION_CONFIG.exitCalibrationFrames) {
          updateCalibrationState(false);
        }
        const sustainedBadFrame = calibrationBadFramesRef.current >= DETECTION_CONFIG.exitCalibrationFrames;
        setCameraStatus(sustainedBadFrame ? (angleStatus === "good" ? "calibrating" : angleStatus) : (isCalibratedRef.current ? "good" : "calibrating"));
        if (angleStatus !== "good") {
          setCalibrationMessage("Adjust your camera so the expected view stays visible.");
        } else if (requiredVisibility < 0.6) {
          setCalibrationMessage("Keep your torso and the working joints visible in frame.");
        } else {
          setCalibrationMessage("Hold still for a moment so tracking can stabilize.");
        }
        commitStableFeedback(stableFeedbackRef.current.items, timestampMs, false);
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      calibrationBadFramesRef.current = 0;

      if (!isCalibratedRef.current) {
        calibrationGoodFramesRef.current += 1;
        setCameraStatus("calibrating");
        setCalibrationMessage("Great, stay steady for a second...");
        if (calibrationGoodFramesRef.current < DETECTION_CONFIG.enterCalibrationFrames) {
          commitStableFeedback([], timestampMs, false);
          animationFrameRef.current = requestAnimationFrame(detectionLoop);
          return;
        }
        updateCalibrationState(true);
        scoringWarmupUntilRef.current = timestampMs + 450;
      }

      setCameraStatus("good");

      const currentFeedback: FormFeedback[] = [];
      let currentPhase: "eccentric" | "concentric" | "unknown" = "unknown";
      const isScoringWarmup = timestampMs < scoringWarmupUntilRef.current;

      if (isRunning) {
        recorderRef.current?.addFrame(smoothedLandmarks, timestampMs);
      }

      const repWindow = getRepWindow(resolvedRules);
      const primaryVisible = Boolean(
        resolvedRules
        && repWindow
        && areLandmarksVisible(
          smoothedLandmarks,
          [...resolvedRules.primaryMetric.landmarks],
          Math.max(repWindow.visibilityThreshold, 0.55),
        ),
      );

      let primaryAngle = -1;
      if (primaryVisible && resolvedRules) {
        primaryMissingFramesRef.current = 0;
        primaryAngle = calculateAngle2D(
          smoothedLandmarks,
          resolvedRules.primaryMetric.landmarks[0],
          resolvedRules.primaryMetric.landmarks[1],
          resolvedRules.primaryMetric.landmarks[2],
        );
        if (primaryAngle >= 0) {
          observedPrimaryRangeRef.current = {
            min: Math.min(observedPrimaryRangeRef.current.min, primaryAngle),
            max: Math.max(observedPrimaryRangeRef.current.max, primaryAngle),
          };
          currentPhase = getMetricPhase(primaryAngleRef.current, primaryAngle, resolvedRules.primaryMetric.phaseLogic);
          primaryAngleRef.current = primaryAngle;
          currentRepSamplesRef.current.push({
            timestampMs,
            angle: primaryAngle,
            phase: currentPhase,
          });
        }
      } else {
        primaryMissingFramesRef.current += 1;
        if (primaryMissingFramesRef.current >= DETECTION_CONFIG.primaryLossResetFrames) {
          primaryAngleRef.current = null;
          currentRepSamplesRef.current = [];
        }
      }

      if (hasRealtimeRules && resolvedRules) {
        for (const rule of resolvedRules.rules) {
          if (!areLandmarksVisible(smoothedLandmarks, [...rule.landmarks], rule.visibilityThreshold)) {
            const retainedFeedback = updateTrackedRule(rule, false, false, {
              type: rule.severity,
              message: rule.cue,
              landmarkIndices: rule.landmarks,
              source: "rule",
              ruleId: rule.id,
              timestampMs,
            }, rule.holdFrames, timestampMs);
            if (retainedFeedback) currentFeedback.push(retainedFeedback);
            continue;
          }

          if (!shouldEvaluateRule(currentPhase, rule.phase)) {
            const retainedFeedback = updateTrackedRule(rule, false, false, {
              type: rule.severity,
              message: rule.cue,
              landmarkIndices: rule.landmarks,
              source: "rule",
              ruleId: rule.id,
              timestampMs,
            }, rule.holdFrames, timestampMs);
            if (retainedFeedback) currentFeedback.push(retainedFeedback);
            continue;
          }

          const angle = calculateAngle3D(smoothedLandmarks, rule.landmarks[0], rule.landmarks[1], rule.landmarks[2]);
          if (angle < 0) continue;

          const ruleVisibility = getLandmarkVisibility(smoothedLandmarks, [...rule.landmarks]);
          const adjusted = adjustThresholdForConfidence(rule.min, rule.max, resolvedRules.confidence);
          const visibilityPadding = ruleVisibility < 0.72 ? Math.round((0.72 - ruleVisibility) * 35) : 0;
          const effectiveMin = Math.max(0, adjusted.min - visibilityPadding);
          const effectiveMax = Math.min(180, adjusted.max + visibilityPadding);
          const effectiveHoldFrames = ruleVisibility < 0.72 ? rule.holdFrames + 2 : rule.holdFrames;
          const failed = !isScoringWarmup && (angle < effectiveMin || angle > effectiveMax);
          const existingFrames = trackedRulesRef.current[rule.id]?.failFrames ?? 0;
          const feedbackItem: FormFeedback = {
            type: downgradeSeverityForConfidence(rule.severity, resolvedRules.confidence, existingFrames > rule.holdFrames + 3),
            message: rule.cue,
            landmarkIndices: rule.landmarks,
            source: "rule",
            ruleId: rule.id,
            timestampMs,
          };
          const stableRuleFeedback = updateTrackedRule(rule, failed, true, feedbackItem, effectiveHoldFrames, timestampMs);
          if (stableRuleFeedback) currentFeedback.push(stableRuleFeedback);
        }
      }

      if (resolvedRules?.pattern.universalChecks.symmetry) {
        if (!isScoringWarmup && areLandmarksVisible(smoothedLandmarks, [11, 13, 15, 12, 14, 16], 0.55)) {
          const symmetry = getSymmetryChecks(smoothedLandmarks);
          if (symmetry.elbowSymmetry > 15 && symmetry.elbowSymmetry >= 0) {
            currentFeedback.push({
              type: "warning",
              message: "Uneven arm position",
              landmarkIndices: [11, 13, 15, 12, 14, 16],
              source: "symmetry",
              timestampMs,
            });
          }
        }
        if (!isScoringWarmup && areLandmarksVisible(smoothedLandmarks, [23, 25, 27, 24, 26, 28], 0.55)) {
          const symmetry = getSymmetryChecks(smoothedLandmarks);
          if (symmetry.kneeSymmetry > 15 && symmetry.kneeSymmetry >= 0) {
            currentFeedback.push({
              type: "warning",
              message: "Knee imbalance detected",
              landmarkIndices: [23, 25, 27, 24, 26, 28],
              source: "symmetry",
              timestampMs,
            });
          }
        }
      }

      if (resolvedRules?.pattern.universalChecks.spine) {
        if (!isScoringWarmup && areLandmarksVisible(smoothedLandmarks, [11, 12, 23, 24], 0.55)) {
          const spineAngle = checkSpinalAlignment(smoothedLandmarks);
          if (spineAngle > 0 && spineAngle < 30) {
            currentFeedback.push({
              type: "error",
              message: "Round your back less",
              landmarkIndices: [11, 12, 23, 24],
              source: "spine",
              timestampMs,
            });
          }
        }
      }

      if (!isScoringWarmup && resolvedRules?.pattern.universalChecks.stability) {
        const jittery = jitterDetectorRef.current.getJitteryJoints();
        if (jittery.size > 2) {
          currentFeedback.push({
            type: "warning",
            message: "Unstable movement, slow down",
            landmarkIndices: Array.from(jittery.keys()),
            source: "stability",
            timestampMs,
          });
        }
      }

      if (tempTempoFeedbackRef.current.length > 0 && timestampMs <= tempoCueExpiryRef.current) {
        currentFeedback.push(...tempTempoFeedbackRef.current);
      } else {
        tempTempoFeedbackRef.current = [];
      }

      const dedupedFeedback = dedupeFeedback(currentFeedback);
      commitStableFeedback(dedupedFeedback, timestampMs, false);

      currentRepFeedbackRef.current = dedupeFeedback([
        ...currentRepFeedbackRef.current,
        ...stableFeedbackRef.current.items,
      ]).slice(-8);
      realtimeFeedbackLogRef.current = dedupeFeedback([
        ...realtimeFeedbackLogRef.current,
        ...stableFeedbackRef.current.items,
      ]).slice(-20);

      if (primaryAngle >= 0 && repWindow && resolvedRules && currentPhase !== "unknown") {
        const effectiveRepWindow = getEffectiveRepWindow(repWindow, observedPrimaryRangeRef.current) ?? repWindow;
        const observedSpan = observedPrimaryRangeRef.current.max - observedPrimaryRangeRef.current.min;
        const hasEnoughRepRange = Number.isFinite(observedSpan) && observedSpan >= DETECTION_CONFIG.minRepRangeDegrees;
        const repResult = hasEnoughRepRange && tempoTrackerRef.current.checkRep(
            primaryAngle,
            effectiveRepWindow.min,
            effectiveRepWindow.max,
            resolvedRules.primaryMetric.phaseLogic,
          );
        if (repResult) {
          const nextRep = repCountRef.current + 1;
          const repMetric = summarizeRepSamples(
            nextRep,
            currentRepSamplesRef.current,
            currentRepFeedbackRef.current,
            resolvedRules.pattern,
          );
          if (repMetric) {
            completedRepMetricsRef.current.push(repMetric);
            setFormScore(getRunningRepAverage(completedRepMetricsRef.current));
            if (repMetric.tempoFlags.length > 0) {
              tempTempoFeedbackRef.current = repMetric.tempoFlags.map((flag) => ({
                type: flag === "eccentric_too_fast" ? "warning" : "info",
                message: flag === "eccentric_too_fast"
                  ? "Lower the weight more slowly."
                  : flag === "concentric_too_fast"
                    ? "Drive up smoothly instead of rushing."
                    : "Pause briefly at the bottom of the rep.",
                source: "tempo",
                timestampMs,
              }));
              tempoCueExpiryRef.current = timestampMs + 2200;
            }
          }

          repCountRef.current = nextRep;
          setRepCount(nextRep);
          stableFeedbackRef.current.recentRepDetectedUntilMs = timestampMs + 1200;
          setRecentRepDetected(true);
          currentRepSamplesRef.current = primaryAngle >= 0 ? [{
            timestampMs,
            angle: primaryAngle,
            phase: currentPhase,
          }] : [];
          currentRepFeedbackRef.current = [];
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    });
  }, [
    videoRef,
    isReady,
    resolvedRules,
    hasRealtimeRules,
    getCalibrationLandmarks,
    getVisibleRatio,
    updateCalibrationState,
    commitStableFeedback,
    updateTrackedRule,
    isRunning,
    startingDetection,
  ]);

  useEffect(() => {
    if (isRunning && isReady && detectorRef.current) {
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

  useEffect(() => {
    if (!showFullHeightReview) return;

    loopActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    stopCamera();
  }, [showFullHeightReview, stopCamera]);

  useEffect(() => () => {
    loopActiveRef.current = false;
    stopCamera();
    releasePoseDetector();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, [stopCamera]);

  const handleToggle = async () => {
    if (isRunning) {
      loopActiveRef.current = false;
      setIsRunning(false);
      stopCamera();
      await finalizeSession();
      return;
    }

    resetSessionState();
    sessionStartRef.current = performance.now();
    sessionStartedRef.current = true;
    setStartingDetection(true);
    setIsRunning(true);
  };

  const handleReset = () => {
    loopActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    setIsRunning(false);
    sessionStartedRef.current = false;
    setStartingDetection(false);
    resetSessionState();
    void startCamera();
  };

  const handleClose = async () => {
    if (isRunning) {
      loopActiveRef.current = false;
      setIsRunning(false);
      stopCamera();
      await finalizeSession();
    }
    setStartingDetection(false);
    onClose();
  };

  const startButtonLabel = () => {
    if (isRunning) return "Finish Set";
    if (!detectorReady || !isReady) return "Loading...";
    if (cameraStatus === "not-detected") return "Waiting for pose...";
    if (rulesNotApplicable) return "Not available";
    if (postSetOnly) return "Record Set";
    return "Start Detection";
  };

  const isButtonLoading = (!isReady || !detectorReady) && !isRunning;
  const isReviewing = coachingLoading || isSaving;
  const isBusy = isReviewing || startingDetection;

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
            disabled={isBusy}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Reset session"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleClose}
            disabled={isBusy}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {showFullHeightReview ? (
        <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--surface)]">
          <div className="min-h-full flex flex-col">
            <div className="px-4 py-4 bg-[var(--surface-overlay)] border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Post-set review</p>
                  <h3 className="text-base font-bold text-[var(--foreground)] truncate">Coach analysis complete</h3>
                </div>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                The camera has been stopped. Review the full set breakdown below before starting again.
              </p>
            </div>

            <div className="flex-1 min-h-0">
              <SessionSummaryCard analysis={sessionAnalysis} coachingLoading={coachingLoading} coachingError={coachingError} />
            </div>
          </div>
        </div>
      ) : (
        <div ref={canvasContainerRef} className="flex-1 min-h-0 relative bg-black overflow-hidden">
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
            jointStatusMap={jointStatusMap}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            sourceWidth={videoSize.width}
            sourceHeight={videoSize.height}
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
                  This exercise relies on post-set review. We will still record the movement pattern locally.
                </p>
              </div>
            </div>
          )}

          {isRunning && cameraStatus === "good" && isCalibrated && (
            <FeedbackPanel
              feedback={feedback}
              repCount={repCount}
              formScore={formScore}
              trackingInterrupted={trackingInterrupted}
              recentRepDetected={recentRepDetected}
            />
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
      )}

      <StartupOverlay visible={startingDetection} />
      <ReviewOverlay visible={isReviewing} />

      <div className="px-4 py-4 bg-[var(--surface-overlay)] border-t border-[var(--border)] z-20">
        <div className="flex gap-3 items-center">
          <Button
            onClick={handleToggle}
            disabled={!isReady || !detectorReady || cameraStatus === "not-detected" || rulesNotApplicable || isBusy}
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

          {isSaving && (
            <div className="flex items-center gap-2 px-4 py-2 text-[var(--muted-foreground)] text-sm font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </div>
          )}

          {sessionSaved && !isSaving && (
            <div className="flex items-center gap-2 px-4 py-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" /> Saved
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
