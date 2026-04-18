"use client";

import { BlogPost } from "@/types";
import BlogCard from "./BlogCard";

interface BlogListProps {
  posts: BlogPost[];
  isAdmin?: boolean;
  onEdit?: (post: BlogPost) => void;
  onDelete?: (id: string) => void;
}

export default function BlogList({ posts, isAdmin, onEdit, onDelete }: BlogListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--surface)] rounded-[var(--radius-lg)]">
        <p className="text-[var(--muted-foreground)]">No blog posts found.</p>
      </div>
    );
  }

return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {posts.map((post) => (
        <BlogCard
          key={post.id}
          post={post}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
