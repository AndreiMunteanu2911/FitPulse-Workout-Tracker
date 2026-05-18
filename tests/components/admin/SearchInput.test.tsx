import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchInput from "@/components/admin/SearchInput";

describe("SearchInput", () => {
  it("renders controlled value and emits changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="bench" onChange={onChange} placeholder="Search exercises" />);

    const input = screen.getByPlaceholderText("Search exercises");
    expect(input).toHaveValue("bench");

    await user.type(input, " press");
    expect(onChange).toHaveBeenCalled();
  });
});
