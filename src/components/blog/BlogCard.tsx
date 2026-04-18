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
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] overflow-hidden border border-none transition-all hover:border-[var(--primary-400)]/30 group flex flex-row h-full">
      <div className="p-6 flex flex-col flex-1 w-[60%]">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {formatDate(post.created_at)}
          </div>
        </div>
        <Link href={`/blog/${post.id}`}>
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 line-clamp-2 group-hover:text-[var(--primary-500)] transition-colors leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
            {post.title}
          </h3>
        </Link>
        <p className="text-[var(--muted-foreground)] text-sm line-clamp-2 mb-4 leading-relaxed">
          {post.content}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-4">
            <Link 
              href={`/blog/${post.id}`}
              className="flex items-center gap-2 text-[var(--primary-500)] text-sm font-bold whitespace-nowrap"
            >
              Read More
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? "text-[var(--color-destructive)]" : "text-[var(--muted-foreground)] hover:text-[var(--color-destructive)]"}`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </button>
            
            <Link 
              href={`/blog/${post.id}`}
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--primary-500)] transition-colors"
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
        <Link href={`/blog/${post.id}`} className="relative w-[40%] h-auto min-h-[180px] flex-shrink-0 overflow-hidden">
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