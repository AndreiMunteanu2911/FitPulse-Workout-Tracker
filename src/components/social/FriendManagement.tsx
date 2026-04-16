"use client";

import { useState, useEffect, useRef } from "react";
import type { Friendship, UserSearchResult } from "@/types";
import { useSocial } from "@/hooks/useSocial";
import { Search, UserPlus, UserCheck, UserX, Clock, Users } from "lucide-react";

interface FriendManagementProps {
  friendships: Friendship[];
  currentUserId: string;
  onFriendshipsChange: () => void;
}

export default function FriendManagement({ friendships, currentUserId, onFriendshipsChange }: FriendManagementProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { searchUsers, sendFriendRequest, respondToFriendRequest } = useSocial();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const acceptedFriends = friendships.filter((f) => f.status === "accepted");
  const pendingReceived = friendships.filter((f) => f.status === "pending" && f.friend_id === currentUserId);
  const pendingSent = friendships.filter((f) => f.status === "pending" && f.user_id === currentUserId);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(query);
        setSearchResults(results);
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

  const handleSendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await sendFriendRequest(userId);
      setSearchResults((prev) =>
        prev.map((u) => u.user_id === userId ? { ...u, friendship_status: "pending_sent" } : u)
      );
      onFriendshipsChange();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespond = async (friendshipId: string, action: "accept" | "decline" | "remove") => {
    setActionLoading(friendshipId);
    try {
      await respondToFriendRequest(friendshipId, action);
      onFriendshipsChange();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const getFriendName = (friendship: Friendship): string => {
    if (friendship.user_id === currentUserId) {
      return friendship.friend_stats?.display_name || "Unknown";
    }
    return friendship.user_stats?.display_name || "Unknown";
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by display name…"
          className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
        />
      </div>

      {query.length >= 2 && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Search Results</h3>
          {searching ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">Searching…</p>
          ) : searchResults.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">No users found.</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((u) => (
                <div key={u.user_id} className="flex items-center gap-3 p-3 bg-[var(--surface-raised)] rounded-[var(--radius-md)]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(u.display_name || "?")}
                  </div>
                  <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">
                    {u.display_name || "Unknown"}
                  </span>
                  {u.friendship_status === "none" && (
                    <button
                      onClick={() => handleSendRequest(u.user_id)}
                      disabled={actionLoading === u.user_id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary-500)] text-white hover:brightness-105 disabled:opacity-50 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  )}
                  {u.friendship_status === "pending_sent" && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--surface)]">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  )}
                  {u.friendship_status === "pending_received" && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--surface)]">
                      <Clock className="w-3.5 h-3.5" />
                      Incoming
                    </span>
                  )}
                  {u.friendship_status === "accepted" && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--color-success)] bg-[var(--color-success-bg)]">
                      <UserCheck className="w-3.5 h-3.5" />
                      Friends
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pendingReceived.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
            Friend Requests ({pendingReceived.length})
          </h3>
          <div className="space-y-2">
            {pendingReceived.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-[var(--surface-raised)] rounded-[var(--radius-md)]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {getInitials(getFriendName(f))}
                </div>
                <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">{getFriendName(f)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(f.id, "accept")}
                    disabled={actionLoading === f.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary-500)] text-white hover:brightness-105 disabled:opacity-50 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(f.id, "decline")}
                    disabled={actionLoading === f.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-[var(--color-destructive)] bg-[var(--color-destructive-bg)] hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingSent.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
            Sent Requests ({pendingSent.length})
          </h3>
          <div className="space-y-2">
            {pendingSent.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-[var(--surface-raised)] rounded-[var(--radius-md)]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {getInitials(getFriendName(f))}
                </div>
                <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">{getFriendName(f)}</span>
                <button
                  onClick={() => handleRespond(f.id, "remove")}
                  disabled={actionLoading === f.id}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] disabled:opacity-50 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
          Friends ({acceptedFriends.length})
        </h3>
        {acceptedFriends.length === 0 ? (
          <div className="text-center py-10 bg-[var(--surface-raised)] rounded-[var(--radius-md)]">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
              <Users className="w-6 h-6 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">No friends yet</p>
            <p className="text-xs text-[var(--muted-foreground)]">Search for users above to connect.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {acceptedFriends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-[var(--surface-raised)] rounded-[var(--radius-md)]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {getInitials(getFriendName(f))}
                </div>
                <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">{getFriendName(f)}</span>
                <button
                  onClick={() => handleRespond(f.id, "remove")}
                  disabled={actionLoading === f.id}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-[var(--color-destructive)] bg-[var(--color-destructive-bg)] hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
