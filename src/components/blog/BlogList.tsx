"use client";

import { BlogPost } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import BlogCard from "./BlogCard";

interface BlogListProps {
  posts: BlogPost[];
  isAdmin?: boolean;
  onEdit?: (post: BlogPost) => void;
  onDelete?: (id: string) => void;
}

export default function BlogList({ posts, isAdmin, onEdit, onDelete }: BlogListProps) {
  const resultKey = posts.map((post) => post.id).join("-");

  return (
    <AnimatePresence mode="wait" initial={false}>
      {posts.length === 0 ? (
        <motion.div
          key="empty"
          className="rounded-[var(--radius-lg)] bg-[var(--surface)] py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
          <p className="text-[var(--muted-foreground)]">No blog posts found.</p>
        </motion.div>
      ) : (
        <motion.div
          key={resultKey}
          className="space-y-6"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <BlogCard
            post={posts[0]}
            featured
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          {posts.length > 1 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {posts.slice(1).map((post) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
