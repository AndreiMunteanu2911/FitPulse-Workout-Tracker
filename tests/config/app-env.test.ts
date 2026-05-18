import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

async function loadModule() {
  vi.resetModules();
  return import("@/config/app-env");
}

describe("app environment helpers", () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.unstubAllEnvs();
  });

  it("defaults to development and trims configured URLs", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_PRODUCTION_APP_URL", "https://prod.example.com///");
    vi.stubEnv("CAP_ANDROID_DEV_SERVER_URL", "http://10.0.2.2:3000///");
    const appEnv = await loadModule();

    expect(appEnv.getAppEnv()).toBe("development");
    expect(appEnv.getProductionAppUrl()).toBe("https://prod.example.com");
    expect(appEnv.getAndroidDevServerUrl()).toBe("http://10.0.2.2:3000");
    expect(appEnv.getAndroidDevHost()).toBe("10.0.2.2:3000");
    expect(appEnv.getWebAppBaseUrl("http://localhost:3000/")).toBe("http://localhost:3000");
  });

  it("uses production URL when app env is production", async () => {
    vi.stubEnv("CAP_APP_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_PRODUCTION_APP_URL", "https://fitpulse.example.com/");
    const appEnv = await loadModule();

    expect(appEnv.isProductionAppEnv()).toBe(true);
    expect(appEnv.getWebAppBaseUrl("http://localhost:3000")).toBe("https://fitpulse.example.com");
  });

  it("falls back to development for unknown env values", async () => {
    vi.stubEnv("CAP_APP_ENV", "staging");
    const appEnv = await loadModule();

    expect(appEnv.getAppEnv()).toBe("development");
  });
});
