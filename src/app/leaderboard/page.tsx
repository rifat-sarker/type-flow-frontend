"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LeaderboardEntry } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

const MODES = ["time", "words", "quote"] as const;
const PERIODS = ["all", "weekly", "daily"] as const;
const PERIOD_LABEL: Record<(typeof PERIODS)[number], string> = {
  all: "all-time",
  weekly: "this week",
  daily: "today",
};

export default function LeaderboardPage() {
  const [mode, setMode] = useState<(typeof MODES)[number]>("time");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ leaderboard: LeaderboardEntry[] }>(`/api/leaderboard?mode=${mode}&period=${period}&limit=50`)
      .then((data) => setEntries(data.leaderboard))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, [mode, period]);

  return (
    <div>
      <h1 className="font-mono text-2xl font-bold mb-6">Leaderboard</h1>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wide border-2 rounded-none ${
                mode === m ? "bg-accent text-bg border-accent" : "bg-panel2 text-dim border-border hover:text-text"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wide border-2 rounded-none ${
                period === p ? "bg-accent text-bg border-accent" : "bg-panel2 text-dim border-border hover:text-text"
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-danger font-mono text-sm mb-4">{error}</p>}

      <table className="w-full border-collapse font-mono text-sm">
        <thead>
          <tr className="text-dim text-xs uppercase text-left border-b-2 border-border">
            <th className="py-2 pr-4 w-12">#</th>
            <th className="py-2 pr-4">Player</th>
            <th className="py-2 pr-4">Wpm</th>
            <th className="py-2 pr-4">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="py-6 text-dim">
                Loading...
              </td>
            </tr>
          ) : entries.length > 0 ? (
            entries.map((e, i) => (
              <tr key={e.userId} className="border-b border-border/60">
                <td className="py-2 pr-4 text-dim">{i + 1}</td>
                <td className="py-2 pr-4">
                  <span className="flex items-center gap-2">
                    <Avatar username={e.username} size={20} />
                    {e.username}
                  </span>
                </td>
                <td className="py-2 pr-4 text-accent font-semibold">{e.bestWpm}</td>
                <td className="py-2 pr-4">{e.accuracy}%</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="py-6 text-dim">
                No results yet for this mode.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
