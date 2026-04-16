"use client";

import { BlogPost } from "@/types";
import { Calendar, Edit2, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BlogCardProps {
  post: BlogPost;
  isAdmin?: boolean;
  onEdit?: (post: BlogPost) => void;
  onDelete?: (id: string) => void;
}

export default function BlogCard({ post, isAdmin, onEdit, onDelete }: BlogCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-color)] transition-all hover:shadow-lg hover:border-[var(--primary-400)]/30 group flex flex-col h-full">
      {post.image_url && (
        <Link href={`/blog/${post.id}`} className="relative h-52 w-full overflow-hidden">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <span className="text-white text-xs font-bold uppercase tracking-wider">Read Article</span>
          </div>
        </Link>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {formatDate(post.created_at)}
          </div>
        </div>
        <Link href={`/blog/${post.id}`}>
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-3 line-clamp-2 group-hover:text-[var(--primary-600)] transition-colors leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
            {post.title}
          </h3>
        </Link>
        <p className="text-[var(--muted-foreground)] text-sm line-clamp-3 mb-6 leading-relaxed flex-1">
          {post.content}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-5 border-t border-[var(--border)]">
          <Link 
            href={`/blog/${post.id}`}
            className="flex items-center gap-1.5 text-[var(--primary-600)] text-sm font-bold hover:gap-2.5 transition-all"
          >
            Read More
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onEdit?.(post);
                }}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--indigo-600)] hover:bg-[var(--indigo-50)] rounded-full transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete?.(post.id);
                }}
                className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
