"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import { useAuthSession } from "@/components/AuthSessionProvider";
import PostCard from "@/components/social/PostCard";
import CreatePostModal from "@/components/social/CreatePostModal";
import FriendManagement from "@/components/social/FriendManagement";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSocial } from "@/hooks/useSocial";
import type { Post, Friendship, Workout } from "@/types";
import { MessageCircle, Plus, Users, Rss } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import Button from "@/components/Button";

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<"feed" | "friends">("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [actionError, setActionError] = useState("");
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
    try {
      setActionError("");
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
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update post.");
    }
  };

  const handleCreatePost = async (payload: { content?: string; image?: File; workout_id?: string }) => {
    try {
      setActionError("");
      const post = await createPost(payload);
      setPosts((prev) => [post, ...prev]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not create post.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setActionError("");
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not delete post.");
    }
  };

  const pendingCount = friendships.filter(
    (f) => f.status === "pending" && f.friend_id === currentUserId
  ).length;

  return (
    <ProtectedWrapper>
      <div className="page-stack">
        <PageHeader
          title="Social"
          description="Connect and share with friends."
          actions={activeTab === "feed" ? (
            <Button
              onClick={() => setShowCreatePost(true)}
              className="px-4 py-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Post
            </Button>
          ) : null}
        />

        <div className="segmented-control">
          <button
            onClick={() => setActiveTab("feed")}
            className={`segmented-control-item ${
              activeTab === "feed"
                ? "segmented-control-item-active"
                : ""
            }`}
          >
            <Rss className="w-4 h-4" />
            Feed
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`segmented-control-item relative ${
              activeTab === "friends"
                ? "segmented-control-item-active"
                : ""
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

        {actionError && (
          <div className="mb-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {actionError}
          </div>
        )}

        {activeTab === "feed" && (
          <>
            <button
              type="button"
              onClick={() => setShowCreatePost(true)}
              className="card flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-[var(--primary-200)] sm:p-5"
            >
              <div className="icon-tile"><MessageCircle className="size-5" /></div>
              <span className="flex-1 text-sm font-medium text-[var(--muted-foreground)]">Share a workout, photo, or update...</span>
              <span className="hidden rounded-full bg-[var(--primary-500)] px-4 py-2 text-xs font-semibold text-white sm:inline">Create post</span>
            </button>
            {loadingFeed ? (
              <div className="flex min-h-[16rem] items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Rss className="w-8 h-8" />
                </div>
                <h3 className="empty-state-title">Your feed is quiet</h3>
                <p className="empty-state-description">
                  Add friends and share your first post to get started.
                </p>
                <div className="mt-5">
                  <Button onClick={() => setShowCreatePost(true)}>
                    <Plus className="w-4 h-4" />
                    Create your first post
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl space-y-5">
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
              <div className="flex min-h-[16rem] items-center justify-center">
                <LoadingSpinner />
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
