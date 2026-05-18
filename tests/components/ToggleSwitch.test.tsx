import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToggleSwitch from "@/components/ToggleSwitch";

describe("ToggleSwitch", () => {
  it("exposes switch state and triggers change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("uses checked and size-specific classes", () => {
    render(<ToggleSwitch checked onChange={vi.fn()} size="lg" />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle.className).toContain("w-14");
  });
});
