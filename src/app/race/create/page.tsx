"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { RaceRecord } from "@/types";
import { Button } from "@/components/ui/Button";

const WORD_OPTIONS = [10, 25, 50];

export default function CreateRacePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"words" | "time">("words");
  const [amount, setAmount] = useState(25);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  async function createRace() {
    setCreating(true);
    setError(null);
    try {
      const data = await api.post<{ race: RaceRecord }>("/api/races", { mode, amount });
      router.push(`/race/${data.race.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create race");
      setCreating(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="max-w-md">
      <h1 className="font-mono text-2xl font-bold mb-2">Race a friend</h1>
      <p className="text-dim text-sm mb-8">
        Create a room, share the invite link, and type against each other live.
      </p>

      <div className="mb-6">
        <div className="text-xs font-mono uppercase text-dim mb-2">Mode</div>
        <div className="flex gap-2">
          {(["words", "time"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-mono uppercase border-2 rounded-none ${
                mode === m ? "bg-accent text-bg border-accent" : "bg-panel2 text-dim border-border"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "words" && (
        <div className="mb-6">
          <div className="text-xs font-mono uppercase text-dim mb-2">Word count</div>
          <div className="flex gap-2">
            {WORD_OPTIONS.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`px-3 py-1.5 text-xs font-mono border-2 rounded-none ${
                  amount === v ? "bg-accent text-bg border-accent" : "bg-panel2 text-dim border-border"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-danger font-mono text-sm mb-4">{error}</p>}

      <Button onClick={createRace} disabled={creating}>
        {creating ? "Creating..." : "Create race"}
      </Button>
    </div>
  );
}
