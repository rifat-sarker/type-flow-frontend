"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useTypingEngine, FinishStats } from "@/lib/useTypingEngine";
import { WeakKey, generateWeakKeyWords } from "@/lib/weakKeys";
import { codeFromKeyboardEvent } from "@/lib/fingerMap";
import { playKeySound, playErrorSound, playFinishSound, setSoundEnabled } from "@/lib/sound";
import { WordDisplay } from "@/components/TypingTest/WordDisplay";
import { TextSize, getStoredTextSize } from "@/lib/textSize";
import { Button } from "@/components/ui/Button";

function accuracyColor(acc: number): string {
  if (acc >= 95) return "text-success";
  if (acc >= 85) return "text-accent";
  return "text-danger";
}

export default function PracticePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [weak, setWeak] = useState<WeakKey[] | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const engine = useTypingEngine(words);
  const { reset, typeChar, backspace, finish, computeFinishStats, getKeyStats } = engine;

  const [stats, setStats] = useState<FinishStats | null>(null);
  const [textSize, setTextSize] = useState<TextSize>("md");
  const savedRef = useRef(false);
  const soundRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("typeflow_sound");
      const on = stored === null ? true : stored === "1";
      soundRef.current = on;
      setSoundEnabled(on);
    } catch {
      /* ignore */
    }
    setTextSize(getStoredTextSize());
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    api
      .get<{ keys: WeakKey[] }>("/api/results/weak-keys")
      .then((d) => setWeak(d.keys))
      .catch(() => setWeak([]));
  }, [user, loading]);

  const restart = useCallback(() => {
    if (!weak) return;
    const w = generateWeakKeyWords(weak, 30);
    setWords(w);
    reset(w);
    setStats(null);
    savedRef.current = false;
  }, [weak, reset]);

  useEffect(() => {
    if (weak && weak.length > 0) restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weak]);

  useEffect(() => {
    if (engine.finished || !engine.started || words.length === 0) return;
    const onLast = engine.currentWordIdx >= words.length - 1;
    const lastLen = words[words.length - 1]?.length ?? 0;
    if (onLast && engine.currentCharIdx >= lastLen) finish();
  }, [engine.currentWordIdx, engine.currentCharIdx, engine.started, engine.finished, words, finish]);

  useEffect(() => {
    if (!engine.finished || savedRef.current) return;
    savedRef.current = true;
    const s = computeFinishStats();
    setStats(s);
    if (soundRef.current) playFinishSound();
    api
      .post("/api/results", { mode: "words", amount: words.length, ...s, keyStats: getKeyStats() })
      .then(() => api.get<{ keys: WeakKey[] }>("/api/results/weak-keys"))
      .then((d) => setWeak(d.keys))
      .catch(() => {
        /* non-fatal */
      });
  }, [engine.finished, computeFinishStats, getKeyStats, words.length]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      codeFromKeyboardEvent(e);
      if (e.key === "Escape" || e.key === "Tab") {
        e.preventDefault();
        restart();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        return;
      }
      if (engine.finished) return;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const r = typeChar(e.key);
        if (soundRef.current) {
          if (r === "incorrect") playErrorSound();
          else if (r === "correct" || r === "space") playKeySound();
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
      }
    }
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [engine.finished, typeChar, backspace, restart]);

  if (loading || !user) return null;

  if (weak === null) {
    return <p className="text-dim font-mono text-sm">Looking at your keys...</p>;
  }

  if (weak.length === 0) {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="font-mono text-2xl font-bold mb-2">Weak key practice</h1>
        <p className="text-dim text-sm mb-6">
          Not enough data yet. Finish a few normal tests and we&apos;ll work out which keys
          you keep missing, then build drills around exactly those.
        </p>
        <Link href="/">
          <Button>Take a test</Button>
        </Link>
      </div>
    );
  }

  const worst = weak.slice(0, 8);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-1">Weak key practice</h1>
      <p className="text-dim text-sm mb-6">
        Built from the keys you actually miss — worst first. Every run updates the list.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {worst.map((k) => (
          <div key={k.key} className="bg-panel border-2 border-border px-3 py-2 text-center min-w-[64px]">
            <div className="font-mono text-lg font-bold">{k.key === " " ? "␣" : k.key}</div>
            <div className={`font-mono text-xs ${accuracyColor(k.accuracy)}`}>{k.accuracy}%</div>
            <div className="text-dim text-[10px] font-mono">{k.misses} miss</div>
          </div>
        ))}
      </div>

      {stats ? (
        <div className="mb-8">
          <div className="flex gap-8 mb-6">
            <div>
              <div className="text-4xl font-mono font-bold text-accent">{stats.wpm}</div>
              <div className="text-xs font-mono uppercase text-dim">wpm</div>
            </div>
            <div>
              <div className="text-4xl font-mono font-bold">{stats.accuracy}%</div>
              <div className="text-xs font-mono uppercase text-dim">accuracy</div>
            </div>
          </div>
          <Button onClick={restart}>Practise again</Button>
        </div>
      ) : (
        <>
          <WordDisplay
            wordStates={engine.wordStates}
            currentWordIdx={engine.currentWordIdx}
            currentCharIdx={engine.currentCharIdx}
            size={textSize}
          />
          <div className="mt-6">
            <Button variant="secondary" onClick={restart}>
              Restart (tab)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
