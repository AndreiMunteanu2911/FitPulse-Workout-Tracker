"use client";

import { useEffect, useState } from "react";
import BlogList from "@/components/blog/BlogList";
import BlogFormModal from "@/components/blog/BlogFormModal";
import Button from "@/components/Button";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadReveal from "@/components/LoadReveal";
import { useAuthSession } from "@/components/AuthSessionProvider";
import { BlogPost } from "@/types";
import { BookOpen, Plus, Search } from "lucide-react";
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
      <div className="page-stack">
        <PageHeader
          title="Blog"
          description="Practical training ideas, product updates, and stories from FitPulse."
        />

        <div className="toolbar">
              <div className="icon-tile hidden sm:flex">
                <BookOpen className="size-5" />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--muted-foreground)] pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input !pl-11 !pr-10"
                />
              </div>
              <span className="hidden whitespace-nowrap px-3 text-sm font-semibold text-[var(--muted-foreground)] sm:block">
                {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
              </span>
              {isAdmin && (
                <Button
                  onClick={() => {
                    setEditingPost(null);
                    setIsModalOpen(true);
                  }}
                  className="shrink-0"
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">New Post</span>
                  <span className="sm:hidden">New</span>
                </Button>
              )}
        </div>

        {loading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <LoadReveal>
            <BlogList
              posts={filteredPosts}
              isAdmin={isAdmin}
              onEdit={(post) => {
                setEditingPost(post);
                setIsModalOpen(true);
              }}
              onDelete={setDeleteTarget}
            />
          </LoadReveal>
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
