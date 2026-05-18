import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WeightLogCard from "@/components/WeightLogCard";

describe("WeightLogCard", () => {
  it("formats date and weight", () => {
    render(<WeightLogCard id="w1" date="2026-05-18" weight={82.5} />);

    expect(screen.getByText("May 18, 2026")).toBeInTheDocument();
    expect(screen.getByText("82.5 kg")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete weight entry" })).not.toBeInTheDocument();
  });

  it("calls delete handler when deletable", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<WeightLogCard id="w1" date="2026-05-18" weight={82.5} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete weight entry" }));

    expect(onDelete).toHaveBeenCalledWith("w1");
  });
});
