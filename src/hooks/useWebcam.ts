// ── useWebcam Hook ───────────────────────────────────────────────────────────
// Client hook. Manages webcam access, video stream, and cleanup.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useState, useCallback } from "react";

interface UseWebcamOptions {
  /** Preferred camera device ID */
  deviceId?: string;
  /** Desired resolution: "hd" (1280x720) or "vga" (640x480). Default: "hd" */
  resolution?: "hd" | "vga";
  /** Facing mode: "user" (front) or "environment" (back). Default: "user" */
  facingMode?: "user" | "environment";
  /** Camera zoom level. 1 = no zoom, >1 = zoom in, <1 = zoom out. Default: 1 */
  zoom?: number;
}

interface UseWebcamReturn {
  /** Ref to attach to the <video> element */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Whether the camera stream is active and video is ready */
  isReady: boolean;
  /** Whether the camera is currently loading */
  isLoading: boolean;
  /** Error message if camera access failed */
  error: string | null;
  /** Start the camera (called automatically on mount) */
  startCamera: () => Promise<void>;
  /** Stop the camera */
  stopCamera: () => void;
}

const RESOLUTION_MAP = {
  hd: { width: 1280, height: 720 },
  vga: { width: 640, height: 480 },
} as const;

export function useWebcam({
  deviceId,
  resolution = "hd",
  facingMode = "user",
  zoom = 1,
}: UseWebcamOptions = {}): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return; // Already running

    setIsLoading(true);
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          ...(deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode }),
          width: { ideal: RESOLUTION_MAP[resolution].width },
          height: { ideal: RESOLUTION_MAP[resolution].height },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (zoom !== 1) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { zoom?: { min: number; max: number } };
          if (capabilities?.zoom) {
            const clampedZoom = Math.max(capabilities.zoom.min, Math.min(capabilities.zoom.max, zoom));
            await videoTrack.applyConstraints({
              advanced: [{ zoom: clampedZoom } as MediaTrackConstraintSet],
            });
          }
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            resolve();
          };
        });
        setIsReady(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to access camera";
      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (message.includes("NotFound") || message.includes("DevicesNotFoundError")) {
        setError("No camera found on this device.");
      } else if (message.includes("NotReadable") || message.includes("TrackStartError")) {
        setError("Camera is already in use by another application. Close other apps and try again.");
      } else {
        setError(`Camera error: ${message}`);
      }
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, resolution, facingMode, zoom]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Auto-start on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return {
    videoRef,
    isReady,
    isLoading,
    error,
    startCamera,
    stopCamera,
  };
}
