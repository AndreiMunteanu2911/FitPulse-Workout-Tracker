"use client";

import { useEffect, useState } from "react";
import BlogList from "@/components/blog/BlogList";
import BlogFormModal from "@/components/blog/BlogFormModal";
import Button from "@/components/Button";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuthSession } from "@/components/AuthSessionProvider";
import { BlogPost } from "@/types";
import { Plus, Search } from "lucide-react";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import { PageHeader } from "@/components/PageHeader";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useAuthSession();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog");
      const { data } = await res.json();
      setPosts(data || []);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (formData: FormData) => {
    const method = editingPost ? "PATCH" : "POST";
    const url = editingPost ? `/api/blog/${editingPost.id}` : "/api/blog";

    try {
      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/blog/${deleteTarget}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== deleteTarget));
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedWrapper>
      <div className="w-full">
        <PageHeader
          title="Blog"
          description="Training tips, product news, and updates from FitPulse."
          actions={
            <div className="flex items-center gap-3">
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--muted-foreground)] pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-white dark:bg-[var(--surface)] rounded-[var(--radius-lg)] text-[var(--foreground)] text-sm font-medium placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] transition"
                />
              </div>
              {isAdmin && (
                <Button
                  onClick={() => {
                    setEditingPost(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 whitespace-nowrap w-full lg:w-auto"
                >
                  <Plus className="w-4.5 h-4.5" />
                  New Post
                </Button>
              )}
            </div>
          }
        />

        {loading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <BlogList
            posts={filteredPosts}
            isAdmin={isAdmin}
            onEdit={(post) => {
              setEditingPost(post);
              setIsModalOpen(true);
            }}
            onDelete={setDeleteTarget}
          />
        )}

        <BlogFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateOrUpdate}
          initialData={editingPost}
        />

        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Blog Post"
          itemName="this blog post"
        />
      </div>
    </ProtectedWrapper>
  );
}
