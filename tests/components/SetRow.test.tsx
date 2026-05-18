import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetRow from "@/components/SetRow";

const baseProps = {
  set: { id: "set-1", set_number: 1, reps: 8, weight: 80 },
  setIndex: 0,
  exerciseIndex: 2,
  isConfirmed: false,
  previous: { reps: 6, weight: 75 },
  previousLoading: false,
  onUpdateSet: vi.fn(),
  onDeleteSet: vi.fn(),
  onConfirmSet: vi.fn(),
  exercise: { exercise_id: "bench-press", name: "Bench Press" },
  workoutExerciseId: "we-1",
};

describe("SetRow", () => {
  it("renders previous values and updates reps and weight", () => {
    const onUpdateSet = vi.fn();
    render(<SetRow {...baseProps} onUpdateSet={onUpdateSet} />);

    expect(screen.getByText("6\u00d775")).toBeInTheDocument();
    const [repsInput, weightInput] = screen.getAllByRole("spinbutton");

    fireEvent.change(repsInput, { target: { value: "10" } });
    fireEvent.change(weightInput, { target: { value: "82.5" } });

    expect(onUpdateSet).toHaveBeenCalledWith(2, 0, "reps", 10);
    expect(onUpdateSet).toHaveBeenCalledWith(2, 0, "weight", 82.5);
  });

  it("falls back to zero for empty numeric inputs", () => {
    const onUpdateSet = vi.fn();
    render(<SetRow {...baseProps} onUpdateSet={onUpdateSet} />);

    const [repsInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(repsInput, { target: { value: "" } });

    expect(onUpdateSet).toHaveBeenCalledWith(2, 0, "reps", 0);
  });

  it("confirms and deletes sets with the expected identifiers", async () => {
    const user = userEvent.setup();
    const onConfirmSet = vi.fn();
    const onDeleteSet = vi.fn();
    render(<SetRow {...baseProps} onConfirmSet={onConfirmSet} onDeleteSet={onDeleteSet} />);

    await user.click(screen.getByRole("button", { name: "Confirm set" }));
    await user.click(screen.getByRole("button", { name: "Delete set" }));

    expect(onConfirmSet).toHaveBeenCalledWith("set-1", baseProps.exercise, "we-1");
    expect(onDeleteSet).toHaveBeenCalledWith(2, 0);
  });

  it("shows loading and empty previous states", () => {
    const { rerender } = render(<SetRow {...baseProps} previousLoading />);
    expect(screen.getByText("...")).toBeInTheDocument();

    rerender(<SetRow {...baseProps} previous={null} previousLoading={false} />);
    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });
});
