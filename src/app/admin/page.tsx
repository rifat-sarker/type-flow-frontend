"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

interface AdminStats {
  users: number;
  verified: number;
  admins: number;
  tests: number;
  testsToday: number;
  races: number;
  topWpm: number;
}

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  isVerified: boolean;
  bestWpm: number;
  testsCompleted: number;
  createdAt: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/");
  }, [loading, user, router]);

  const loadUsers = useCallback(async (q: string) => {
    try {
      const d = await api.get<{ users: AdminUser[] }>(
        `/api/admin/users?limit=50${q ? `&search=${encodeURIComponent(q)}` : ""}`
      );
      setUsers(d.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  }, []);

  useEffect(() => {
    if (loading || !user || user.role !== "admin") return;
    api
      .get<{ stats: AdminStats }>("/api/admin/stats")
      .then((d) => setStats(d.stats))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats"));
    loadUsers("");
  }, [loading, user, loadUsers]);

  async function toggleRole(u: AdminUser) {
    setError(null);
    try {
      await api.patch("/api/admin/users/role", {
        userId: u._id,
        role: u.role === "admin" ? "user" : "admin",
      });
      await loadUsers(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    }
  }

  async function removeUser(u: AdminUser) {
    if (!confirm(`Delete ${u.username}? This also deletes their test history.`)) return;
    setError(null);
    try {
      await api.del(`/api/admin/users/${u._id}`);
      await loadUsers(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  if (loading || !user || user.role !== "admin") return null;

  const cards: [string, number | string][] = stats
    ? [
        ["Users", stats.users],
        ["Verified", stats.verified],
        ["Admins", stats.admins],
        ["Tests", stats.tests],
        ["Tests today", stats.testsToday],
        ["Races", stats.races],
        ["Top WPM", stats.topWpm],
      ]
    : [];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-6">Admin</h1>

      {error && <p className="text-danger font-mono text-sm mb-4">{error}</p>}

      <div className="grid gap-px bg-border border-2 border-border grid-cols-2 sm:grid-cols-4 mb-10">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-panel p-3">
            <div className="text-2xl font-mono font-bold text-accent">{value}</div>
            <div className="text-xs font-mono uppercase text-dim">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username or email"
        />
        <Button variant="secondary" onClick={() => loadUsers(search)}>
          Search
        </Button>
      </div>

      <div className="overflow-x-auto border-2 border-border">
        <table className="w-full border-collapse font-mono text-sm min-w-[640px]">
          <thead>
            <tr className="text-dim text-xs uppercase text-left border-b-2 border-border">
              <th className="py-2 px-3">User</th>
              <th className="py-2 px-3">Role</th>
              <th className="py-2 px-3">Verified</th>
              <th className="py-2 px-3">Best</th>
              <th className="py-2 px-3">Tests</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-border/60 last:border-b-0">
                <td className="py-2 px-3">
                  <span className="flex items-center gap-2">
                    <Avatar username={u.username} size={20} />
                    <span className="min-w-0">
                      <span className="block">{u.username}</span>
                      <span className="block text-dim text-xs truncate">{u.email}</span>
                    </span>
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className={u.role === "admin" ? "text-accent" : "text-dim"}>{u.role}</span>
                </td>
                <td className="py-2 px-3">
                  <span className={u.isVerified ? "text-success" : "text-dim"}>
                    {u.isVerified ? "yes" : "no"}
                  </span>
                </td>
                <td className="py-2 px-3">{u.bestWpm}</td>
                <td className="py-2 px-3">{u.testsCompleted}</td>
                <td className="py-2 px-3">
                  <span className="flex gap-2">
                    <button onClick={() => toggleRole(u)} className="text-accent text-xs hover:underline">
                      {u.role === "admin" ? "demote" : "make admin"}
                    </button>
                    <button onClick={() => removeUser(u)} className="text-danger text-xs hover:underline">
                      delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 px-3 text-dim">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
