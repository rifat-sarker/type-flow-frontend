"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { AuthUser } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export default function SettingsPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) setUsername(user.username);
  }, [user]);

  async function saveUsername(e: FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    setSavingName(true);
    try {
      await api.patch<{ user: AuthUser }>("/api/auth/profile", { username });
      await refreshUser();
      setNameMsg({ ok: true, text: "Username updated." });
    } catch (err) {
      setNameMsg({ ok: false, text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setSavingPw(true);
    try {
      await api.post("/api/auth/change-password", { currentPassword, newPassword });
      setPwMsg({ ok: true, text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setSavingPw(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-6">Settings</h1>

      <div className="flex items-center gap-3 mb-8 p-3 bg-panel border-2 border-border">
        <Avatar username={user.username} size={40} />
        <div className="min-w-0">
          <div className="font-mono text-sm">{user.username}</div>
          <div className="text-dim text-xs truncate">{user.email}</div>
          <div className="text-dim text-xs mt-0.5">
            {user.role === "admin" && <span className="text-accent">admin · </span>}
            {user.isVerified ? "verified" : "not verified"}
          </div>
        </div>
      </div>

      <form onSubmit={saveUsername} className="mb-10">
        <h2 className="font-mono text-sm font-semibold mb-3">Username</h2>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={20} required />
        {nameMsg && (
          <p className={`text-xs font-mono mt-2 ${nameMsg.ok ? "text-success" : "text-danger"}`}>
            {nameMsg.text}
          </p>
        )}
        <Button type="submit" disabled={savingName || username === user.username} className="mt-3">
          {savingName ? "Saving..." : "Save username"}
        </Button>
      </form>

      <form onSubmit={savePassword}>
        <h2 className="font-mono text-sm font-semibold mb-3">Change password</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-mono uppercase text-dim mb-1.5">Current password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-dim mb-1.5">New password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
        </div>
        {pwMsg && (
          <p className={`text-xs font-mono mt-2 ${pwMsg.ok ? "text-success" : "text-danger"}`}>{pwMsg.text}</p>
        )}
        <Button type="submit" disabled={savingPw} className="mt-3">
          {savingPw ? "Saving..." : "Change password"}
        </Button>
      </form>

      {user.role === "admin" && (
        <p className="text-dim text-xs font-mono mt-10">
          <Link href="/admin" className="text-accent">
            Open admin panel →
          </Link>
        </p>
      )}
    </div>
  );
}
