"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Post, PostComment } from "@/types";
import { Heart, MessageCircle, Send, Maximize2, Trash2 } from "lucide-react";
import PostWorkoutCard from "./PostWorkoutCard";
import ImageModal from "../ImageModal";
import UserAvatar from "@/components/UserAvatar";
import { useSocial } from "@/hooks/useSocial";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => Promise<void>;
  onDelete: (postId: string) => void;
  currentUserId: string;
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

export default function PostCard({ post, onLike, onDelete, currentUserId }: PostCardProps) {
  const { addComment, fetchComments, deleteComment } = useSocial();
  const [liking, setLiking] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(post.post_comments || []);
  const [totalComments, setTotalComments] = useState(post.comments_count || 0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [showComments, setShowComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [deletingComment, setDeletingComment] = useState<string | null>(null);

  const isPostOwner = currentUserId === post.user_id;
  const displayName = post.user_stats?.display_name || "Unknown User";

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      await onLike(post.id);
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(post.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setTotalComments((prev) => prev + 1);
      setCommentText("");
      setShowComments(true);
    } catch {
      // handle error silently
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deletingComment) return;
    setDeletingComment(commentId);
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotalComments((prev) => Math.max(prev - 1, 0));
    } catch {
      // handle error silently
    } finally {
      setDeletingComment(null);
    }
  };

  const loadMoreComments = async () => {
    const { comments: moreComments, total } = await fetchComments(post.id, 10, visibleCount);
    setComments((prev) => [...prev, ...moreComments]);
    setVisibleCount((prev) => prev + 10);
    setTotalComments(total);
  };

  const visibleComments = showComments ? comments.slice(0, visibleCount) : [];
  const hasMore = visibleCount < totalComments;

  return (
    <article className="card shadow-[var(--shadow-sm)]">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserAvatar name={displayName} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-base font-bold text-[var(--foreground)]">{displayName}</p>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">{timeAgo(post.created_at!)}</p>
          </div>
          {isPostOwner && (
            <button
              onClick={() => onDelete(post.id)}
              aria-label="Delete post"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--surface-raised)] px-3.5 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--color-destructive-bg)] hover:text-[var(--color-destructive)]"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>

        {post.content && (
          <p className="mb-5 whitespace-pre-wrap text-[15px] leading-7 text-[var(--foreground)]">{post.content}</p>
        )}

        {post.image_url && (
          <div className="relative mb-4 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-raised)]">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full object-cover max-h-80"
            />
            <button
                onClick={() => setExpandedImage(post.image_url ?? null)}
                className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {post.workout_summary && (
          <PostWorkoutCard workoutSummary={post.workout_summary} />
        )}

        {showComments && visibleComments.length > 0 && (
          <div className="mt-5 divide-y divide-[var(--border)] rounded-[var(--radius-xl)] bg-[var(--surface-raised)] px-4">
            <AnimatePresence initial={false} mode="popLayout">
            {visibleComments.map((comment) => (
              <motion.div
                layout
                key={comment.id}
                className="group flex items-start gap-3 py-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <UserAvatar name={comment.user_stats?.display_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {comment.user_stats?.display_name || "Unknown"}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {timeAgo(comment.created_at!)}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm leading-relaxed text-[var(--foreground)]">
                    {comment.content}
                  </p>
                </div>
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingComment === comment.id}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--color-destructive-bg)] hover:text-[var(--color-destructive)]"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </motion.div>
            ))}
            </AnimatePresence>
            {hasMore && (
              <button
                onClick={loadMoreComments}
                className="text-xs text-[var(--primary-500)] hover:text-[var(--primary-600)] font-medium"
              >
                See more comments
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              post.liked_by_me
                ? "bg-[var(--color-destructive-bg)] text-red-500"
                : "bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-red-500"
            }`}
          >
            <Heart className={`w-4 h-4 ${post.liked_by_me ? "fill-current" : ""}`} />
            <span>{post.likes_count || 0} Likes</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex min-h-10 items-center gap-2 rounded-full bg-[var(--surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{totalComments} Comments</span>
          </button>
        </div>

        {showCommentInput ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Write a comment..."
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[var(--foreground)] outline-none"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || submitting}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-500)] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowCommentInput(false);
                setCommentText("");
              }}
              aria-label="Cancel comment"
              className="rounded-full px-2 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCommentInput(true)}
            className="w-full rounded-[var(--radius-lg)] bg-[var(--surface-raised)] px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Add a comment...
          </button>
        )}
      </div>

      <ImageModal
        isOpen={!!expandedImage}
        imageUrl={expandedImage || ""}
        onClose={() => setExpandedImage(null)}
      />
    </article>
  );
}
