"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LESSONS } from "@/lib/lessons";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function LessonsPage() {
  const { user, loading } = useAuth();
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    if (loading || !user) return;
    api
      .get<{ completedLessons: string[] }>("/api/lessons/progress")
      .then((d) => setDone(d.completedLessons ?? []))
      .catch(() => {
        /* not fatal - just show everything as not-yet-done */
      });
  }, [user, loading]);

  const completedCount = done.length;
  const pct = Math.round((completedCount / LESSONS.length) * 100);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-mono text-2xl font-bold mb-2">Learn to touch type</h1>
      <p className="text-dim text-sm mb-6">
        Start at the home row and add a few keys at a time. Each lesson needs 90% accuracy
        to pass — speed comes after your fingers know where the keys are.
      </p>

      {user ? (
        <div className="mb-8">
          <div className="flex justify-between text-xs font-mono text-dim mb-1.5">
            <span>
              {completedCount} of {LESSONS.length} lessons passed
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-3 bg-panel2 border-2 border-border">
            <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : (
        <p className="text-dim text-xs font-mono mb-8">
          <Link href="/login" className="text-accent">
            Log in
          </Link>{" "}
          to save your progress through the course.
        </p>
      )}

      <div className="border-2 border-border">
        {LESSONS.map((lesson, i) => {
          const isDone = done.includes(lesson.id);
          return (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.id}`}
              className="flex items-center gap-4 px-4 py-3 border-b-2 border-border last:border-b-0 hover:bg-panel2 transition-colors"
            >
              <span
                className={`w-7 h-7 shrink-0 flex items-center justify-center text-xs font-mono font-bold border-2 ${
                  isDone
                    ? "bg-success/20 border-success text-success"
                    : "bg-panel2 border-border text-dim"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-mono text-sm">{lesson.title}</span>
                <span className="block text-dim text-xs truncate">{lesson.subtitle}</span>
              </span>
              <span className="text-dim text-xs font-mono shrink-0">
                {isDone ? "passed" : "start →"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
