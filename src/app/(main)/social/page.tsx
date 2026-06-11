"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

        <AnimatePresence initial={false}>
          {actionError && (
            <motion.div
              className="mb-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {actionError}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
        {activeTab === "feed" ? (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div className="card mb-5 flex w-full items-center gap-3 p-4 sm:p-5">
              <div className="icon-tile"><MessageCircle className="size-5" /></div>
              <span className="flex-1 text-sm font-medium text-[var(--muted-foreground)]">Share a workout, photo, or update...</span>
              <Button
                variant="secondary"
                onClick={() => setShowCreatePost(true)}
                className="shrink-0"
              >
                Create post
              </Button>
            </div>
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
              <motion.div layout className="mx-auto w-full max-w-3xl space-y-5">
                <AnimatePresence initial={false} mode="popLayout">
                {posts.map((post) => (
                  <motion.div
                    layout
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                  >
                    <PostCard post={post} onLike={handleLike} onDelete={handleDeletePost} currentUserId={currentUserId} />
                  </motion.div>
                ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
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
          </motion.div>
        )}
        </AnimatePresence>

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
