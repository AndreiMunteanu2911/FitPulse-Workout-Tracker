import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DatePicker from "@/components/DatePicker";

describe("DatePicker", () => {
  it("renders a formatted selected date", () => {
    render(<DatePicker value="2026-05-18" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /May 18, 2026/i })).toBeInTheDocument();
  });

  it("opens calendar and selects a day", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value="2026-05-18" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /May 18, 2026/i }));
    expect(screen.getByText("May 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "20" }));

    expect(onChange).toHaveBeenCalledWith("2026-05-20");
    expect(screen.queryByText("May 2026")).not.toBeInTheDocument();
  });

  it("navigates between months", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="2026-05-18" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /May 18, 2026/i }));
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[2]);

    expect(screen.getByText("June 2026")).toBeInTheDocument();
  });
});
