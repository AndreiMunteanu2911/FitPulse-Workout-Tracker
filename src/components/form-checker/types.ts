import type { FormSessionFeedbackItem } from "@/types";

export type FormCheckerCameraStatus = "good" | "front-view" | "back-view" | "too-far" | "not-detected" | "calibrating";
export type FormFeedback = FormSessionFeedbackItem;
export type JointVisualStatus = "neutral" | "warning" | "error";

export interface TrackedRuleState {
  failFrames: number;
  passFrames: number;
  active: boolean;
  lastSeenMs: number;
  severity: FormFeedback["type"];
  feedback: FormFeedback | null;
}

export interface StableJointStatus {
  status: JointVisualStatus;
  expiresAt: number;
}

export type JointStatusMap = Record<number, StableJointStatus>;

export interface StableFeedbackState {
  items: FormFeedback[];
  jointStatusMap: JointStatusMap;
  trackingInterrupted: boolean;
  recentRepDetectedUntilMs: number;
}

export interface DetectionCadenceConfig {
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

export function getSeverityRank(status: JointVisualStatus): number {
  if (status === "error") return 2;
  if (status === "warning") return 1;
  return 0;
}

export function toJointStatus(type: FormFeedback["type"]): JointVisualStatus {
  if (type === "error") return "error";
  if (type === "warning") return "warning";
  return "neutral";
}
