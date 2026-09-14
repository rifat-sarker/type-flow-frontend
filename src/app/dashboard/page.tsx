"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { TestResultRecord } from "@/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<TestResultRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ results: TestResultRecord[] }>("/api/results/me?limit=20")
      .then((data) => setResults(data.results))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"));
  }, [user]);

  if (loading || !user) return null;

  return (
    <div>
      <h1 className="font-mono text-2xl font-bold mb-8">{user.username}</h1>

      <div className="flex gap-12 mb-10">
        <div>
          <div className="text-4xl font-mono font-bold text-accent">{user.bestWpm}</div>
          <div className="text-dim text-xs uppercase tracking-wide mt-1">best wpm</div>
        </div>
        <div>
          <div className="text-4xl font-mono font-bold text-text">{results?.length ?? "-"}</div>
          <div className="text-dim text-xs uppercase tracking-wide mt-1">recent tests loaded</div>
        </div>
      </div>

      <h2 className="font-mono text-sm uppercase tracking-wide text-dim mb-3">Recent tests (synced across devices)</h2>

      {error && <p className="text-danger font-mono text-sm">{error}</p>}

      <table className="w-full border-collapse font-mono text-sm">
        <thead>
          <tr className="text-dim text-xs uppercase text-left border-b-2 border-border">
            <th className="py-2 pr-4">When</th>
            <th className="py-2 pr-4">Mode</th>
            <th className="py-2 pr-4">Wpm</th>
            <th className="py-2 pr-4">Accuracy</th>
            <th className="py-2 pr-4">Consistency</th>
          </tr>
        </thead>
        <tbody>
          {results && results.length > 0 ? (
            results.map((r) => (
              <tr key={r._id} className="border-b border-border/60">
                <td className="py-2 pr-4 text-dim">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="py-2 pr-4">
                  {r.mode} {r.amount}
                </td>
                <td className="py-2 pr-4 text-accent font-semibold">{r.wpm}</td>
                <td className="py-2 pr-4">{r.accuracy}%</td>
                <td className="py-2 pr-4">{r.consistency}%</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-6 text-dim">
                No tests yet — go type something.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
