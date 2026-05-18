import { describe, expect, it } from "vitest";
import {
  LandmarkStreamRecorder,
  adjustThresholdForConfidence,
  buildFeedbackSummary,
  buildPostsetFeedback,
  buildSessionAnalysis,
  buildWorstSegment,
  categorizeFeedback,
  compressLandmarks,
  downgradeSeverityForConfidence,
  getMetricPhase,
  getScoreBand,
  shouldEvaluateRule,
  summarizeRepSamples,
} from "./form-analysis";
import type { FormRepMetric, FormSessionFeedbackItem } from "@/types";

describe("form analysis scoring helpers", () => {
  it("maps scores to bands", () => {
    expect(getScoreBand(95).value).toBe("excellent");
    expect(getScoreBand(80).value).toBe("good");
    expect(getScoreBand(65).value).toBe("needs_work");
    expect(getScoreBand(40).value).toBe("poor");
  });

  it("categorizes feedback by explicit category, source, and message text", () => {
    expect(categorizeFeedback({ type: "warning", message: "camera lost tracking", source: "stability" })).toBe("tracking");
    expect(categorizeFeedback({ type: "warning", message: "slow down", source: "tempo" })).toBe("tempo");
    expect(categorizeFeedback({ type: "error", message: "reach depth", source: "rule" })).toBe("range_of_motion");
    expect(categorizeFeedback({ type: "error", message: "back rounding", source: "spine" })).toBe("posture");
  });

  it("handles phase and confidence adjustments", () => {
    expect(getMetricPhase(null, 90)).toBe("unknown");
    expect(getMetricPhase(100, 95)).toBe("eccentric");
    expect(getMetricPhase(95, 100)).toBe("concentric");
    expect(shouldEvaluateRule("eccentric", "eccentric")).toBe(true);
    expect(shouldEvaluateRule("unknown", "eccentric")).toBe(false);
    expect(adjustThresholdForConfidence(70, 110, 0.5)).toEqual({ min: 60, max: 120 });
    expect(downgradeSeverityForConfidence("error", 0.5, false)).toBe("warning");
    expect(downgradeSeverityForConfidence("error", 0.5, true)).toBe("error");
  });
});

describe("form analysis samples and reps", () => {
  it("compresses landmarks and throttles recorded frames", () => {
    const landmarks = [
      { x: 0.12345, y: 0.98765, z: 0.33333, visibility: 0.91234 },
      { x: 0.2, y: 0.3 },
    ];
    expect(compressLandmarks(landmarks, [0, 2], 15.7)).toEqual({
      timestampMs: 16,
      landmarks: [{ index: 0, x: 0.1235, y: 0.9877, z: 0.3333, visibility: 0.912 }],
    });

    const recorder = new LandmarkStreamRecorder([0]);
    recorder.addFrame(landmarks, 0);
    recorder.addFrame(landmarks, 50);
    recorder.addFrame(landmarks, 100);
    expect(recorder.getSamples()).toHaveLength(2);
    expect(recorder.getRange(0, 50)).toHaveLength(1);
    recorder.reset();
    expect(recorder.getSamples()).toHaveLength(0);
  });

  it("summarizes reps, tempo flags, and worst segments", () => {
    const feedback: FormSessionFeedbackItem[] = [
      { type: "warning", message: "Slow down", source: "tempo", confidence: 1 },
      { type: "error", message: "Reach full depth", source: "rule", confidence: 1 },
    ];
    const rep = summarizeRepSamples(1, [
      { timestampMs: 0, angle: 120, phase: "unknown" },
      { timestampMs: 300, angle: 90, phase: "eccentric" },
      { timestampMs: 700, angle: 125, phase: "concentric" },
    ], feedback, { id: "squat", name: "Squat", tempo: { eccentricSeconds: 2, pauseSeconds: 1, concentricSeconds: 1 } } as never);

    expect(rep).toMatchObject({
      repIndex: 1,
      minAngle: 90,
      maxAngle: 125,
      tempoFlags: expect.arrayContaining(["eccentric_too_fast", "concentric_too_fast", "pause_too_short"]),
    });

    const recorder = new LandmarkStreamRecorder([0]);
    recorder.addFrame([{ x: 0, y: 0, z: 0, visibility: 1 }], 0);
    recorder.addFrame([{ x: 1, y: 1, z: 1, visibility: 1 }], 100);
    expect(buildWorstSegment([rep as FormRepMetric], recorder)).toMatchObject({ repIndex: 1, score: rep?.score });
  });
});

describe("form session analysis", () => {
  it("builds post-set feedback and final analysis", () => {
    const repMetrics: FormRepMetric[] = [
      {
        repIndex: 1,
        startMs: 0,
        endMs: 1000,
        durationMs: 1000,
        eccentricMs: 300,
        concentricMs: 300,
        topPauseMs: 0,
        bottomPauseMs: 0,
        minAngle: 80,
        maxAngle: 120,
        score: 65,
        trackingConfidence: 0.5,
        feedback: [],
        tempoFlags: ["eccentric_too_fast"],
      },
    ];
    const postset = buildPostsetFeedback(repMetrics);
    expect(postset.map((item) => item.message)).toContain("Your rep quality dropped during the set.");
    expect(buildFeedbackSummary([{ type: "warning", message: "One", source: "rule" }], postset, null)).toContain("One");

    const analysis = buildSessionAnalysis({
      durationMs: 1000,
      realtimeScore: 70,
      rulesConfidence: 0.7,
      reps: 1,
      realtimeFeedback: [],
      repMetrics,
      landmarkStream: [],
      recorder: new LandmarkStreamRecorder([0]),
      coaching: null,
      usedCloudCoach: false,
    });

    expect(analysis).toMatchObject({
      score: 65,
      realtime_score: 70,
      postset_score: 65,
      reps: 1,
      analysis_status: "local_only",
      used_cloud_coach: false,
    });
    expect(analysis.feedback_json.scoring?.trackingHint).toBe("Tracking was unstable, score may be approximate.");
  });
});
