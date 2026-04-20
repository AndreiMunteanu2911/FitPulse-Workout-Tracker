"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import { useAuthSession } from "@/components/AuthSessionProvider";
import PostCard from "@/components/social/PostCard";
import CreatePostModal from "@/components/social/CreatePostModal";
import FriendManagement from "@/components/social/FriendManagement";
import { useSocial } from "@/hooks/useSocial";
import type { Post, Friendship, Workout } from "@/types";
import { Plus, Users, Rss } from "lucide-react";

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<"feed" | "friends">("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { fetchFeed, fetchFriendships, createPost, toggleLike, deletePost } = useSocial();
  const { user } = useAuthSession();
  const currentUserId = user?.id ?? "";

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const data = await fetchFeed();
      setPosts(data);
    } catch {
      // ignore
    } finally {
      setLoadingFeed(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFriendships = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const data = await fetchFriendships();
      setFriendships(data);
    } catch {
      // ignore
    } finally {
      setLoadingFriends(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/workouts")
      .then((r) => r.json())
      .then((d) => { if (d.workouts) setRecentWorkouts(d.workouts.slice(0, 10)); })
      .catch(() => {});

    loadFeed();
    loadFriendships();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLike = async (postId: string) => {
    const liked = await toggleLike(postId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: liked,
              likes_count: liked ? (p.likes_count || 0) + 1 : Math.max((p.likes_count || 0) - 1, 0),
            }
          : p
      )
    );
  };

  const handleCreatePost = async (payload: { content?: string; image?: File; workout_id?: string }) => {
    const post = await createPost(payload);
    setPosts((prev) => [post, ...prev]);
  };

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const pendingCount = friendships.filter(
    (f) => f.status === "pending" && f.friend_id === currentUserId
  ).length;

  return (
    <ProtectedWrapper>
      <div className="w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Social
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Connect and share with friends.</p>
          </div>
          {activeTab === "feed" && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white hover:brightness-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              Post
            </button>
          )}
        </div>

        <div className="flex gap-1 bg-[var(--surface)] rounded-[var(--radius-md)] p-1 mb-5">
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--radius-sm)] text-sm font-semibold transition-all ${
              activeTab === "feed"
                ? "bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Rss className="w-4 h-4" />
            Feed
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--radius-sm)] text-sm font-semibold transition-all relative ${
              activeTab === "friends"
                ? "bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Users className="w-4 h-4" />
            Friends
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-[var(--lime-green)] text-black text-[10px] font-bold px-1">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "feed" && (
          <>
            {loadingFeed ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--surface-raised)]" />
                      <div className="space-y-1 flex-1">
                        <div className="h-3 bg-[var(--surface-raised)] rounded w-1/3" />
                        <div className="h-2.5 bg-[var(--surface-raised)] rounded w-1/5" />
                      </div>
                    </div>
                    <div className="h-3 bg-[var(--surface-raised)] rounded w-full mb-2" />
                    <div className="h-3 bg-[var(--surface-raised)] rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-[var(--surface)] rounded-[var(--radius-lg)]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-[var(--radius-md)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
                  <Rss className="w-8 h-8 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Your feed is quiet</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Add friends and share your first post to get started.
                </p>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white hover:brightness-105 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create your first post
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onLike={handleLike} onDelete={handleDeletePost} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "friends" && (
          <>
            {loadingFriends ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[var(--surface-raised)] rounded-[var(--radius-md)] p-3 animate-pulse flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--surface)]" />
                    <div className="h-3 bg-[var(--surface)] rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <FriendManagement
                friendships={friendships}
                currentUserId={currentUserId}
                onFriendshipsChange={loadFriendships}
              />
            )}
          </>
        )}

        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
          recentWorkouts={recentWorkouts}
        />
      </div>
    </ProtectedWrapper>
  );
}
