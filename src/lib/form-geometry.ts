// ── Geometry & Biomechanics Utilities ────────────────────────────────────────
// Client-only module. Angle calculation, symmetry checks, spine alignment,
// tempo tracking, and camera angle detection.
// ─────────────────────────────────────────────────────────────────────────────

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

// ── Angle Calculation ────────────────────────────────────────────────────────

/**
 * Calculate the 2D angle (in degrees) between three landmarks.
 * The angle is at point B (the vertex) between A and C.
 * Uses normalized coordinates (0-1 range from MediaPipe).
 */
export function calculateAngle2D(
  landmarks: NormalizedLandmark[],
  aIdx: number,
  bIdx: number,
  cIdx: number,
): number {
  const A = landmarks[aIdx];
  const B = landmarks[bIdx];
  const C = landmarks[cIdx];

  if (!A || !B || !C) return -1;

  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

/**
 * Calculate the 3D angle (in degrees) between three landmarks.
 * Uses the z-coordinate from MediaPipe (less accurate than x/y).
 */
export function calculateAngle3D(
  landmarks: NormalizedLandmark[],
  aIdx: number,
  bIdx: number,
  cIdx: number,
): number {
  const A = landmarks[aIdx];
  const B = landmarks[bIdx];
  const C = landmarks[cIdx];

  if (!A || !B || !C) return -1;

  const BA = { x: A.x - B.x, y: A.y - B.y, z: (A.z ?? 0) - (B.z ?? 0) };
  const BC = { x: C.x - B.x, y: C.y - B.y, z: (C.z ?? 0) - (B.z ?? 0) };

  const dot = BA.x * BC.x + BA.y * BC.y + BA.z * BC.z;
  const magBA = Math.sqrt(BA.x ** 2 + BA.y ** 2 + BA.z ** 2);
  const magBC = Math.sqrt(BC.x ** 2 + BC.y ** 2 + BC.z ** 2);

  if (magBA === 0 || magBC === 0) return -1;

  const cosAngle = Math.min(1, Math.max(-1, dot / (magBA * magBC)));
  return (Math.acos(cosAngle) * 180.0) / Math.PI;
}

// ── Symmetry Check ───────────────────────────────────────────────────────────

/**
 * Compare left and right side joint angles.
 * Returns the absolute difference in degrees.
 * Example: elbow symmetry = |L elbow angle - R elbow angle|
 */
export function checkSymmetry(
  landmarks: NormalizedLandmark[],
  leftPoints: [number, number, number],
  rightPoints: [number, number, number],
): number {
  const leftAngle = calculateAngle2D(landmarks, leftPoints[0], leftPoints[1], leftPoints[2]);
  const rightAngle = calculateAngle2D(landmarks, rightPoints[0], rightPoints[1], rightPoints[2]);

  if (leftAngle < 0 || rightAngle < 0) return -1;
  return Math.abs(leftAngle - rightAngle);
}

/**
 * Common symmetry checks for form assessment.
 * Returns a map of check name → difference in degrees.
 */
export function getSymmetryChecks(landmarks: NormalizedLandmark[]): Record<string, number> {
  // Elbow symmetry (shoulder-elbow-wrist on both sides)
  const elbowSym = checkSymmetry(landmarks, [11, 13, 15], [12, 14, 16]);
  // Knee symmetry (hip-knee-ankle on both sides)
  const kneeSym = checkSymmetry(landmarks, [23, 25, 27], [24, 26, 28]);
  // Hip level (left vs right hip y-position)
  const hipLevel = landmarks[23] && landmarks[24] ? Math.abs(landmarks[23].y - landmarks[24].y) : -1;
  // Shoulder level
  const shoulderLevel = landmarks[11] && landmarks[12] ? Math.abs(landmarks[11].y - landmarks[12].y) : -1;

  return {
    elbowSymmetry: elbowSym,
    kneeSymmetry: kneeSym,
    hipLevel,
    shoulderLevel,
  };
}

// ── Spinal Alignment ─────────────────────────────────────────────────────────

/**
 * Check if the spine is neutral by measuring the angle between
 * shoulder line and hip line. A neutral spine should be relatively straight.
 *
 * Returns the shoulder-hip angle. Values close to 180° = straight spine.
 * Lower values = rounded forward or arched back.
 */
export function checkSpinalAlignment(landmarks: NormalizedLandmark[]): number {
  // Use midpoint of shoulders and midpoint of hips
  const shoulderMid = {
    x: (landmarks[11].x + landmarks[12].x) / 2,
    y: (landmarks[11].y + landmarks[12].y) / 2,
    z: ((landmarks[11].z ?? 0) + (landmarks[12].z ?? 0)) / 2,
  };
  const hipMid = {
    x: (landmarks[23].x + landmarks[24].x) / 2,
    y: (landmarks[23].y + landmarks[24].y) / 2,
    z: ((landmarks[23].z ?? 0) + (landmarks[24].z ?? 0)) / 2,
  };
  const nose = landmarks[0];

  if (!nose) return -1;

  // Angle: shoulder-mid → hip-mid → (hypothetical knee)
  // Simplified: check if nose is roughly aligned with hip-shoulder line
  const angle = Math.atan2(hipMid.y - shoulderMid.y, hipMid.x - shoulderMid.x);
  // Convert to degrees from vertical
  let degrees = Math.abs((angle * 180) / Math.PI);
  if (degrees > 90) degrees = 180 - degrees;
  return degrees;
}

// ── Camera Angle Detection ──────────────────────────────────────────────────

/**
 * Detect if the camera view is suitable for form checking.
 * Returns "good", "front", "back", "too-far", or "not-detected".
 *
 * Heuristics:
 * - If L/R shoulders overlap horizontally (x-diff < threshold) → front/back view
 * - If landmarks are too small (body too far) → too-far
 * - If too many landmarks missing → not-detected
 */
export function detectCameraAngle(
  landmarks: NormalizedLandmark[],
  overlapThreshold = 0.08,
): "good" | "front" | "back" | "too-far" | "not-detected" {
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lHip = landmarks[23];
  const rHip = landmarks[24];

  if (!lShoulder || !rShoulder || !lHip || !rHip) return "not-detected";

  // Check shoulder overlap (front/back view detection)
  const shoulderXDiff = Math.abs(lShoulder.x - rShoulder.x);
  const hipXDiff = Math.abs(lHip.x - rHip.x);

  if (shoulderXDiff < overlapThreshold && hipXDiff < overlapThreshold) {
    // Determine front vs back by checking nose position relative to shoulders
    const nose = landmarks[0];
    const shoulderMidX = (lShoulder.x + rShoulder.x) / 2;
    if (nose && Math.abs(nose.x - shoulderMidX) < overlapThreshold) {
      return "front";
    }
    return "back";
  }

  // Check if body is too small in frame (too far from camera)
  const bodyHeight = Math.abs(landmarks[0].y - landmarks[23].y);
  if (bodyHeight < 0.15) return "too-far";

  return "good";
}

// ── Tempo Tracking ───────────────────────────────────────────────────────────

interface TempoState {
  phaseStartTime: number;
  lastRepCount: number;
  repTimestamps: number[];
}

/**
 * Simple rep counter and tempo tracker.
 * Detects repetitions by tracking when a joint angle crosses a threshold.
 */
export class TempoTracker {
  private state: TempoState;
  private readonly thresholdWindow = 500; // ms — min time between reps

  constructor() {
    this.state = {
      phaseStartTime: performance.now(),
      lastRepCount: 0,
      repTimestamps: [],
    };
  }

  /**
   * Check if a rep was completed based on angle crossing the threshold.
   * Returns true if a new rep was counted.
   */
  checkRep(angle: number, minAngle: number, maxAngle: number): boolean {
    const now = performance.now();
    if (now - this.state.phaseStartTime < this.thresholdWindow) return false;

    // Simple: count when angle goes from outside range to inside range
    const wasInRange = this.isInRange(this.state.lastRepCount > 0 ? 0 : 0, minAngle, maxAngle);
    const isInRange = this.isInRange(angle, minAngle, maxAngle);

    if (!wasInRange && isInRange) {
      this.state.lastRepCount++;
      this.state.repTimestamps.push(now);
      this.state.phaseStartTime = now;
      return true;
    }
    return false;
  }

  private isInRange(angle: number, min: number, max: number): boolean {
    return angle >= min && angle <= max;
  }

  get repCount(): number {
    return this.state.lastRepCount;
  }

  /**
   * Get average rep tempo (seconds per rep) over recent reps.
   */
  getAvgTempo(): number | null {
    const timestamps = this.state.repTimestamps;
    if (timestamps.length < 2) return null;

    const recent = timestamps.slice(-5); // Last 5 reps
    const intervals: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      intervals.push((recent[i] - recent[i - 1]) / 1000);
    }
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  reset(): void {
    this.state = {
      phaseStartTime: performance.now(),
      lastRepCount: 0,
      repTimestamps: [],
    };
  }
}

// ── Movement Jitter Detection ────────────────────────────────────────────────

/**
 * Detect unstable movement by tracking landmark position variance over frames.
 * High jitter = wobbling/unstable form.
 */
export class JitterDetector {
  private history: Record<number, Array<{ x: number; y: number; z: number }>> = {};
  private readonly maxFrames = 15;
  private readonly jitterThreshold = 0.005; // Normalized coordinate variance

  /**
   * Add a frame of landmark data. Call every detection frame.
   */
  addFrame(landmarks: NormalizedLandmark[]): void {
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm) continue;
      if (!this.history[i]) this.history[i] = [];
      this.history[i].push({ x: lm.x, y: lm.y, z: lm.z ?? 0 });
      if (this.history[i].length > this.maxFrames) {
        this.history[i].shift();
      }
    }
  }

  /**
   * Get joints with excessive jitter (variance above threshold).
   * Returns map of landmark index → jitter score (0 = stable, 1 = very unstable).
   */
  getJitteryJoints(): Map<number, number> {
    const result = new Map<number, number>();

    for (const [idxStr, positions] of Object.entries(this.history)) {
      if (positions.length < 5) continue;

      const idx = parseInt(idxStr);
      const variance = this.calculateVariance(positions);
      const jitterScore = Math.min(1, variance / (this.jitterThreshold * 10));

      if (variance > this.jitterThreshold) {
        result.set(idx, jitterScore);
      }
    }

    return result;
  }

  private calculateVariance(positions: Array<{ x: number; y: number; z: number }>): number {
    const n = positions.length;
    const meanX = positions.reduce((s, p) => s + p.x, 0) / n;
    const meanY = positions.reduce((s, p) => s + p.y, 0) / n;

    let totalVar = 0;
    for (const p of positions) {
      totalVar += (p.x - meanX) ** 2 + (p.y - meanY) ** 2;
    }
    return totalVar / n;
  }

  reset(): void {
    this.history = {};
  }
}

