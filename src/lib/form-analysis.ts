import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type {
  ExerciseFormRules,
  FormCoachingResult,
  FormLandmarkSample,
  FormMetricSample,
  FormRepMetric,
  FormRulePhase,
  FormSessionAnalysis,
  FormSessionFeedbackItem,
  FormWorstSegment,
} from "@/types";
import type { FormPatternDefinition } from "@/lib/form-rules";
import type { PrimaryMetricPhaseLogic } from "@/types";

export const FORM_DETECTOR_VERSION = "mediapipe-pose-landmarker-0.10.34";
const LANDMARK_SAMPLE_INTERVAL_MS = 100;
const MAX_LANDMARK_SAMPLES = 900;
const MAX_FEEDBACK_ITEMS = 8;

export function getMetricPhase(
  previousAngle: number | null,
  currentAngle: number,
  phaseLogic: PrimaryMetricPhaseLogic = "flexion_extension",
): Exclude<FormRulePhase, "both"> | "unknown" {
  if (previousAngle === null) return "unknown";
  const delta = currentAngle - previousAngle;
  if (Math.abs(delta) < 1.25) return "unknown";

  const movingTowardMin = phaseLogic === "flexion_extension" || phaseLogic === "cyclic"
    ? delta < 0
    : phaseLogic === "extension_flexion"
      ? delta > 0
      : delta < 0;

  return movingTowardMin ? "eccentric" : "concentric";
}

export function shouldEvaluateRule(
  currentPhase: Exclude<FormRulePhase, "both"> | "unknown",
  rulePhase: FormRulePhase,
): boolean {
  if (rulePhase === "both") return true;
  if (currentPhase === "unknown") return false;
  return currentPhase === rulePhase;
}

export function adjustThresholdForConfidence(min: number, max: number, confidence: number) {
  if (confidence >= 0.75) {
    return { min, max };
  }

  const widenBy = Math.round((0.75 - confidence) * 40);
  return {
    min: Math.max(0, min - widenBy),
    max: Math.min(180, max + widenBy),
  };
}

export function downgradeSeverityForConfidence(
  severity: FormSessionFeedbackItem["type"],
  confidence: number,
  repeatedFailure: boolean,
): FormSessionFeedbackItem["type"] {
  if (confidence >= 0.75 || repeatedFailure) return severity;
  if (severity === "error") return "warning";
  return severity;
}

