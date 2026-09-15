"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTypingEngine, FinishStats } from "@/lib/useTypingEngine";
import { Lesson, generateLessonWords, LESSONS } from "@/lib/lessons";
import { codeFromKeyboardEvent } from "@/lib/fingerMap";
import { playKeySound, playErrorSound, playFinishSound } from "@/lib/sound";
import { WordDisplay } from "@/components/TypingTest/WordDisplay";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

// A lesson counts as passed at this bar, which is the standard "move on" gate in
// typing courses - speed comes later, accuracy first.
const PASS_ACCURACY = 90;

export function LessonRunner({ lesson }: { lesson: Lesson }) {
  const { user } = useAuth();
  const [words, setWords] = useState<string[]>([]);
  const engine = useTypingEngine(words);
  const { reset, typeChar, backspace, finish, computeFinishStats } = engine;

  const [stats, setStats] = useState<FinishStats | null>(null);
  const [pressedCode, setPressedCode] = useState<string | null>(null);
  const [pressId, setPressId] = useState(0);
  const savedRef = useRef(false);
  const soundRef = useRef(false);

  useEffect(() => {
    try {
      soundRef.current = localStorage.getItem("typeflow_sound") === "1";
    } catch {
      /* ignore */
    }
  }, []);

  const restart = useCallback(() => {
    const w = generateLessonWords(lesson, 30);
    setWords(w);
    reset(w);
    setStats(null);
    savedRef.current = false;
  }, [lesson, reset]);

  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // finish once the last character of the last word is typed
  useEffect(() => {
    if (engine.finished || !engine.started || words.length === 0) return;
    const onLast = engine.currentWordIdx >= words.length - 1;
    const lastLen = words[words.length - 1]?.length ?? 0;
    if (onLast && engine.currentCharIdx >= lastLen) finish();
  }, [engine.currentWordIdx, engine.currentCharIdx, engine.started, engine.finished, words, finish]);

  // compute + persist completion exactly once
  useEffect(() => {
    if (!engine.finished || savedRef.current) return;
    savedRef.current = true;
    const s = computeFinishStats();
    setStats(s);
    if (soundRef.current) playFinishSound();

    if (user && s.accuracy >= PASS_ACCURACY) {
      api.post("/api/lessons/complete", { lessonId: lesson.id }).catch(() => {
        /* non-fatal - progress just won't sync this time */
      });
    }
  }, [engine.finished, computeFinishStats, user, lesson.id]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      setPressedCode(codeFromKeyboardEvent(e));
      setPressId((id) => id + 1);

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

  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  const next = LESSONS[idx + 1];

  if (stats) {
    const passed = stats.accuracy >= PASS_ACCURACY;
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="font-mono text-xl font-bold mb-1">{lesson.title}</h1>
        <p className={`font-mono text-sm mb-6 ${passed ? "text-success" : "text-danger"}`}>
          {passed ? "Passed" : `Not quite — you need ${PASS_ACCURACY}% accuracy to pass`}
        </p>

        <div className="flex gap-8 mb-8">
          <div>
            <div className="text-4xl font-mono font-bold text-accent">{stats.wpm}</div>
            <div className="text-xs font-mono uppercase text-dim">wpm</div>
          </div>
          <div>
            <div className="text-4xl font-mono font-bold">{stats.accuracy}%</div>
            <div className="text-xs font-mono uppercase text-dim">accuracy</div>
          </div>
          <div>
            <div className="text-4xl font-mono font-bold">{stats.consistency}%</div>
            <div className="text-xs font-mono uppercase text-dim">consistency</div>
          </div>
        </div>

        {!user && passed && (
          <p className="text-dim text-xs font-mono mb-6">
            Log in to save your progress through the course.
          </p>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button onClick={restart}>Try again</Button>
          {passed && next && (
            <Link href={`/lessons/${next.id}`}>
              <Button variant="secondary">Next: {next.title}</Button>
            </Link>
          )}
          <Link href="/lessons">
            <Button variant="secondary">All lessons</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-3xl mb-6">
        <Link href="/lessons" className="text-dim text-xs font-mono hover:text-accent">
          ← All lessons
        </Link>
        <h1 className="font-mono text-xl font-bold mt-2">{lesson.title}</h1>
        <p className="text-dim text-sm">{lesson.subtitle}</p>
        {lesson.newKeys.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            <span className="text-xs font-mono text-dim mr-1">New keys:</span>
            {lesson.newKeys.map((k) => (
              <kbd
                key={k}
                className="px-2 py-0.5 text-xs font-mono bg-panel2 border-2 border-accent text-accent"
              >
                {k}
              </kbd>
            ))}
          </div>
        )}
      </div>

      <WordDisplay
        wordStates={engine.wordStates}
        currentWordIdx={engine.currentWordIdx}
        currentCharIdx={engine.currentCharIdx}
      />

      <div className="mt-6">
        <Button variant="secondary" onClick={restart}>
          Restart (tab)
        </Button>
      </div>
    </div>
  );
}
