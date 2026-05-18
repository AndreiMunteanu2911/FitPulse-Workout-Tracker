import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useSocial } from "@/hooks/useSocial";
import { server } from "#tests/mocks/server";

describe("useSocial", () => {
  it("fetches feed and friendships with empty fallbacks", async () => {
    server.use(
      http.get("/api/social/feed", () => HttpResponse.json({ posts: [{ id: "p1", user_id: "u1" }] })),
      http.get("/api/social/friends", () => HttpResponse.json({})),
    );
    const { result } = renderHook(() => useSocial());

    await expect(result.current.fetchFeed()).resolves.toEqual([{ id: "p1", user_id: "u1" }]);
    await expect(result.current.fetchFriendships()).resolves.toEqual([]);
  });

  it("sends and responds to friend requests", async () => {
    const requestBodies = vi.fn();
    server.use(
      http.post("/api/social/friends", async ({ request }) => {
        requestBodies(await request.json());
        return HttpResponse.json({ friendship: { id: "f1", user_id: "u1", friend_id: "u2", status: "pending" } });
      }),
      http.post("/api/social/friends/respond", async ({ request }) => {
        requestBodies(await request.json());
        return HttpResponse.json({ success: true });
      }),
    );
    const { result } = renderHook(() => useSocial());

    await expect(result.current.sendFriendRequest("u2")).resolves.toMatchObject({ id: "f1" });
    await result.current.respondToFriendRequest("f1", "accept");

    expect(requestBodies).toHaveBeenNthCalledWith(1, { friend_id: "u2" });
    expect(requestBodies).toHaveBeenNthCalledWith(2, { friendship_id: "f1", action: "accept" });
  });

  it("creates JSON posts and image posts", async () => {
    const contentTypes = vi.fn();
    server.use(
      http.post("/api/social/posts", async ({ request }) => {
        contentTypes(request.headers.get("content-type"));
        return HttpResponse.json({ post: { id: "p1", user_id: "u1", content: "Hello" } });
      }),
    );
    const { result } = renderHook(() => useSocial());

    await expect(result.current.createPost({ content: "Hello", workout_id: "w1" })).resolves.toMatchObject({ id: "p1" });
    await expect(result.current.createPost({ content: "With image", image: new File(["x"], "post.png", { type: "image/png" }) })).resolves.toMatchObject({ id: "p1" });

    expect(contentTypes.mock.calls[0][0]).toContain("application/json");
    expect(contentTypes.mock.calls[1][0]).toContain("multipart/form-data");
  });

  it("handles likes, comments, search, and deletes", async () => {
    const urls = vi.fn();
    server.use(
      http.get("/api/social/friends/search", ({ request }) => {
        urls(new URL(request.url));
        return HttpResponse.json({ users: [{ user_id: "u2", display_name: "Ada" }] });
      }),
      http.post("/api/social/posts/:id", () => HttpResponse.json({ liked: true })),
      http.post("/api/social/posts/:id/comment", () => HttpResponse.json({ comment: { id: "c1", post_id: "p1", user_id: "u1", content: "Nice" } })),
      http.get("/api/social/posts/:id/comment", ({ request }) => {
        urls(new URL(request.url));
        return HttpResponse.json({ comments: [], total: 0 });
      }),
      http.delete("/api/social/posts/:id", () => HttpResponse.json({ success: true })),
      http.delete("/api/social/comments/:id", () => HttpResponse.json({ success: true })),
    );
    const { result } = renderHook(() => useSocial());

    await expect(result.current.searchUsers("Ada Lovelace")).resolves.toEqual([{ user_id: "u2", display_name: "Ada" }]);
    await expect(result.current.toggleLike("p1")).resolves.toBe(true);
    await expect(result.current.addComment("p1", "Nice")).resolves.toMatchObject({ id: "c1" });
    await expect(result.current.fetchComments("p1", 5, 10)).resolves.toEqual({ comments: [], total: 0 });
    await expect(result.current.deletePost("p1")).resolves.toBeUndefined();
    await expect(result.current.deleteComment("c1")).resolves.toBeUndefined();

    expect(urls.mock.calls[0][0].searchParams.get("q")).toBe("Ada Lovelace");
    expect(urls.mock.calls[1][0].searchParams.get("limit")).toBe("5");
    expect(urls.mock.calls[1][0].searchParams.get("offset")).toBe("10");
  });
});
