"use client";

import { useState } from "react";
import type { Post, PostComment } from "@/types";
import { Heart, MessageCircle, User, Send, Maximize2, Trash2 } from "lucide-react";
import PostWorkoutCard from "./PostWorkoutCard";
import ImageModal from "../ImageModal";
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  const initials = getInitials(displayName);

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
          {isPostOwner && (
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {post.content && (
          <p className="text-sm text-[var(--foreground)] mb-3 leading-relaxed">{post.content}</p>
        )}

        {post.image_url && (
          <div className="rounded-[var(--radius-md)] overflow-hidden mb-3 relative">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full object-cover max-h-80"
            />
            <button
                onClick={() => setExpandedImage(post.image_url ?? null)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {post.workout_summary && (
          <PostWorkoutCard workoutSummary={post.workout_summary} />
        )}

        {showComments && visibleComments.length > 0 && (
          <div className="mt-3 space-y-2">
            {visibleComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2 group">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {getInitials(comment.user_stats?.display_name || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {comment.user_stats?.display_name || "Unknown"}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {timeAgo(comment.created_at!)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground)] mt-0.5 break-words">
                    {comment.content}
                  </p>
                </div>
                {currentUserId === comment.user_id && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingComment === comment.id}
                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
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

      <div className="px-4 py-2.5">
        <div className="flex items-center gap-4 mb-2">
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
            <span>{post.likes_count || 0} Likes</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{totalComments} Comments</span>
          </button>
        </div>

        {showCommentInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-1.5 text-xs bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary-500)]"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || submitting}
              className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--primary-500)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowCommentInput(false);
                setCommentText("");
              }}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCommentInput(true)}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
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
    </div>
  );
}
