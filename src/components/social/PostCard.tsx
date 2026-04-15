"use client";

import { useState } from "react";
import type { Post } from "@/types";
import { Heart, MessageCircle, User } from "lucide-react";
import PostWorkoutSummary from "./PostWorkoutSummary";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => Promise<void>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PostCard({ post, onLike }: PostCardProps) {
  const [liking, setLiking] = useState(false);
  const displayName = post.user_stats?.display_name || "Unknown User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      await onLike(post.id);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials || <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{displayName}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{timeAgo(post.created_at!)}</p>
          </div>
        </div>

        {post.content && (
          <p className="text-sm text-[var(--foreground)] mb-3 leading-relaxed">{post.content}</p>
        )}

        {post.image_url && (
          <div className="rounded-[var(--radius-md)] overflow-hidden mb-3">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full object-cover max-h-80"
            />
          </div>
        )}

        {post.workout && (
          <PostWorkoutSummary workout={post.workout} />
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-[var(--border)] flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.liked_by_me
              ? "text-red-500"
              : "text-[var(--muted-foreground)] hover:text-red-500"
          }`}
        >
          <Heart className={`w-4 h-4 ${post.liked_by_me ? "fill-current" : ""}`} />
          <span>{post.likes_count || 0}</span>
        </button>
        <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count || 0}</span>
        </div>
      </div>
    </div>
  );
}
