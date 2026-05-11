"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BlogPost, BlogComment } from "@/types";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import { useAuthSession } from "@/components/AuthSessionProvider";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ArrowLeft, Calendar, Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import Image from "next/image";

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthSession();

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/blog/${id}/comments`);
      const { comments: data } = await res.json();
      setComments(data || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }, [id]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRes = await fetch(`/api/blog/${id}`);
        const { data } = await postRes.json();
        
        setPost(data);
        setCurrentUser(user?.id || null);
        if (data) {
          setLiked(data.liked_by_me ?? false);
          setLikesCount(data.likes_count ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
    fetchComments();
  }, [fetchComments, id, user?.id]);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/blog/${id}/like`, { method: "POST" });
      const data = await res.json();
      if (!data.error) {
        setLiked(data.liked);
        setLikesCount(data.liked ? likesCount + 1 : likesCount - 1);
      }
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/blog/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      if (!data.error && data.comment) {
        setComments([data.comment, ...comments]);
        setNewComment("");
        if (post) {
          setPost({ ...post, comments_count: (post.comments_count || 0) + 1 });
        }
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/blog/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
        if (post) {
          setPost({ ...post, comments_count: Math.max(0, (post.comments_count || 0) - 1) });
        }
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(dateStr);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-[var(--surface-raised)] rounded-full flex items-center justify-center mb-6">
           <ArrowLeft className="w-8 h-8 text-[var(--muted-foreground)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Post Not Found</h2>
        <p className="text-[var(--muted-foreground)] mb-8 max-w-md">The blog post you&apos;re looking for might have been moved or deleted.</p>
        <Button onClick={() => router.push("/blog")} variant="primary">Back to Blog</Button>
      </div>
    );
  }

  return (
    <ProtectedWrapper>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <button
          onClick={() => router.push("/blog")}
          className="group flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--primary-600)] mb-10 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to feed
        </button>

        <article>
          {post.image_url && (
            <div className="relative w-full h-[300px] sm:h-[450px] rounded-[var(--radius-xl)] overflow-hidden mb-10 shadow-2xl shadow-black/10">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-[var(--muted-foreground)] mb-6">
            <div className="flex items-center gap-2 bg-[var(--surface-raised)] px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {post.created_at 
                  ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(post.created_at)) 
                  : "Recently"}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                  liked 
                    ? "bg-[var(--color-destructive-bg)] text-[var(--color-destructive)]" 
                    : "bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive-bg)]"
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                <span className="font-medium">{likesCount}</span>
              </button>
              
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] text-[var(--muted-foreground)] rounded-full">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">{post.comments_count ?? 0}</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--foreground)] mb-8 leading-[1.15]" style={{ fontFamily: "var(--font-poppins)" }}>
            {post.title}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
            {post.content.split("\n").map((para, i) => (
              para.trim() ? (
                <p key={i} className="mb-6 text-[var(--foreground)] text-lg leading-relaxed opacity-90">
                  {para}
                </p>
              ) : <br key={i} />
            ))}
          </div>
        </article>

        <section className="border-t border-[var(--border)] pt-8">
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-6">Comments ({post.comments_count ?? 0})</h3>
          
          <form onSubmit={handleCommentSubmit} className="flex gap-3 mb-8">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="input flex-1"
            />
            <Button type="submit" variant="primary" disabled={submitting || !newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-[var(--muted-foreground)] text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  {comment.user?.avatar_url ? (
                    <Image
                      src={comment.user.avatar_url}
                      alt={comment.user.display_name || "User"}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[var(--primary-500)] flex items-center justify-center text-[var(--primary-foreground)] font-bold text-sm flex-shrink-0">
                      {(comment.user?.display_name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[var(--foreground)] text-sm">
                        {comment.user?.display_name || "Unknown User"}
                      </span>
                      <span className="text-[var(--muted-foreground)] text-xs">
                        {timeAgo(comment.created_at)}
                      </span>
                      {comment.user_id === currentUser && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] ml-auto p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[var(--foreground)] text-sm leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </ProtectedWrapper>
  );
}
