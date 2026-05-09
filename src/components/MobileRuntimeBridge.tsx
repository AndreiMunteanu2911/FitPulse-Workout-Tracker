"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";
import {
  addAppResumeListener,
  addAppUrlOpenListener,
  addNetworkListener,
  closeNativeBrowser,
  getNativeDeviceInfo,
  getNetworkStatus,
  isNativePlatform,
  persistNativeTheme,
  resolveAppUrlTarget,
  syncStatusBar,
  toHostedAppUrl,
} from "@/lib/mobile";

export default function MobileRuntimeBridge() {
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    if (!isNativePlatform()) return;

    let isMounted = true;
    let networkHandle: { remove: () => Promise<void> } | null = null;
    let urlOpenHandle: { remove: () => Promise<void> } | null = null;
    let resumeHandle: { remove: () => Promise<void> } | null = null;

    const setNativeOnlineState = (connected: boolean) => {
      document.documentElement.dataset.nativeOnline = connected ? "true" : "false";
    };

    const boot = async () => {
      try {
        await syncStatusBar(isDark);
        await persistNativeTheme(isDark);

        const info = await getNativeDeviceInfo();
        if (info && isMounted) {
          sessionStorage.setItem("fitpulse-native-device", JSON.stringify(info));
        }

        const network = await getNetworkStatus();
        if (network && isMounted) {
          setNativeOnlineState(network.connected);
        }

        networkHandle = await addNetworkListener((status) => {
          setNativeOnlineState(status.connected);
        });

        urlOpenHandle = await addAppUrlOpenListener(async ({ url }) => {
          const target = resolveAppUrlTarget(url);
          if (target.startsWith("/")) {
            await closeNativeBrowser();
            window.location.href = toHostedAppUrl(target);
          }
        });

        resumeHandle = await addAppResumeListener(async () => {
          await syncStatusBar(isDark);
        });
      } catch (error) {
        console.error("Failed to initialize mobile runtime bridge:", error);
      }
    };

    void boot();

    return () => {
      isMounted = false;
      void networkHandle?.remove();
      void urlOpenHandle?.remove();
      void resumeHandle?.remove();
    };
  }, [isDark]);

  return null;
}
