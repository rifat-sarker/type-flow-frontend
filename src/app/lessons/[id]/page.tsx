"use client";

import Link from "next/link";
import { getLesson } from "@/lib/lessons";
import { LessonRunner } from "@/components/Lessons/LessonRunner";

// Next 14 passes params as a plain object (the Promise + use() form is Next 15+).
export default function LessonPage({ params }: { params: { id: string } }) {
  const lesson = getLesson(params.id);

  if (!lesson) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="font-mono text-xl font-bold mb-2">Lesson not found</h1>
        <Link href="/lessons" className="text-accent font-mono text-sm">
          Back to all lessons
        </Link>
      </div>
    );
  }

  return <LessonRunner lesson={lesson} />;
}
