import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExerciseCard from "@/components/ExerciseCard";
import type React from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, onClick, className }: { href: string; children: React.ReactNode; onClick?: React.MouseEventHandler<HTMLAnchorElement>; className?: string }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

describe("ExerciseCard", () => {
  it("renders exercise name, primary muscle, and details link", () => {
    render(
      <ExerciseCard
        exercise={{
          exercise_id: "bench-press",
          name: "bench press",
          target_muscles: ["chest"],
          gif_url: "https://example.com/bench.gif",
        }}
      />,
    );

    expect(screen.getByText("Bench press")).toBeInTheDocument();
    expect(screen.getByText("chest")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/exercises/bench-press");
    expect(screen.getByRole("button", { name: "Details" })).toBeInTheDocument();
  });

  it("supports custom exercises and card click handling", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ExerciseCard
        exercise={{
          exercise_id: "custom-row",
          name: "custom row",
          is_custom: true,
        }}
        showDetailsButton={false}
        onClick={onClick}
      />,
    );

    await user.click(screen.getByText("Custom row"));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
