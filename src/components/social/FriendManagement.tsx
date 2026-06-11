"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Search, UserCheck, UserPlus, Users, UserX, X } from "lucide-react";
import type { Friendship, UserSearchResult } from "@/types";
import { useSocial } from "@/hooks/useSocial";
import Button from "@/components/Button";

interface FriendManagementProps {
  friendships: Friendship[];
  currentUserId: string;
  onFriendshipsChange: () => void;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] text-xs font-bold text-white">
      {initials(name)}
    </div>
  );
}

export default function FriendManagement({ friendships, currentUserId, onFriendshipsChange }: FriendManagementProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { searchUsers, sendFriendRequest, respondToFriendRequest } = useSocial();

  const accepted = friendships.filter((friendship) => friendship.status === "accepted");
  const received = friendships.filter(
    (friendship) => friendship.status === "pending" && friendship.friend_id === currentUserId,
  );
  const sent = friendships.filter(
    (friendship) => friendship.status === "pending" && friendship.user_id === currentUserId,
  );

  const friendName = (friendship: Friendship) =>
    friendship.user_id === currentUserId
      ? friendship.friend_stats?.display_name || "Unknown"
      : friendship.user_stats?.display_name || "Unknown";

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearchResults(await searchUsers(query));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const sendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await sendFriendRequest(userId);
      setSearchResults((results) =>
        results.map((user) =>
          user.user_id === userId ? { ...user, friendship_status: "pending_sent" } : user,
        ),
      );
      onFriendshipsChange();
    } catch {
      // Keep the current result state when the request fails.
    } finally {
      setActionLoading(null);
    }
  };

  const respond = async (friendshipId: string, action: "accept" | "decline" | "remove") => {
    setActionLoading(friendshipId);
    try {
      await respondToFriendRequest(friendshipId, action);
      onFriendshipsChange();
    } catch {
      // Keep the current friendship state when the action fails.
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-6">
        <p className="eyebrow">Find people</p>
        <h2 className="section-heading">Grow your training circle</h2>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by display name..."
            className="input !pl-10"
          />
        </div>
      </section>

      {query.trim().length >= 2 && (
        <section className="card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Search results</h3>
          {searching ? (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">Searching...</p>
          ) : searchResults.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">No users found.</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => {
                const name = user.display_name || "Unknown";
                return (
                  <div key={user.user_id} className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-3">
                    <Avatar name={name} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--foreground)]">{name}</span>
                    {user.friendship_status === "none" && (
                      <Button onClick={() => sendRequest(user.user_id)} disabled={actionLoading === user.user_id} className="min-h-9 px-3 py-2 text-xs sm:min-h-9 sm:px-3 sm:py-2 sm:text-xs">
                        <UserPlus className="size-3.5" />Add
                      </Button>
                    )}
                    {user.friendship_status === "accepted" && (
                      <span className="badge bg-[var(--color-success-bg)] text-[var(--color-success)]"><UserCheck className="size-3.5" />Friends</span>
                    )}
                    {(user.friendship_status === "pending_sent" || user.friendship_status === "pending_received") && (
                      <span className="badge bg-[var(--surface)] text-[var(--muted-foreground)]"><Clock className="size-3.5" />Pending</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {received.length > 0 && (
        <section className="card p-5">
          <p className="eyebrow">Requests</p>
          <h2 className="section-heading">Waiting for your response</h2>
          <div className="mt-4 space-y-2">
            {received.map((friendship) => {
              const name = friendName(friendship);
              return (
                <div key={friendship.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-3">
                  <Avatar name={name} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>
                  <Button onClick={() => respond(friendship.id, "accept")} disabled={actionLoading === friendship.id} className="min-h-9 px-3 py-2 text-xs sm:min-h-9 sm:px-3 sm:py-2 sm:text-xs">
                    <UserCheck className="size-3.5" />Accept
                  </Button>
                  <Button onClick={() => respond(friendship.id, "decline")} disabled={actionLoading === friendship.id} variant="danger" className="min-h-9 px-3 py-2 text-xs sm:min-h-9 sm:px-3 sm:py-2 sm:text-xs">
                    <UserX className="size-3.5" />Decline
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {sent.length > 0 && (
        <section className="card p-5">
          <p className="eyebrow">Pending</p>
          <h2 className="section-heading">Sent requests</h2>
          <div className="mt-4 space-y-2">
            {sent.map((friendship) => {
              const name = friendName(friendship);
              return (
                <div key={friendship.id} className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-3">
                  <Avatar name={name} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>
                  <Button onClick={() => respond(friendship.id, "remove")} disabled={actionLoading === friendship.id} variant="textOnly" className="min-h-9 px-3 py-2 text-xs sm:min-h-9 sm:px-3 sm:py-2 sm:text-xs">
                    <X className="size-3.5" />Cancel
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Connections</p>
            <h2 className="section-heading">Friends ({accepted.length})</h2>
          </div>
          <Users className="size-5 text-[var(--primary-500)]" />
        </div>
        {accepted.length === 0 ? (
          <div className="mt-4 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] py-10 text-center">
            <p className="font-semibold text-[var(--foreground)]">No friends yet</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Search above to connect with other users.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {accepted.map((friendship) => {
              const name = friendName(friendship);
              return (
                <div key={friendship.id} className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-3">
                  <Avatar name={name} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>
                  <button
                    onClick={() => respond(friendship.id, "remove")}
                    disabled={actionLoading === friendship.id}
                    aria-label={`Remove ${name}`}
                    className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--color-destructive-bg)] hover:text-[var(--color-destructive)]"
                  >
                    <UserX className="size-4" />
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
