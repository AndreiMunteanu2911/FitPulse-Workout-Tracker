// ── MediaPipe Pose Detector ─────────────────────────────────────────────────
// Client-only module. Initializes MediaPipe Pose and provides a detect function.
// Must be used in "use client" components.
// ─────────────────────────────────────────────────────────────────────────────

import {
  PoseLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

let poseLandmarker: PoseLandmarker | null = null;
let initializingPromise: Promise<PoseLandmarker> | null = null;

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";
const TASK_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

/**
 * Initialize the MediaPipe Pose Landmarker.
 * Singleton — subsequent calls return the cached instance.
 */
export async function initPoseDetector(): Promise<PoseLandmarker> {
  if (poseLandmarker) return poseLandmarker;
  if (initializingPromise) return initializingPromise;

  initializingPromise = (async () => {
    const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);

    const detector = await PoseLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: TASK_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    poseLandmarker = detector;
    return detector;
  })();

  return initializingPromise;
}

/**
 * Detect pose landmarks from a video frame (HTMLVideoElement).
 * Returns 33 normalized landmarks (x, y, z in 0–1 range) or null if detection fails.
 */
export async function detectPose(
  detector: PoseLandmarker,
  videoFrame: HTMLVideoElement,
  timestampMs?: number,
): Promise<NormalizedLandmark[] | null> {
  try {
    const result = detector.detectForVideo(videoFrame, timestampMs ?? performance.now());
    if (result.landmarks && result.landmarks.length > 0) {
      return result.landmarks[0]; // First (and only) detected pose
    }
  } catch (err) {
    console.warn("Pose detection error:", err);
  }
  return null;
}

/**
 * Release the pose detector and free resources.
 */
export function releasePoseDetector(): void {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
    initializingPromise = null;
  }
}

// ── Landmark Index Constants ─────────────────────────────────────────────────

export const PoseLandmarks = {
  NOSE: 0,
  L_EYE_INNER: 1,
  L_EYE: 2,
  L_EYE_OUTER: 3,
  R_EYE_INNER: 4,
  R_EYE: 5,
  R_EYE_OUTER: 6,
  L_EAR: 7,
  R_EAR: 8,
  L_MOUTH: 9,
  R_MOUTH: 10,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_PINKY: 17,
  R_PINKY: 18,
  L_INDEX: 19,
  R_INDEX: 20,
  L_THUMB: 21,
  R_THUMB: 22,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
  L_HEEL: 29,
  R_HEEL: 30,
  L_FOOT_INDEX: 31,
  R_FOOT_INDEX: 32,
} as const;

export type PoseLandmarkIndex = (typeof PoseLandmarks)[keyof typeof PoseLandmarks];
