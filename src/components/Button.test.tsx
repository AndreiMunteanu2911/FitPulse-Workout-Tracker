import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

describe("Button", () => {
  it("renders a button with default type and click behavior", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveAttribute("type", "button");
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("supports block, disabled, and accessible icon-only labels", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button block disabled ariaLabel="Add workout" onClick={onClick}>
        +
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Add workout" });
    expect(button).toBeDisabled();
    expect(button.className).toContain("w-full");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("can clone styles and handlers onto a child element", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button asChild ariaLabel="Open shop" onClick={onClick}>
        <a href="#shop">Shop</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Open shop" });
    expect(link).toHaveAttribute("href", "#shop");
    await user.click(link);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
