"use client";

import { useState } from "react";
import { BlogPost } from "@/types";
import { Calendar, Edit2, Trash2, ArrowRight, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BlogCardProps {
  post: BlogPost;
  isAdmin?: boolean;
  onEdit?: (post: BlogPost) => void;
  onDelete?: (id: string) => void;
}

export default function BlogCard({ post, isAdmin, onEdit, onDelete }: BlogCardProps) {
  const [liked, setLiked] = useState(post.liked_by_me ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const res = await fetch(`/api/blog/${post.id}/like`, { method: "POST" });
      const data = await res.json();
      if (!data.error) {
        setLiked(data.liked);
        setLikesCount(data.liked ? likesCount + 1 : likesCount - 1);
      }
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:flex-row">
      <div className="flex flex-1 flex-col p-5 sm:w-[60%] sm:p-6">
        <div className="mb-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface-raised)] px-3 py-1.5">
            <Calendar className="w-3 h-3" />
            {formatDate(post.created_at)}
          </div>
        </div>
        <Link href={`/blog/${post.id}`}>
          <h3 className="mb-2 line-clamp-2 text-xl font-extrabold leading-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--primary-500)]" style={{ fontFamily: "var(--font-poppins)" }}>
            {post.title}
          </h3>
        </Link>
        <p className="mb-4 line-clamp-3 text-base leading-relaxed text-[var(--muted-foreground)]">
          {post.content}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Link 
              href={`/blog/${post.id}`}
              className="flex items-center gap-2 rounded-full bg-[var(--primary-50)] px-3 py-2 text-sm font-bold text-[var(--primary-600)] whitespace-nowrap dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]"
            >
              Read More
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors ${liked ? "bg-[var(--color-destructive-bg)] text-[var(--color-destructive)]" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--color-destructive)]"}`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </button>
            
            <Link 
              href={`/blog/${post.id}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--primary-500)]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments_count ?? 0}</span>
            </Link>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-4 pt-3 border-t border-[var(--border)] mt-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit?.(post);
              }}
              className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary-500)] transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete?.(post.id);
              }}
              className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
      {post.image_url && (
        <Link href={`/blog/${post.id}`} className="relative min-h-[220px] flex-shrink-0 overflow-hidden sm:w-[40%]">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
      )}
    </div>
  );
}
