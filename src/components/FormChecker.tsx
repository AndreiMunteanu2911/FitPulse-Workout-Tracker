"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { X, RotateCcw, AlertTriangle, Loader2, SwitchCamera } from "lucide-react";
import Button from "@/components/Button";
import {
  CameraErrorOverlay,
  CameraGuideOverlay,
  FeedbackPanel,
  PostSetModeNotice,
  ReviewOverlay,
  PoseCanvas,
  StartupOverlay,
} from "@/components/form-checker/FormCheckerPanels";
import {
  getSeverityRank,
  toJointStatus,
  type DetectionCadenceConfig,
  type FormCheckerCameraStatus,
  type FormFeedback,
  type JointStatusMap,
  type StableFeedbackState,
  type TrackedRuleState,
} from "@/components/form-checker/types";
import { useWebcam } from "@/hooks/useWebcam";
import { initPoseDetector, detectPose, releasePoseDetector } from "@/lib/pose-detector";
import { apiFetch } from "@/services/api/apiFetch";
import type {
  ExerciseFormRules,
  FormCoachingResult,
  FormMetricSample,
  FormRepMetric,
  FormSessionAnalysis,
} from "@/types";
import {
  areLandmarksVisible,
  calculateAngle2D,
  detectCameraAngle,
  getLandmarkVisibility,
  getSymmetryChecks,
  checkSpinalAlignment,
  LandmarkSmoother,
  TempoTracker,
  JitterDetector,
} from "@/lib/form-geometry";
import { evaluateFormRule, resolveExerciseFormRules, type ResolvedExerciseFormRules, type ResolvedFormRule } from "@/lib/form-rules";
import {
  LandmarkStreamRecorder,
  adjustThresholdForConfidence,
  buildSessionAnalysis,
  categorizeFeedback,
  downgradeSeverityForConfidence,
  getMetricPhase,
  getScoreBand,
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

type CameraFacingMode = "user" | "environment";
type TrackingQuality = "good" | "limited" | "lost";

const DETECTION_CONFIG: DetectionCadenceConfig = {
  targetFps: 28,
  minFrameIntervalMs: Math.round(1000 / 28),
  missingPoseGraceFrames: 5,
  enterCalibrationFrames: 12,
  exitCalibrationFrames: 7,
  feedbackTtlMs: 1700,
  clearFrames: 14,
  minRepRangeDegrees: 16,
  primaryLossResetFrames: 8,
};

const STABILITY_WARNING_MIN_JOINTS = 5;
const STABILITY_WARNING_MIN_VARIANCE = 0.011;
const ARM_SYMMETRY_WARNING_DEGREES = 42;
const KNEE_SYMMETRY_WARNING_DEGREES = 26;
const RULE_HOLD_FRAME_BONUS = 2;

function getStableFeedbackKey(items: FormFeedback[]): string {
  return items.map((item) => `${item.type}:${item.message}`).join("|");
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
  const topIssues = analysis.feedback_json.topIssues.slice(0, 6);
  const scoreBand = getScoreBand(analysis.score);
  const trackingHint = analysis.feedback_json.scoring?.trackingHint;
  const scoreColor = analysis.score >= 90
    ? "text-emerald-500"
    : analysis.score >= 75
      ? "text-[var(--primary-600)]"
      : analysis.score >= 60
      ? "text-amber-500"
      : "text-red-500";

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <section className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
              Set review
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
              {scoreBand.label} form
            </h3>
            {trackingHint && (
              <p className="mt-2 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">
                {trackingHint}
              </p>
            )}
          </div>
          <div className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-raised)]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">{scoreBand.label}</p>
            <p className={`text-2xl font-extrabold leading-none ${scoreColor}`}>{analysis.score}%</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-3">
            <p className="text-[var(--muted-foreground)]">Realtime</p>
            <p className="mt-1 font-bold text-[var(--foreground)]">{analysis.realtime_score}%</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-3">
            <p className="text-[var(--muted-foreground)]">Post-set</p>
            <p className="mt-1 font-bold text-[var(--foreground)]">{analysis.postset_score}%</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-3 py-3">
            <p className="text-[var(--muted-foreground)]">Reps</p>
            <p className="mt-1 font-bold text-[var(--foreground)]">{analysis.reps}</p>
          </div>
        </div>
      </section>

      {topIssues.length > 0 && (
        <section className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 sm:p-5">
          <p className="mb-3 text-sm font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
            Main cues
          </p>
          {topIssues.map((item, index) => (
            <div key={`${item.message}-${index}`} className="flex items-start gap-2 py-1.5 text-sm text-[var(--foreground)]">
              <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.type === "error" ? "text-red-400" : item.type === "warning" ? "text-amber-400" : "text-sky-400"}`} />
              <span>{item.message}</span>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>AI Coach review</p>
          {coachingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary-500)]" />}
        </div>
        {coaching ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-[var(--foreground)]">{coaching.summary}</p>
            {coaching.top_cues.slice(0, 3).map((cue, index) => (
              <p key={`${cue}-${index}`} className="text-xs text-[var(--muted-foreground)]">- {cue}</p>
            ))}
          </div>
        ) : coachingError ? (
          <p className="text-xs text-amber-400">{coachingError}</p>
        ) : (
          <p className="text-xs text-[var(--muted-foreground)]">
            {analysis.used_cloud_coach ? "Reviewing your set..." : "Local-only summary used for this set."}
          </p>
        )}
      </section>

    </div>
  );
}

function getRepWindow(
  resolvedRules: ResolvedExerciseFormRules | null,
): Pick<ResolvedFormRule, "min" | "max" | "visibilityThreshold"> | null {
  if (!resolvedRules || resolvedRules.rules.length === 0) return null;
  const primaryLandmarks = resolvedRules.primaryMetric.landmarks.join(",");
  const angleRules = resolvedRules.rules.filter((rule) => (rule.kind ?? "angle") === "angle" && rule.landmarks.length >= 3);
  const primaryRules = angleRules.filter((rule) => rule.landmarks.join(",") === primaryLandmarks);
  const rules = primaryRules.length > 0 ? primaryRules : angleRules;
  if (rules.length === 0) return null;

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

function getRepCountingWindow(
  repWindow: Pick<ResolvedFormRule, "min" | "max" | "visibilityThreshold"> | null,
  observedRange: { min: number; max: number },
): Pick<ResolvedFormRule, "min" | "max" | "visibilityThreshold"> | null {
  if (!repWindow) return null;
  if (!Number.isFinite(observedRange.min) || !Number.isFinite(observedRange.max)) {
    return repWindow;
  }

  const span = observedRange.max - observedRange.min;
  if (span < DETECTION_CONFIG.minRepRangeDegrees) {
    return repWindow;
  }

  return {
    min: Math.round(observedRange.min + (span * 0.18)),
    max: Math.round(observedRange.max - (span * 0.18)),
    visibilityThreshold: Math.min(repWindow.visibilityThreshold, 0.42),
  };
}

function getTrackingQuality({
  angleStatus,
  requiredVisibility,
  calibrationVariance,
  primaryTrackingLost,
}: {
  angleStatus: ReturnType<typeof detectCameraAngle>;
  requiredVisibility: number;
  calibrationVariance: number;
  primaryTrackingLost: boolean;
}): TrackingQuality {
  if (primaryTrackingLost || requiredVisibility < 0.35) return "lost";
  if (angleStatus !== "good" || requiredVisibility < 0.6 || calibrationVariance > 0.012) return "limited";
  return "good";
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

function getActiveFeedbackPenalty(items: FormFeedback[]): number {
  const grouped = new Map<string, FormFeedback>();
  for (const item of items) {
    if (item.effect === "cue_only" || item.effect === "rep_gate") continue;
    const category = item.category ?? categorizeFeedback(item);
    const existing = grouped.get(category);
    if (!existing || getFeedbackSeverityRank(item.type) > getFeedbackSeverityRank(existing.type)) {
      grouped.set(category, { ...item, category });
    }
  }

  const penalty = Array.from(grouped.values()).reduce((sum, item) => {
    const confidence = item.confidence ?? 1;
    const multiplier = confidence >= 0.75 ? 1 : confidence >= 0.55 ? 0.6 : 0.25;
    if (item.type === "error") return sum + Math.round(16 * multiplier);
    if (item.type === "warning") return sum + Math.round(7 * multiplier);
    return sum;
  }, 0);
  return Math.min(30, penalty);
}

function getFeedbackSeverityRank(type: FormFeedback["type"]): number {
  if (type === "error") return 3;
  if (type === "warning") return 2;
  return 1;
}

function getAdjustedRunningScore(rawScore: number, activeFeedback: FormFeedback[]): number {
  if (rawScore <= 0) return 0;
  return Math.max(0, rawScore - getActiveFeedbackPenalty(activeFeedback));
}

function isNearPhaseEndpoint({
  phase,
  phaseLogic,
  angle,
  repWindow,
  confidence,
}: {
  phase: "eccentric" | "concentric" | "unknown";
  phaseLogic?: ExerciseFormRules["primaryMetric"]["phaseLogic"];
  angle: number;
  repWindow: Pick<ResolvedFormRule, "min" | "max" | "visibilityThreshold"> | null;
  confidence: number;
}): boolean {
  if (phase === "unknown" || angle < 0 || !repWindow) return false;

  const logic = phaseLogic ?? "flexion_extension";
  const movingTowardMin = logic === "flexion_extension" || logic === "cyclic"
    ? phase === "eccentric"
    : logic === "extension_flexion"
      ? phase === "concentric"
      : phase === "eccentric";
  const target = movingTowardMin ? repWindow.min : repWindow.max;
  const tolerance = confidence < 0.72 ? 16 : 12;

  return Math.abs(angle - target) <= tolerance;
}

function enrichFeedbackConfidence(items: FormFeedback[], landmarks: NormalizedLandmark[]): FormFeedback[] {
  return items.map((item) => ({
    ...item,
    category: item.category ?? categorizeFeedback(item),
    confidence: item.confidence ?? (
      item.landmarkIndices && item.landmarkIndices.length > 0
        ? getLandmarkVisibility(landmarks, item.landmarkIndices)
        : 1
    ),
  }));
}

function capitalizeFirstWord(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

export default function FormChecker({ exerciseId, exerciseName, formRules, onClose }: FormCheckerProps) {
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>("environment");
  const { videoRef, isReady, isLoading, error: camError, startCamera, stopCamera } = useWebcam({
    facingMode: cameraFacingMode,
    zoom: 0.7,
    autoStart: false,
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
  const [trackingQuality, setTrackingQuality] = useState<TrackingQuality>("limited");
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
  const visualLandmarkSmootherRef = useRef(new LandmarkSmoother({
    positionAlpha: 0.74,
    visibilityAlpha: 0.58,
    visibilityDecay: 0.8,
    lowConfidenceThreshold: 0.55,
  }));
  const ruleLandmarkSmootherRef = useRef(new LandmarkSmoother({
    positionAlpha: 0.42,
    visibilityAlpha: 0.36,
    visibilityDecay: 0.88,
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
  const currentRepGateFailuresRef = useRef(0);
  const completedRepMetricsRef = useRef<FormRepMetric[]>([]);
  const realtimeFeedbackLogRef = useRef<FormFeedback[]>([]);
  const previousEvaluationLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const previousEvaluationTimestampRef = useRef<number | null>(null);
  const recorderRef = useRef<LandmarkStreamRecorder | null>(null);
  const tempoCueExpiryRef = useRef(0);
  const tempTempoFeedbackRef = useRef<FormFeedback[]>([]);
  const finalizingRef = useRef(false);
  const reviewModeRef = useRef(false);
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

  useEffect(() => {
    if (!reviewModeRef.current) {
      void startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const resetSessionState = useCallback(() => {
    reviewModeRef.current = false;
    tempoTrackerRef.current.reset();
    jitterDetectorRef.current.reset();
    visualLandmarkSmootherRef.current.reset();
    ruleLandmarkSmootherRef.current.reset();
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
    setLandmarks(null);
    setFeedback([]);
    setJointStatusMap({});
    setTrackingInterrupted(false);
    setTrackingQuality("limited");
    setRecentRepDetected(false);
    setSessionSaved(false);
    setSessionAnalysis(null);
    setCoachingError("");
    setCoachingLoading(false);
    setStartingDetection(false);
    primaryAngleRef.current = null;
    currentRepSamplesRef.current = [];
    currentRepFeedbackRef.current = [];
    currentRepGateFailuresRef.current = 0;
    completedRepMetricsRef.current = [];
    realtimeFeedbackLogRef.current = [];
    previousEvaluationLandmarksRef.current = null;
    previousEvaluationTimestampRef.current = null;
    tempTempoFeedbackRef.current = [];
    tempoCueExpiryRef.current = 0;
    scoringWarmupUntilRef.current = 0;
    tempoTrackerRef.current.reset();
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
      const payload = await apiFetch<{ coaching?: FormCoachingResult | null; model?: string | null }>("/api/form-logs/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          exerciseName,
          formRules,
          analysis,
        }),
      });
      return {
        coaching: payload.coaching ?? null,
        cloudModel: payload.model ?? null,
      };
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "AI coach timed out. Showing the local review instead."
          : "AI coach returned an unreadable review. Showing the local review instead.";
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
      await apiFetch("/api/form-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: exerciseId,
          ...analysis,
        }),
      });
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
      const rawRealtimeScore = getRunningRepAverage(completedRepMetricsRef.current);
      const localAnalysis = buildSessionAnalysis({
        durationMs,
        realtimeScore: rawRealtimeScore,
        rulesConfidence,
        reps: repCountRef.current,
        realtimeFeedback,
        repMetrics: completedRepMetricsRef.current,
        landmarkStream: recorderRef.current?.getSamples() ?? [],
        recorder: recorderRef.current ?? new LandmarkStreamRecorder(getRequiredLandmarks(resolvedRules)),
        coaching: null,
        usedCloudCoach: shouldUseCloudCoaching(formRules, { score: rawRealtimeScore, rules_confidence: rulesConfidence, reps: repCountRef.current }),
        cloudModel: null,
      });

      let finalAnalysis = localAnalysis;
      const { coaching, cloudModel } = await maybeRequestCoaching(localAnalysis);
      if (coaching) {
        finalAnalysis = buildSessionAnalysis({
          durationMs,
          realtimeScore: rawRealtimeScore,
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
        reviewModeRef.current = true;
        setSessionAnalysis(finalAnalysis);
        stopCamera();
      } else {
        setSessionAnalysis(null);
        if (!reviewModeRef.current) {
          void startCamera();
        }
      }
      sessionStartedRef.current = false;
    } finally {
      finalizingRef.current = false;
      setStartingDetection(false);
    }
  }, [formRules, getRequiredLandmarks, maybeRequestCoaching, persistSession, resolvedRules, startCamera, stopCamera]);

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
        if (isRunning && trackingLost && completedRepMetricsRef.current.length > 0) {
          const trackingPenalty: FormFeedback = {
            type: "warning",
            message: "Tracking interrupted",
            source: "stability",
            category: "tracking",
            confidence: 0.35,
            timestampMs,
          };
          const runningAverage = getRunningRepAverage(completedRepMetricsRef.current);
          setFormScore(getAdjustedRunningScore(runningAverage, [trackingPenalty]));
        }
        commitStableFeedback(stableFeedbackRef.current.items, timestampMs, trackingLost);
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      missingPoseFramesRef.current = 0;
      const visualLandmarks = visualLandmarkSmootherRef.current.smooth(result);
      const smoothedLandmarks = ruleLandmarkSmootherRef.current.smooth(result);
      setLandmarks(visualLandmarks);
      if (startingDetection) {
        setStartingDetection(false);
      }
      const timestampMs = Math.max(0, Math.round(performance.now() - sessionStartRef.current));

      const requiredLandmarks = getCalibrationLandmarks(resolvedRules);
      const requiredVisibility = requiredLandmarks.length > 0
        ? getVisibleRatio(smoothedLandmarks, requiredLandmarks, 0.45)
        : 0;
      const angleStatus = detectCameraAngle(smoothedLandmarks, resolvedRules?.view ?? "side");

      jitterDetectorRef.current.addFrame(smoothedLandmarks);
      const calibrationVariance = requiredLandmarks.length > 0
        ? jitterDetectorRef.current.getAverageVariance(requiredLandmarks)
        : 0;

      const requiredVisibilityThreshold = isCalibratedRef.current || isRunning ? 0.5 : 0.6;
      const calibrationVarianceThreshold = isCalibratedRef.current || isRunning ? 0.012 : 0.0045;
      const keepRunningDespiteDrift = isRunning && isCalibratedRef.current && requiredVisibility >= 0.35;
      const frameIsCalibrated =
        keepRunningDespiteDrift
        || (
          requiredVisibility >= requiredVisibilityThreshold
          && calibrationVariance <= calibrationVarianceThreshold
        );

      if (!frameIsCalibrated) {
        calibrationGoodFramesRef.current = 0;
        calibrationBadFramesRef.current += 1;
        if (calibrationBadFramesRef.current >= DETECTION_CONFIG.exitCalibrationFrames) {
          updateCalibrationState(false);
        }
        const sustainedBadFrame = calibrationBadFramesRef.current >= DETECTION_CONFIG.exitCalibrationFrames;
        setCameraStatus(sustainedBadFrame ? "calibrating" : (isCalibratedRef.current ? "good" : "calibrating"));
        if (requiredVisibility < requiredVisibilityThreshold) {
          setCalibrationMessage("Keep your torso and the working joints visible in frame.");
        } else {
          setCalibrationMessage("Hold still for a moment so tracking can stabilize.");
        }
        if (isRunning && sustainedBadFrame && completedRepMetricsRef.current.length > 0) {
          const calibrationPenalty: FormFeedback = {
            type: "warning",
            message: "Movement is too unstable to score cleanly",
            source: "stability",
            category: "tracking",
            confidence: 0.4,
            timestampMs,
          };
          const runningAverage = getRunningRepAverage(completedRepMetricsRef.current);
          setFormScore(getAdjustedRunningScore(runningAverage, [calibrationPenalty]));
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
          isRunning
            ? Math.min(repWindow.visibilityThreshold, 0.42)
            : Math.max(repWindow.visibilityThreshold, 0.55),
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
          currentRepGateFailuresRef.current = 0;
          observedPrimaryRangeRef.current = {
            min: Number.POSITIVE_INFINITY,
            max: Number.NEGATIVE_INFINITY,
          };
          tempoTrackerRef.current.reset();
        }
      }

      const primaryTrackingLost = Boolean(
        isRunning
        && resolvedRules
        && repWindow
        && primaryMissingFramesRef.current >= DETECTION_CONFIG.primaryLossResetFrames,
      );
      const currentTrackingQuality = getTrackingQuality({
        angleStatus,
        requiredVisibility,
        calibrationVariance,
        primaryTrackingLost,
      });
      setTrackingQuality(currentTrackingQuality);

      if (primaryTrackingLost) {
        trackedRulesRef.current = {};
        currentRepFeedbackRef.current = [];
        commitStableFeedback([], timestampMs, true);
        previousEvaluationLandmarksRef.current = smoothedLandmarks.map((landmark) => ({ ...landmark }));
        previousEvaluationTimestampRef.current = timestampMs;
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      if (currentTrackingQuality !== "good") {
        trackedRulesRef.current = {};
      }

      if (hasRealtimeRules && resolvedRules && currentTrackingQuality === "good") {
        const effectiveRepWindowForRules = getEffectiveRepWindow(repWindow, observedPrimaryRangeRef.current) ?? repWindow;
        for (const rule of resolvedRules.rules) {
          if (!shouldEvaluateRule(currentPhase, rule.phase)) {
            const retainedFeedback = updateTrackedRule(rule, false, false, {
              type: rule.severity,
              message: rule.cue,
              landmarkIndices: rule.landmarks,
              source: "rule",
              ruleId: rule.id,
              category: rule.category,
              effect: rule.effect,
              timestampMs,
            }, rule.holdFrames + RULE_HOLD_FRAME_BONUS, timestampMs);
            if (retainedFeedback) currentFeedback.push(retainedFeedback);
            continue;
          }

          const adjusted = (rule.kind ?? "angle") === "angle"
            ? adjustThresholdForConfidence(rule.min, rule.max, resolvedRules.confidence)
            : { min: rule.min, max: rule.max };
          const evaluation = evaluateFormRule(
            { ...rule, min: adjusted.min, max: adjusted.max },
            smoothedLandmarks,
            {
              currentPhase,
              timestampMs,
              previousLandmarks: previousEvaluationLandmarksRef.current,
              previousTimestampMs: previousEvaluationTimestampRef.current,
              scoringWarmup: isScoringWarmup,
            },
          );
          const endpointReady = rule.evaluationTiming !== "phase_endpoint"
            || isNearPhaseEndpoint({
              phase: currentPhase,
              phaseLogic: resolvedRules.primaryMetric.phaseLogic,
              angle: primaryAngle,
              repWindow: effectiveRepWindowForRules,
              confidence: evaluation.confidence,
            });
          if (!endpointReady) {
            const retainedFeedback = updateTrackedRule(rule, false, false, {
              type: rule.severity,
              message: rule.cue,
              landmarkIndices: evaluation.landmarkIndices,
              source: "rule",
              ruleId: rule.id,
              category: evaluation.category,
              confidence: evaluation.confidence,
              effect: evaluation.effect,
              timestampMs,
            }, rule.holdFrames + RULE_HOLD_FRAME_BONUS, timestampMs);
            if (retainedFeedback) currentFeedback.push(retainedFeedback);
            continue;
          }
          if (!evaluation.evaluable) {
            const retainedFeedback = updateTrackedRule(rule, false, false, {
              type: rule.severity,
              message: rule.cue,
              landmarkIndices: evaluation.landmarkIndices,
              source: "rule",
              ruleId: rule.id,
              category: evaluation.category,
              confidence: evaluation.confidence,
              effect: evaluation.effect,
              timestampMs,
            }, rule.holdFrames + RULE_HOLD_FRAME_BONUS, timestampMs);
            if (retainedFeedback) currentFeedback.push(retainedFeedback);
            continue;
          }

          const existingFrames = trackedRulesRef.current[rule.id]?.failFrames ?? 0;
          const feedbackItem: FormFeedback = {
            type: downgradeSeverityForConfidence(rule.severity, resolvedRules.confidence, existingFrames > rule.holdFrames + 3),
            message: rule.cue,
            landmarkIndices: evaluation.landmarkIndices,
            source: "rule",
            ruleId: rule.id,
            category: evaluation.category,
            confidence: evaluation.confidence,
            effect: evaluation.effect,
            timestampMs,
          };
          const baseHoldFrames = evaluation.effect === "rep_gate" && feedbackItem.type === "error"
            ? Math.max(2, rule.holdFrames - 2)
            : rule.holdFrames;
          const effectiveHoldFrames = baseHoldFrames
            + RULE_HOLD_FRAME_BONUS
            + (feedbackItem.type === "warning" ? 2 : 0)
            + (evaluation.confidence < 0.72 && evaluation.effect !== "rep_gate" ? 2 : 0);
          const stableRuleFeedback = updateTrackedRule(rule, evaluation.failed, true, feedbackItem, effectiveHoldFrames, timestampMs);
          if (stableRuleFeedback) {
            currentFeedback.push(stableRuleFeedback);
            if (evaluation.effect === "rep_gate" && stableRuleFeedback.type !== "info") {
              currentRepGateFailuresRef.current += 1;
            }
          }
        }
      }

      if (currentTrackingQuality === "good" && resolvedRules?.pattern.universalChecks.symmetry && resolvedRules.view !== "side") {
        if (!isScoringWarmup && areLandmarksVisible(smoothedLandmarks, [11, 13, 15, 12, 14, 16], 0.72)) {
          const symmetry = getSymmetryChecks(smoothedLandmarks);
          if (symmetry.elbowSymmetry > ARM_SYMMETRY_WARNING_DEGREES && symmetry.elbowSymmetry >= 0) {
            currentFeedback.push({
              type: "warning",
              message: "Uneven arm position",
              landmarkIndices: [11, 13, 15, 12, 14, 16],
              source: "symmetry",
              category: "symmetry",
              effect: "cue_only",
              timestampMs,
            });
          }
        }
        if (!isScoringWarmup && areLandmarksVisible(smoothedLandmarks, [23, 25, 27, 24, 26, 28], 0.72)) {
          const symmetry = getSymmetryChecks(smoothedLandmarks);
          if (symmetry.kneeSymmetry > KNEE_SYMMETRY_WARNING_DEGREES && symmetry.kneeSymmetry >= 0) {
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

      if (currentTrackingQuality === "good" && resolvedRules?.pattern.universalChecks.spine) {
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

      if (!isScoringWarmup && currentTrackingQuality === "good" && resolvedRules?.pattern.universalChecks.stability) {
        const jittery = jitterDetectorRef.current.getJitteryJoints();
        const requiredLandmarks = getRequiredLandmarks(resolvedRules);
        const averageVariance = jitterDetectorRef.current.getAverageVariance(requiredLandmarks);
        if (jittery.size >= STABILITY_WARNING_MIN_JOINTS && averageVariance >= STABILITY_WARNING_MIN_VARIANCE) {
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

      const dedupedFeedback = dedupeFeedback(enrichFeedbackConfidence(currentFeedback, smoothedLandmarks));
      commitStableFeedback(dedupedFeedback, timestampMs, primaryTrackingLost);

      const activeScoredFeedback = stableFeedbackRef.current.items.filter(
        (item) => item.type === "error" || item.type === "warning",
      );
      const runningAverage = getRunningRepAverage(completedRepMetricsRef.current);
      if (runningAverage > 0) {
        setFormScore(getAdjustedRunningScore(runningAverage, activeScoredFeedback));
      }

      currentRepFeedbackRef.current = dedupeFeedback([
        ...currentRepFeedbackRef.current,
        ...stableFeedbackRef.current.items,
      ]).slice(-8);
      realtimeFeedbackLogRef.current = dedupeFeedback([
        ...realtimeFeedbackLogRef.current,
        ...stableFeedbackRef.current.items,
      ]).slice(-20);

      if (primaryAngle >= 0 && repWindow && resolvedRules && currentPhase !== "unknown") {
        const effectiveRepWindow = getRepCountingWindow(repWindow, observedPrimaryRangeRef.current) ?? repWindow;
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
            setFormScore(getAdjustedRunningScore(
              getRunningRepAverage(completedRepMetricsRef.current),
              activeScoredFeedback,
            ));
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
          currentRepGateFailuresRef.current = 0;
        }
      }

      previousEvaluationLandmarksRef.current = smoothedLandmarks.map((landmark) => ({ ...landmark }));
      previousEvaluationTimestampRef.current = timestampMs;
      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    });
  }, [
    videoRef,
    isReady,
    resolvedRules,
    hasRealtimeRules,
    getCalibrationLandmarks,
    getRequiredLandmarks,
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

    reviewModeRef.current = true;
    loopActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    setLandmarks(null);
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
      setLandmarks(null);
      stopCamera();
      await finalizeSession();
      return;
    }

    reviewModeRef.current = false;
    resetSessionState();
    sessionStartRef.current = performance.now();
    sessionStartedRef.current = true;
    setStartingDetection(true);
    if (!isReady) {
      await startCamera();
    }
    setIsRunning(true);
  };

  const handleReset = () => {
    reviewModeRef.current = false;
    loopActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    setIsRunning(false);
    sessionStartedRef.current = false;
    setStartingDetection(false);
    setLandmarks(null);
    resetSessionState();
    void startCamera();
  };

  const handleSwitchCamera = () => {
    const nextFacingMode = cameraFacingMode === "environment" ? "user" : "environment";
    reviewModeRef.current = false;
    setLandmarks(null);
    stopCamera();
    resetSessionState();
    setStartingDetection(false);
    setCameraFacingMode(nextFacingMode);
  };

  const handleClose = async () => {
    reviewModeRef.current = true;
    if (isRunning) {
      loopActiveRef.current = false;
      setIsRunning(false);
      setLandmarks(null);
      stopCamera();
      await finalizeSession();
    }
    setStartingDetection(false);
    onClose();
  };

  const startButtonLabel = () => {
    if (showFullHeightReview) return "Start Again";
    if (isRunning) return "Finish Set";
    if (!detectorReady || !isReady) return "Loading...";
    if (cameraStatus === "not-detected") return "Waiting for pose...";
    if (rulesNotApplicable) return "Not available";
    if (postSetOnly) return "Record Set";
    return "Start Detection";
  };

  const isButtonLoading = !showFullHeightReview && (!isReady || !detectorReady) && !isRunning;
  const isReviewing = coachingLoading || isSaving;
  const showStartupOverlay = startingDetection || (isRunning && !landmarks && cameraStatus !== "not-detected");
  const isBusy = isReviewing || startingDetection;
  const canSwitchCamera = !isRunning && !isBusy && !isLoading && !showFullHeightReview;
  const primaryActionDisabled =
    rulesNotApplicable
    || isBusy
    || !detectorReady
    || (!showFullHeightReview && (!isReady || cameraStatus === "not-detected"));

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-end justify-between px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] bg-black/80 z-20">
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">{capitalizeFirstWord(exerciseName)}</h2>
        </div>
        <div className="flex items-center gap-2">
          {!showFullHeightReview && (
            <button
              onClick={handleSwitchCamera}
              disabled={!canSwitchCamera}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
              title={`Switch to ${cameraFacingMode === "environment" ? "front" : "back"} camera`}
              aria-label={`Switch to ${cameraFacingMode === "environment" ? "front" : "back"} camera`}
            >
              <SwitchCamera className="h-4 w-4 text-white" />
            </button>
          )}
          <button
            onClick={handleReset}
            disabled={isBusy}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Reset session"
            aria-label="Reset session"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleClose}
            disabled={isBusy}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Close"
            aria-label="Close form checker"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {showFullHeightReview ? (
        <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--background)]">
          <div className="min-h-full flex flex-col">
            <div className="px-4 py-4 bg-[var(--surface)] border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Post-set review</p>
                  <h3 className="text-base font-extrabold text-[var(--foreground)] truncate" style={{ fontFamily: "var(--font-poppins)" }}>
                    Coach analysis complete
                  </h3>
                </div>
              </div>
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
            className="absolute inset-0 h-full w-full bg-black object-cover"
            autoPlay
            playsInline
            muted
            style={{
              opacity: isReady ? 1 : 0,
              transform: cameraFacingMode === "user" ? "scaleX(-1)" : undefined,
            }}
          />

          <PoseCanvas
            landmarks={landmarks}
            jointStatusMap={jointStatusMap}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            sourceWidth={videoSize.width}
            sourceHeight={videoSize.height}
            mirrorX={cameraFacingMode === "user"}
          />
          <CameraGuideOverlay
            status={cameraStatus}
            calibrationMessage={calibrationMessage}
            showCalibration={isRunning && !isCalibrated}
          />

          {isRunning && (rulesNotApplicable || postSetOnly) && cameraStatus === "good" && (
            <PostSetModeNotice />
          )}

          {isRunning && cameraStatus === "good" && isCalibrated && (
            <FeedbackPanel
              feedback={feedback}
              repCount={repCount}
              formScore={formScore}
              trackingInterrupted={trackingInterrupted}
              trackingLimited={trackingQuality === "limited"}
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
            <CameraErrorOverlay error={camError} onRetry={startCamera} />
          )}
        </div>
      )}

      <StartupOverlay visible={showStartupOverlay} />
      <ReviewOverlay visible={isReviewing} />

      <div className="px-4 py-4 bg-[var(--surface-overlay)] border-t border-[var(--border)] z-20">
        <div className="flex gap-3 items-center">
          <Button
            onClick={handleToggle}
            disabled={primaryActionDisabled}
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

        </div>
      </div>
    </div>
  );
}
