"use client";

import { Capacitor } from "@capacitor/core";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Device } from "@capacitor/device";
import { Filesystem } from "@capacitor/filesystem";
import { Network, type ConnectionStatus } from "@capacitor/network";
import { Preferences } from "@capacitor/preferences";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export const MOBILE_APP_HOST = process.env.NEXT_PUBLIC_PRODUCTION_APP_URL || "https://fitpulseam.vercel.app";
export const MOBILE_APP_SCHEME = "com.fitpulse.app";

type CapacitorListener = { remove: () => Promise<void> };

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}

export function supportsNativeCamera(): boolean {
  return isNativePlatform();
}

export async function openCheckoutUrl(url: string): Promise<void> {
  if (isNativePlatform()) {
    await Browser.open({
      url,
      presentationStyle: "fullscreen",
    });
    return;
  }

  window.location.href = url;
}

async function blobFromWebPath(webPath: string): Promise<Blob> {
  const response = await fetch(webPath);
  if (!response.ok) {
    throw new Error("Failed to read native photo.");
  }
  return response.blob();
}

export async function capturePhotoFile(): Promise<File> {
  const photo = await Camera.getPhoto({
    quality: 92,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt,
    promptLabelHeader: "Add progress photo",
    promptLabelPhoto: "Choose from gallery",
    promptLabelPicture: "Take photo",
    promptLabelCancel: "Cancel",
  });

  if (photo.webPath) {
    const blob = await blobFromWebPath(photo.webPath);
    const extension = photo.format ?? "jpeg";
    return new File([blob], photo.path?.split("/").pop() ?? `fitpulse-photo.${extension}`, {
      type: blob.type || `image/${extension}`,
    });
  }

  if (photo.path) {
    const readFile = await Filesystem.readFile({ path: photo.path });
    const base64Data = typeof readFile.data === "string" ? readFile.data : "";
    const byteString = atob(base64Data);
    const byteNumbers = new Array(byteString.length);
    for (let i = 0; i < byteString.length; i += 1) {
      byteNumbers[i] = byteString.charCodeAt(i);
    }
    const extension = photo.format ?? "jpeg";
    return new File([new Uint8Array(byteNumbers)], `fitpulse-photo.${extension}`, {
      type: `image/${extension}`,
    });
  }

  throw new Error("No photo data returned from native camera.");
}

export function toObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export async function closeNativeBrowser(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await Browser.close();
  } catch {
    // Browser.close is not supported on every platform/runtime combination.
  }
}

export async function hideNativeSplash(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await SplashScreen.hide();
  } catch {
    // Ignore when the splash screen is already hidden.
  }
}

export async function syncStatusBar(isDark: boolean): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color: isDark ? "#090B10" : "#F5F7FB" });
  } catch {
    // Ignore unsupported status bar operations.
  }
}

export async function persistNativeTheme(isDark: boolean): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await Preferences.set({
      key: "fitpulse-theme",
      value: JSON.stringify({ isDark }),
    });
  } catch {
    // Ignore unsupported preference writes.
  }
}

export async function getNativeDeviceInfo(): Promise<Awaited<ReturnType<typeof Device.getInfo>> | null> {
  if (!isNativePlatform()) return null;
  try {
    return await Device.getInfo();
  } catch {
    return null;
  }
}

export async function getNetworkStatus(): Promise<ConnectionStatus | null> {
  if (!isNativePlatform()) return null;
  try {
    return await Network.getStatus();
  } catch {
    return null;
  }
}

export async function addNetworkListener(
  listener: (status: ConnectionStatus) => void,
): Promise<CapacitorListener | null> {
  if (!isNativePlatform()) return null;
  try {
    return await Network.addListener("networkStatusChange", listener);
  } catch {
    return null;
  }
}

export async function addAppUrlOpenListener(
  listener: (event: URLOpenListenerEvent) => void,
): Promise<CapacitorListener | null> {
  if (!isNativePlatform()) return null;
  try {
    return await App.addListener("appUrlOpen", listener);
  } catch {
    return null;
  }
}

export async function addAppResumeListener(listener: () => void): Promise<CapacitorListener | null> {
  if (!isNativePlatform()) return null;
  try {
    return await App.addListener("resume", listener);
  } catch {
    return null;
  }
}

export function resolveAppUrlTarget(inputUrl: string): string {
  const parsed = new URL(inputUrl);
  if (!parsed.protocol.startsWith(MOBILE_APP_SCHEME)) {
    return inputUrl;
  }

  const host = parsed.host ? `/${parsed.host}` : "";
  const path = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "";
  return `${host}${path}${parsed.search}${parsed.hash}` || "/";
}

export function toHostedAppUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const currentOrigin =
    typeof window !== "undefined" && /^https?:\/\//i.test(window.location.origin)
      ? window.location.origin
      : MOBILE_APP_HOST;
  return `${currentOrigin}${normalizedPath}`;
}
