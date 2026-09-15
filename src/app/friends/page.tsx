"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

interface FriendUser {
  _id: string;
  username: string;
  bestWpm: number;
}

export default function FriendsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendUser[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendUser[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    try {
      const d = await api.get<{ friends: FriendUser[]; requests: FriendUser[] }>("/api/friends");
      setFriends(d.friends ?? []);
      setRequests(d.requests ?? []);
    } catch {
      /* leave as-is */
    }
  }, []);

  useEffect(() => {
    if (!loading && user) load();
  }, [user, loading, load]);

  // Debounced search so we aren't firing a request per keystroke.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<{ users: FriendUser[] }>(`/api/friends/search?q=${encodeURIComponent(query.trim())}`)
        .then((d) => setResults(d.users ?? []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function act(fn: () => Promise<unknown>, note: string) {
    setMsg(null);
    try {
      await fn();
      setMsg(note);
      await load();
      setResults([]);
      setQuery("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (loading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-2">Friends</h1>
      <p className="text-dim text-sm mb-6">
        Add people and compare your best speeds on the friends leaderboard.
      </p>

      {msg && <p className="text-accent font-mono text-xs mb-4">{msg}</p>}

      <div className="mb-8">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username (2+ letters)"
        />
        {results.length > 0 && (
          <div className="border-2 border-border border-t-0">
            {results.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-3 py-2 border-b-2 border-border last:border-b-0">
                <Avatar username={u.username} size={22} />
                <span className="flex-1 font-mono text-sm">{u.username}</span>
                <span className="text-dim text-xs font-mono">{u.bestWpm} wpm</span>
                <button
                  onClick={() => act(() => api.post("/api/friends/request", { userId: u._id }), "Request sent.")}
                  className="text-accent text-xs font-mono hover:underline"
                >
                  add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {requests.length > 0 && (
        <div className="mb-8">
          <h2 className="font-mono text-sm font-semibold mb-3">Pending requests</h2>
          <div className="border-2 border-border">
            {requests.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-3 py-2 border-b-2 border-border last:border-b-0">
                <Avatar username={u.username} size={22} />
                <span className="flex-1 font-mono text-sm">{u.username}</span>
                <button
                  onClick={() => act(() => api.post("/api/friends/respond", { userId: u._id, accept: true }), "Friend added.")}
                  className="text-success text-xs font-mono hover:underline"
                >
                  accept
                </button>
                <button
                  onClick={() => act(() => api.post("/api/friends/respond", { userId: u._id, accept: false }), "Declined.")}
                  className="text-dim text-xs font-mono hover:underline"
                >
                  decline
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-mono text-sm font-semibold mb-3">
        Your friends {friends.length > 0 && <span className="text-dim">({friends.length})</span>}
      </h2>
      <div className="border-2 border-border">
        {friends.map((u) => (
          <div key={u._id} className="flex items-center gap-3 px-3 py-2 border-b-2 border-border last:border-b-0">
            <Avatar username={u.username} size={22} />
            <span className="flex-1 font-mono text-sm">{u.username}</span>
            <span className="text-dim text-xs font-mono">{u.bestWpm} wpm</span>
            <button
              onClick={() => act(() => api.del(`/api/friends/${u._id}`), "Friend removed.")}
              className="text-danger text-xs font-mono hover:underline"
            >
              remove
            </button>
          </div>
        ))}
        {friends.length === 0 && (
          <p className="text-dim text-sm px-3 py-6 font-mono">
            No friends yet — search above to add someone.
          </p>
        )}
      </div>
    </div>
  );
}
