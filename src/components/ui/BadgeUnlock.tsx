"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeInfo, TIER_STYLE } from "./BadgeCard";

/**
 * Celebration strip shown under the results panel when a test unlocks something.
 * Deliberately not a modal - it shouldn't block "next test".
 */
export function BadgeUnlock({
  badges,
  streakDays,
}: {
  badges: BadgeInfo[];
  streakDays: number | null;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (badges.length === 0) return;
    // Tiny delay so it animates in after the results have landed.
    const t = setTimeout(() => setShow(true), 120);
    return () => clearTimeout(t);
  }, [badges]);

  const showStreak = streakDays !== null && streakDays >= 2;
  if (badges.length === 0 && !showStreak) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      {showStreak && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-panel border-2 border-border font-mono text-sm">
          <span className="text-lg">🔥</span>
          <span className="text-text">{streakDays} day streak</span>
          <span className="text-dim text-xs">— come back tomorrow to keep it alive</span>
        </div>
      )}

      {badges.length > 0 && (
        <div
          className="border-2 border-accent bg-panel p-4 transition-all duration-500"
          style={{
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(8px)",
          }}
        >
          <div className="font-mono text-sm font-bold text-accent mb-3">
            {badges.length === 1 ? "New badge unlocked!" : `${badges.length} new badges unlocked!`}
          </div>
          <div className="flex flex-wrap gap-3">
            {badges.map((b) => (
              <div key={b.id} className="flex items-center gap-2.5 bg-panel2 border-2 border-border px-3 py-2">
                <span
                  className="w-9 h-9 flex items-center justify-center text-xl border-2 shrink-0"
                  style={{ borderColor: TIER_STYLE[b.tier].ring, background: `${TIER_STYLE[b.tier].ring}22` }}
                >
                  {b.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-xs font-semibold">{b.name}</span>
                  <span className="block text-dim text-[11px]">{b.description}</span>
                </span>
              </div>
            ))}
          </div>
          <Link href="/badges" className="inline-block text-accent text-xs font-mono mt-3 hover:underline">
            See all badges →
          </Link>
        </div>
      )}
    </div>
  );
}
