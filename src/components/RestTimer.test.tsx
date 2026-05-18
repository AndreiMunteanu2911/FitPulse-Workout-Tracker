import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RestTimer from "./RestTimer";
import type { RestTimerState } from "@/types";

function timer(overrides: Partial<RestTimerState> = {}): RestTimerState {
  return {
    active: true,
    duration: 90,
    remaining: 90,
    exerciseName: "Bench Press",
    exerciseType: "compound",
    ...overrides,
  };
}

describe("RestTimer", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(<RestTimer timer={timer({ active: false })} onTick={vi.fn()} onSkip={vi.fn()} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders formatted remaining time and handles action buttons", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    const onDismiss = vi.fn();
    render(<RestTimer timer={timer({ remaining: 65 })} onTick={vi.fn()} onSkip={onSkip} onDismiss={onDismiss} />);

    expect(screen.getByText(/Rest\s+1:05/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skip rest" }));
    await user.click(screen.getByRole("button", { name: "Dismiss rest timer" }));

    expect(onSkip).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("ticks down every second while active", () => {
    vi.useFakeTimers();
    const onTick = vi.fn();
    render(<RestTimer timer={timer({ remaining: 10 })} onTick={onTick} onSkip={vi.fn()} onDismiss={vi.fn()} />);

    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledWith(9);
  });

  it("shows done state and auto-skips after the done delay", () => {
    vi.useFakeTimers();
    const onSkip = vi.fn();
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
    });

    render(<RestTimer timer={timer({ remaining: 0 })} onTick={vi.fn()} onSkip={onSkip} onDismiss={vi.fn()} />);

    expect(screen.getByText("Rest done!")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip rest" })).not.toBeInTheDocument();
    expect(vibrate).toHaveBeenCalledWith([200, 100, 200]);

    vi.advanceTimersByTime(1200);
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