// ── Landmark Projection to Canvas ────────────────────────────────────────────

/**
 * Convert normalized MediaPipe landmarks (0-1) to canvas pixel coordinates.
 * MediaPipe uses flipped x-axis (0 = right, 1 = left).
 */
export function projectLandmark(
  lm: NormalizedLandmark,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  return {
    x: (1 - lm.x) * canvasWidth, // Flip x
    y: lm.y * canvasHeight,
  };
}

/**
 * Project all 33 landmarks to canvas coordinates.
 */
export function projectAllLandmarks(
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number,
): Array<{ x: number; y: number } | null> {
  return landmarks.map((lm) => (lm ? projectLandmark(lm, canvasWidth, canvasHeight) : null));
}

// ── Pose Connection Map (Skeleton) ────────────────────────────────────────────

/**
 * Pairs of landmark indices that form the skeleton lines for visualization.
 */
export const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7], // Left face
  [0, 4], [4, 5], [5, 6], [6, 8], // Right face
  [9, 10], // Mouth
  [11, 12], // Shoulders
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], // Left arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], // Right arm
  [11, 23], [12, 24], // Torso
  [23, 24], // Hips
  [23, 25], [25, 27], [27, 29], [27, 31], // Left leg
  [24, 26], [26, 28], [28, 30], [28, 32], // Right leg
];
