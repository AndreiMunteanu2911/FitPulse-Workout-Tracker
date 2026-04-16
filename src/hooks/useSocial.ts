"use client";

import type { Post, Friendship, UserSearchResult, PostComment } from "@/types";

export function useSocial() {
  const fetchFeed = async (): Promise<Post[]> => {
    const res = await fetch("/api/social/feed");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch feed");
    return data.posts || [];
  };

  const fetchFriendships = async (): Promise<Friendship[]> => {
    const res = await fetch("/api/social/friends");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch friends");
    return data.friendships || [];
  };

  const sendFriendRequest = async (friend_id: string): Promise<Friendship> => {
    const res = await fetch("/api/social/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send friend request");
    return data.friendship;
  };

  const respondToFriendRequest = async (
    friendship_id: string,
    action: "accept" | "decline" | "remove"
  ): Promise<void> => {
    const res = await fetch("/api/social/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendship_id, action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to respond to friend request");
  };

  const searchUsers = async (q: string): Promise<UserSearchResult[]> => {
    const res = await fetch(`/api/social/friends/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to search users");
    return data.users || [];
  };

  const createPost = async (payload: {
    content?: string;
    image?: File;
    workout_id?: string;
  }): Promise<Post> => {
    const { content, image, workout_id } = payload;

    if (image) {
      const formData = new FormData();
      if (content) formData.append("content", content);
      if (workout_id) formData.append("workout_id", workout_id);
      formData.append("image", image);
      const res = await fetch("/api/social/posts", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");
      return data.post;
    }

    const res = await fetch("/api/social/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, workout_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create post");
    return data.post;
  };

  const toggleLike = async (postId: string): Promise<boolean> => {
    const res = await fetch(`/api/social/posts/${postId}/like`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to toggle like");
    return data.liked as boolean;
  };

  const addComment = async (postId: string, content: string): Promise<PostComment> => {
    const res = await fetch(`/api/social/posts/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add comment");
    return data.comment;
  };

  const fetchComments = async (postId: string, limit = 10, offset = 0): Promise<{ comments: PostComment[]; total: number }> => {
    const res = await fetch(`/api/social/posts/${postId}/comment?limit=${limit}&offset=${offset}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch comments");
    return { comments: data.comments || [], total: data.total || 0 };
  };

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
  };
}
