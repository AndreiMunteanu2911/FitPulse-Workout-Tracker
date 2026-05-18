import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "./themeStore";

describe("useThemeStore", () => {
  beforeEach(() => {
    useThemeStore.getState().setDark(false);
  });

  it("toggles and sets dark mode", () => {
    expect(useThemeStore.getState().isDark).toBe(false);

    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().isDark).toBe(true);

    useThemeStore.getState().setDark(false);
    expect(useThemeStore.getState().isDark).toBe(false);
  });
});
