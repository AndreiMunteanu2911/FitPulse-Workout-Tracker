"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { BlogPost } from "@/types";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import Button from "@/components/Button";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import Image from "next/image";

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog/${id}`);
        const { data } = await res.json();
        setPost(data);
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--primary-600)]" />
        <p className="text-[var(--muted-foreground)] font-medium animate-pulse">Loading story...</p>
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
        <p className="text-[var(--muted-foreground)] mb-8 max-w-md">The blog post you're looking for might have been moved or deleted.</p>
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

          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] mb-6">
            <div className="flex items-center gap-2 bg-[var(--surface-raised)] px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {post.created_at 
                  ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(post.created_at)) 
                  : "Recently"}
              </span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--foreground)] mb-8 leading-[1.15]" style={{ fontFamily: "var(--font-poppins)" }}>
            {post.title}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            {post.content.split("\n").map((para, i) => (
              para.trim() ? (
                <p key={i} className="mb-6 text-[var(--foreground)] text-lg leading-relaxed opacity-90">
                  {para}
                </p>
              ) : <br key={i} />
            ))}
          </div>
        </article>
      </div>
    </ProtectedWrapper>
  );
}
