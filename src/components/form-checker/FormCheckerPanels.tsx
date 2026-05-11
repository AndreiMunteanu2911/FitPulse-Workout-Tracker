"use client";

import { useEffect, useRef } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { AlertTriangle, Camera, CheckCircle, Info, Loader2 } from "lucide-react";
import Button from "@/components/Button";
import {
  projectAllLandmarks,
  POSE_CONNECTIONS,
} from "@/lib/form-geometry";
import {
  getSeverityRank,
  type FormCheckerCameraStatus,
  type FormFeedback,
  type JointStatusMap,
  type JointVisualStatus,
} from "./types";

const MAX_VISIBLE_CUES = 3;

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

function getPoseColor(status: JointVisualStatus, alpha: number): string {
  if (status === "error") return `rgba(239, 68, 68, ${alpha})`;
  if (status === "warning") return `rgba(245, 158, 11, ${alpha})`;
  return `rgba(59, 130, 246, ${alpha})`;
}

export function CameraGuideOverlay({
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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 text-center shadow-[var(--shadow-md)]">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
        <p className="text-sm font-semibold text-[var(--foreground)]">{msg.title}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{msg.desc}</p>
      </div>
    </div>
  );
}

export function PoseCanvas({
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
      ctx.strokeStyle = getPoseColor(status, alpha);
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
      ctx.fillStyle = getPoseColor(status, alpha);
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

export function FeedbackPanel({
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
    <div className="absolute inset-x-0 bottom-0 z-[15] bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          {visibleCues.length === 0 ? (
            <div className="flex items-center gap-2 transition-all duration-200">
              {trackingInterrupted ? (
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400" />
              ) : (
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-400" />
              )}
              <span className={`truncate text-sm font-semibold ${trackingInterrupted ? "text-amber-300" : "text-emerald-300"}`}>
                {trackingInterrupted ? "Tracking interrupted" : recentRepDetected ? "Rep detected" : "Tracking"}
              </span>
            </div>
          ) : (
            visibleCues.map((cue, index) => (
              <div key={`${cue.message}-${index}`} className="flex items-center gap-2 transition-all duration-200">
                <AlertTriangle
                  className={`h-4 w-4 flex-shrink-0 ${
                    cue.type === "error" ? "text-red-400" : cue.type === "warning" ? "text-amber-400" : "text-sky-400"
                  }`}
                />
                <span
                  className={`line-clamp-2 text-sm font-medium leading-tight ${
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

        <div className="flex flex-shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/60">Reps</p>
            <p className="text-xl font-bold leading-none text-white">{repCount}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/60">Score</p>
            <p
              className={`text-xl font-bold leading-none ${
                !hasRepScore ? "text-white/70" : formScore >= 90 ? "text-emerald-400" : formScore >= 75 ? "text-violet-300" : formScore >= 60 ? "text-amber-400" : "text-red-400"
              }`}
            >
              {hasRepScore ? `${formScore}%` : "--"}
            </p>
          </div>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            !hasRepScore ? "bg-white/30" : formScore >= 90 ? "bg-emerald-400" : formScore >= 75 ? "bg-violet-300" : formScore >= 60 ? "bg-amber-400" : "bg-red-400"
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

function BlockingOverlay({
  visible,
  title,
  description,
  solid = false,
}: {
  visible: boolean;
  title: string;
  description: string;
  solid?: boolean;
}) {
  if (!visible) return null;

  return (
    <div className={`absolute inset-0 z-30 flex items-center justify-center px-4 ${solid ? "bg-[var(--surface)]" : "bg-black/45 backdrop-blur-sm"}`}>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 text-center shadow-[var(--shadow-md)]">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--primary-500)]" />
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

export function ReviewOverlay({ visible }: { visible: boolean }) {
  return (
    <BlockingOverlay
      visible={visible}
      title="Reviewing your set..."
      description="Please wait while we finish the post-set analysis."
    />
  );
}

export function StartupOverlay({ visible }: { visible: boolean }) {
  return (
    <BlockingOverlay
      visible={visible}
      title="Starting pose tracking..."
      description="Camera is ready. Waiting for the first stable pose frame."
      solid
    />
  );
}

export function PostSetModeNotice() {
  return (
    <div className="absolute left-4 right-4 top-4 z-20">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-900/80 px-3 py-2 backdrop-blur-sm">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
        <p className="text-xs leading-snug text-amber-300">
          This exercise relies on post-set review. We will still record the movement pattern locally.
        </p>
      </div>
    </div>
  );
}

export function CameraErrorOverlay({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
      <div className="px-6 text-center">
        <Camera className="mx-auto mb-3 h-12 w-12 text-red-400" />
        <p className="mb-1 font-bold text-white">Camera Error</p>
        <p className="mb-4 text-sm text-white/60">{error}</p>
        <Button onClick={onRetry}>Try Again</Button>
      </div>
    </div>
  );
}
