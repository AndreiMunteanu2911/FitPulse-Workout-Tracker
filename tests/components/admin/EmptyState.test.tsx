import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import EmptyState from "@/components/admin/EmptyState";

describe("EmptyState", () => {
  it("renders icon, copy, and optional action content", () => {
    render(
      <EmptyState icon={<Search data-testid="empty-icon" />} title="No results" description="Try another search term.">
        <button type="button">Reset filters</button>
      </EmptyState>,
    );

    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try another search term.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();
  });
});
