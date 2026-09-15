"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { BadgeCard, BadgeInfo } from "@/components/ui/BadgeCard";

export default function BadgesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user) return;
    api
      .get<{ badges: BadgeInfo[]; streakDays: number }>("/api/lessons/badges")
      .then((d) => {
        setBadges(d.badges);
        setStreak(d.streakDays);
      })
      .catch(() => {
        /* leave empty - page still renders */
      });
  }, [user, loading]);

  if (loading || !user) return null;

  const owned = badges.filter((b) => b.owned).length;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-2">Your badges</h1>
      <p className="text-dim text-sm mb-6">
        Earn these by getting faster, more accurate, and by showing up regularly.
      </p>

      <div className="grid gap-px bg-border border-2 border-border grid-cols-2 sm:grid-cols-3 mb-8">
        <div className="bg-panel p-3">
          <div className="text-2xl font-mono font-bold text-accent">
            {owned}/{badges.length}
          </div>
          <div className="text-xs font-mono uppercase text-dim">Badges earned</div>
        </div>
        <div className="bg-panel p-3">
          <div className="text-2xl font-mono font-bold text-accent">{streak}</div>
          <div className="text-xs font-mono uppercase text-dim">Day streak</div>
        </div>
        <div className="bg-panel p-3">
          <div className="text-2xl font-mono font-bold text-accent">{user.bestWpm}</div>
          <div className="text-xs font-mono uppercase text-dim">Best WPM</div>
        </div>
      </div>

      <div className="grid gap-px bg-border border-2 border-border grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((b) => (
          <BadgeCard key={b.id} badge={b} />
        ))}
      </div>
    </div>
  );
}
