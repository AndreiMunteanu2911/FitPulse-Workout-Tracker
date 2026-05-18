import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import BlogCard from "@/components/blog/BlogCard";
import { server } from "#tests/mocks/server";
import type { BlogPost } from "@/types";
import type React from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

const post: BlogPost = {
  id: "post-1",
  title: "How to Build Better Habits",
  content: "Small repeatable actions make training easier to sustain.",
  image_url: "https://example.com/blog.png",
  author_id: "admin-1",
  created_at: "2026-05-18T09:00:00.000Z",
  likes_count: 2,
  comments_count: 4,
  liked_by_me: false,
};

describe("BlogCard", () => {
  it("renders blog metadata, links, counts, and image", () => {
    render(<BlogCard post={post} />);

    expect(screen.getByText("How to Build Better Habits")).toBeInTheDocument();
    expect(screen.getByText("Small repeatable actions make training easier to sustain.")).toBeInTheDocument();
    expect(screen.getByText("May 18, 2026")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /How to Build Better Habits|Read More/i })[0]).toHaveAttribute("href", "/blog/post-1");
    expect(screen.getByAltText("How to Build Better Habits")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("updates local like count from the like endpoint", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/blog/:id/like", () => HttpResponse.json({ liked: true })),
    );
    render(<BlogCard post={post} />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows admin actions and calls handlers", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<BlogCard post={post} isAdmin onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: /Edit/i }));
    await user.click(screen.getByRole("button", { name: /Delete/i }));

    expect(onEdit).toHaveBeenCalledWith(post);
    expect(onDelete).toHaveBeenCalledWith("post-1");
  });
});