export function compressLandmarks(
  landmarks: NormalizedLandmark[],
  indices: number[],
  timestampMs: number,
): FormLandmarkSample {
  return {
    timestampMs: Math.round(timestampMs),
    landmarks: indices
      .map((index) => {
        const point = landmarks[index];
        if (!point) return null;
        return {
          index,
          x: Number(point.x.toFixed(4)),
          y: Number(point.y.toFixed(4)),
          z: Number((point.z ?? 0).toFixed(4)),
          visibility: Number((point.visibility ?? 0).toFixed(3)),
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value)),
  };
}

export class LandmarkStreamRecorder {
  private samples: FormLandmarkSample[] = [];
  private lastSampleMs = -LANDMARK_SAMPLE_INTERVAL_MS;

  constructor(private readonly indices: number[]) {}

  addFrame(landmarks: NormalizedLandmark[], timestampMs: number): void {
    if (timestampMs - this.lastSampleMs < LANDMARK_SAMPLE_INTERVAL_MS) return;
    this.lastSampleMs = timestampMs;
    this.samples.push(compressLandmarks(landmarks, this.indices, timestampMs));
    if (this.samples.length > MAX_LANDMARK_SAMPLES) {
      this.samples.shift();
    }
  }

  getSamples(): FormLandmarkSample[] {
    return this.samples.slice();
  }

  getRange(startMs: number, endMs: number): FormLandmarkSample[] {
    return this.samples.filter((sample) => sample.timestampMs >= startMs && sample.timestampMs <= endMs);
  }

  reset(): void {
    this.samples = [];
    this.lastSampleMs = -LANDMARK_SAMPLE_INTERVAL_MS;
  }
}

export function summarizeRepSamples(
  repIndex: number,
  samples: FormMetricSample[],
  feedback: FormSessionFeedbackItem[],
  pattern: FormPatternDefinition | null,
): FormRepMetric | null {
  if (samples.length < 2) return null;

  const startMs = samples[0].timestampMs;
  const endMs = samples[samples.length - 1].timestampMs;
  const durationMs = Math.max(0, endMs - startMs);
  const minAngle = Math.min(...samples.map((sample) => sample.angle));
  const maxAngle = Math.max(...samples.map((sample) => sample.angle));

  let eccentricMs = 0;
  let concentricMs = 0;
  let topPauseMs = 0;
  let bottomPauseMs = 0;

  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1];
    const current = samples[i];
    const deltaMs = current.timestampMs - previous.timestampMs;

    if (current.phase === "eccentric") eccentricMs += deltaMs;
    else if (current.phase === "concentric") concentricMs += deltaMs;
    else if (Math.abs(current.angle - maxAngle) < 6) topPauseMs += deltaMs;
    else if (Math.abs(current.angle - minAngle) < 6) bottomPauseMs += deltaMs;
  }

  const tempoFlags: string[] = [];
  if (pattern?.tempo) {
    if (eccentricMs > 0 && eccentricMs < pattern.tempo.eccentricSeconds * 1000 * 0.7) tempoFlags.push("eccentric_too_fast");
    if (concentricMs > 0 && concentricMs < pattern.tempo.concentricSeconds * 1000 * 0.6) tempoFlags.push("concentric_too_fast");
    if (pattern.tempo.pauseSeconds > 0 && bottomPauseMs < pattern.tempo.pauseSeconds * 1000 * 0.5) tempoFlags.push("pause_too_short");
  }

  const penalty = feedback.reduce((sum, item) => sum + (item.type === "error" ? 15 : item.type === "warning" ? 6 : 2), 0)
    + (tempoFlags.length * 5);
  const warningCount = feedback.filter((item) => item.type === "warning").length;
  const errorCount = feedback.filter((item) => item.type === "error").length;
  const infoCount = feedback.filter((item) => item.type === "info").length;
  let score = Math.max(0, 100 - penalty);

  // Keep single-issue reps in a believable "good but imperfect" band.
  if (errorCount === 0 && warningCount === 1 && tempoFlags.length === 0) {
    score = Math.max(score, 84);
  }
  if (errorCount === 0 && warningCount === 0 && infoCount <= 1 && tempoFlags.length <= 1) {
    score = Math.max(score, 92);
  }
  if (errorCount === 0 && warningCount <= 2 && tempoFlags.length <= 1) {
    score = Math.max(score, 74);
  }
  if (errorCount === 1 && warningCount <= 1 && tempoFlags.length <= 1) {
    score = Math.max(score, 68);
  }

  return {
    repIndex,
    startMs,
    endMs,
    durationMs,
    eccentricMs,
    concentricMs,
    topPauseMs,
    bottomPauseMs,
    minAngle: Math.round(minAngle),
    maxAngle: Math.round(maxAngle),
    score,
    feedback: feedback.slice(0, MAX_FEEDBACK_ITEMS),
    tempoFlags,
  };
}

export function buildWorstSegment(
  repMetrics: FormRepMetric[],
  recorder: LandmarkStreamRecorder,
): FormWorstSegment | null {
  if (repMetrics.length === 0) return null;
  const worstRep = repMetrics.reduce((worst, current) => (current.score < worst.score ? current : worst), repMetrics[0]);
  return {
    startMs: worstRep.startMs,
    endMs: worstRep.endMs,
    repIndex: worstRep.repIndex,
    score: worstRep.score,
    feedback: worstRep.feedback,
    samples: recorder.getRange(worstRep.startMs, worstRep.endMs),
  };
}

function dedupeFeedback(items: FormSessionFeedbackItem[]): FormSessionFeedbackItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildFeedbackSummary(
  realtimeFeedback: FormSessionFeedbackItem[],
  postsetFeedback: FormSessionFeedbackItem[],
  coaching: FormCoachingResult | null,
): string {
  const merged = dedupeFeedback([...realtimeFeedback, ...postsetFeedback]);
  const topMessages = merged.slice(0, 3).map((item) => item.message);
  if (coaching?.summary) topMessages.unshift(coaching.summary);
  return topMessages.slice(0, 3).join(" ");
}

function getRepAverageScore(repMetrics: FormRepMetric[]): number {
  if (repMetrics.length === 0) return 0;
  return Math.round(repMetrics.reduce((sum, rep) => sum + rep.score, 0) / repMetrics.length);
}

