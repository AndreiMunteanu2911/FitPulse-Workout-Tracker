"use client";

import type { Post, Friendship, UserSearchResult, PostComment } from "@/types";
import { apiFetch } from "@/services/api/apiFetch";

interface CreatePostPayload {
  content?: string;
  image?: File;
  workout_id?: string;
}

interface FetchCommentsResult {
  comments: PostComment[];
  total: number;
}

interface UseSocialResult {
  fetchFeed: () => Promise<Post[]>;
  fetchFriendships: () => Promise<Friendship[]>;
  sendFriendRequest: (friend_id: string) => Promise<Friendship>;
  respondToFriendRequest: (friendship_id: string, action: "accept" | "decline" | "remove") => Promise<void>;
  searchUsers: (q: string) => Promise<UserSearchResult[]>;
  createPost: (payload: CreatePostPayload) => Promise<Post>;
  toggleLike: (postId: string) => Promise<boolean>;
  addComment: (postId: string, content: string) => Promise<PostComment>;
  fetchComments: (postId: string, limit?: number, offset?: number) => Promise<FetchCommentsResult>;
  deletePost: (postId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export function useSocial(): UseSocialResult {
  async function fetchFeed(): Promise<Post[]> {
    const data = await apiFetch<{ posts?: Post[] }>("/api/social/feed");
    return data.posts || [];
  }

  async function fetchFriendships(): Promise<Friendship[]> {
    const data = await apiFetch<{ friendships?: Friendship[] }>("/api/social/friends");
    return data.friendships || [];
  }

  async function sendFriendRequest(friend_id: string): Promise<Friendship> {
    const data = await apiFetch<{ friendship: Friendship }>("/api/social/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend_id }),
    });
    return data.friendship;
  }

  async function respondToFriendRequest(
    friendship_id: string,
    action: "accept" | "decline" | "remove"
  ): Promise<void> {
    await apiFetch<{ success?: boolean }>("/api/social/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendship_id, action }),
    });
  }

  async function searchUsers(q: string): Promise<UserSearchResult[]> {
    const data = await apiFetch<{ users?: UserSearchResult[] }>(`/api/social/friends/search?q=${encodeURIComponent(q)}`);
    return data.users || [];
  }

  async function createPost(payload: CreatePostPayload): Promise<Post> {
    const { content, image, workout_id } = payload;

    if (image) {
      const formData = new FormData();
      if (content) formData.append("content", content);
      if (workout_id) formData.append("workout_id", workout_id);
      formData.append("image", image);
      const data = await apiFetch<{ post: Post }>("/api/social/posts", { method: "POST", body: formData });
      return data.post;
    }

    const data = await apiFetch<{ post: Post }>("/api/social/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, workout_id }),
    });
    return data.post;
  }

  async function toggleLike(postId: string): Promise<boolean> {
    const data = await apiFetch<{ liked: boolean }>(`/api/social/posts/${postId}/like`, { method: "POST" });
    return data.liked as boolean;
  }

  async function addComment(postId: string, content: string): Promise<PostComment> {
    const data = await apiFetch<{ comment: PostComment }>(`/api/social/posts/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return data.comment;
  }

  async function fetchComments(postId: string, limit = 10, offset = 0): Promise<FetchCommentsResult> {
    const data = await apiFetch<FetchCommentsResult>(`/api/social/posts/${postId}/comment?limit=${limit}&offset=${offset}`);
    return { comments: data.comments || [], total: data.total || 0 };
  }

  async function deletePost(postId: string): Promise<void> {
    await apiFetch<{ success?: boolean }>(`/api/social/posts/${postId}`, { method: "DELETE" });
  }

  async function deleteComment(commentId: string): Promise<void> {
    await apiFetch<{ success?: boolean }>(`/api/social/comments/${commentId}`, { method: "DELETE" });
  }

  return {
    fetchFeed,
    fetchFriendships,
    sendFriendRequest,
    respondToFriendRequest,
    searchUsers,
    createPost,
    toggleLike,
    addComment,
    fetchComments,
    deletePost,
    deleteComment,
  };
}