function getConsistencyPenalty(repMetrics: FormRepMetric[]): number {
  if (repMetrics.length <= 1) return 0;

  let penalty = 0;
  const scores = repMetrics.map((rep) => rep.score);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + ((score - average) ** 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev > 14) penalty += 3;
  if (stdDev > 20) penalty += 5;

  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  const drop = firstAvg - secondAvg;
  if (drop > 12) penalty += 3;
  if (drop > 20) penalty += 5;

  const tempoFaults = repMetrics.reduce((sum, rep) => sum + rep.tempoFlags.length, 0);
  penalty += Math.min(6, tempoFaults);

  return penalty;
}

export function buildPostsetFeedback(repMetrics: FormRepMetric[]): FormSessionFeedbackItem[] {
  if (repMetrics.length === 0) return [];

  const items: FormSessionFeedbackItem[] = [];
  const inconsistent = repMetrics.some((rep) => rep.score < 70);
  if (inconsistent) {
    items.push({ type: "warning", message: "Your rep quality dropped during the set.", source: "tempo" });
  }

  const rushedEccentric = repMetrics.some((rep) => rep.tempoFlags.includes("eccentric_too_fast"));
  if (rushedEccentric) {
    items.push({ type: "warning", message: "Slow down the lowering phase for better control.", source: "tempo" });
  }

  const rushedConcentric = repMetrics.some((rep) => rep.tempoFlags.includes("concentric_too_fast"));
  if (rushedConcentric) {
    items.push({ type: "info", message: "Drive up smoothly instead of bouncing through the rep.", source: "tempo" });
  }

  return items.slice(0, MAX_FEEDBACK_ITEMS);
}

export function buildSessionAnalysis(params: {
  durationMs: number;
  realtimeScore: number;
  rulesConfidence: number;
  reps: number;
  realtimeFeedback: FormSessionFeedbackItem[];
  repMetrics: FormRepMetric[];
  landmarkStream: FormLandmarkSample[];
  recorder: LandmarkStreamRecorder;
  coaching: FormCoachingResult | null;
  usedCloudCoach: boolean;
  cloudModel?: string | null;
}): FormSessionAnalysis {
  const {
    durationMs,
    realtimeScore,
    rulesConfidence,
    reps,
    realtimeFeedback,
    repMetrics,
    landmarkStream,
    recorder,
    coaching,
    usedCloudCoach,
    cloudModel,
  } = params;

  const postsetFeedback = buildPostsetFeedback(repMetrics);
  const avgRepScore = getRepAverageScore(repMetrics);
  const consistencyPenalty = getConsistencyPenalty(repMetrics);
  const postsetScore = repMetrics.length > 0
    ? Math.max(0, avgRepScore - consistencyPenalty)
    : 0;
  const score = postsetScore;
  const topIssues = dedupeFeedback([...realtimeFeedback, ...postsetFeedback]).slice(0, MAX_FEEDBACK_ITEMS);
  const worstSegment = buildWorstSegment(repMetrics, recorder);
  const feedbackSummary = repMetrics.length === 0
    ? "No rep detected. Make sure a full rep is visible before finishing the set."
    : buildFeedbackSummary(realtimeFeedback, postsetFeedback, coaching);

  return {
    score,
    realtime_score: repMetrics.length > 0 ? realtimeScore : 0,
    postset_score: postsetScore,
    reps,
    duration_ms: durationMs,
    detector_version: FORM_DETECTOR_VERSION,
    rules_confidence: rulesConfidence,
    analysis_status: coaching ? "cloud_complete" : (usedCloudCoach ? "cloud_failed" : "local_only"),
    feedback_summary: feedbackSummary,
    feedback_json: {
      topIssues,
      realtime: realtimeFeedback.slice(0, 20),
      postset: postsetFeedback,
      coaching,
    },
    rep_metrics_json: repMetrics,
    landmark_stream_json: landmarkStream,
    worst_segment_json: worstSegment,
    used_cloud_coach: usedCloudCoach,
    cloud_model: cloudModel ?? null,
  };
}

export function shouldUseCloudCoaching(
  formRules: ExerciseFormRules | null,
  analysis: Pick<FormSessionAnalysis, "score" | "rules_confidence" | "reps">,
): boolean {
  void formRules;
  void analysis;
  return true;
}
