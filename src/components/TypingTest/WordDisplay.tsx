"use client";

import { useEffect, useRef } from "react";
import { WordState, CharStatus } from "@/lib/useTypingEngine";

interface WordDisplayProps {
  wordStates: WordState[];
  currentWordIdx: number;
  currentCharIdx: number;
  blind?: boolean;
}

const STATUS_CLASS: Record<CharStatus, string> = {
  pending: "text-dim",
  correct: "text-text",
  incorrect: "text-danger underline decoration-2 underline-offset-2",
  missed: "text-dim/60 underline decoration-dotted",
};

export function WordDisplay({ wordStates, currentWordIdx, currentCharIdx, blind = false }: WordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const wordsEl = wordsRef.current;
    const caret = caretRef.current;
    if (!container || !wordsEl || !caret) return;

    const wordEls = wordsEl.querySelectorAll<HTMLElement>("[data-word]");
    const curWordEl = wordEls[currentWordIdx];
    if (!curWordEl) return;
    const charEls = curWordEl.querySelectorAll<HTMLElement>("[data-char]");
    const containerRect = container.getBoundingClientRect();

    let left: number;
    let top: number;
    let lineHeight = 44;

    if (currentCharIdx < charEls.length) {
      const r = charEls[currentCharIdx].getBoundingClientRect();
      left = r.left - containerRect.left;
      top = r.top - containerRect.top;
      lineHeight = r.height || lineHeight;
    } else {
      const lastChar = charEls[charEls.length - 1];
      const r = (lastChar ?? curWordEl).getBoundingClientRect();
      left = r.right - containerRect.left;
      top = r.top - containerRect.top;
      lineHeight = r.height || lineHeight;
    }

    caret.style.left = `${left}px`;
    caret.style.top = `${top}px`;

    const scrollLines = Math.max(0, Math.floor(top / lineHeight) - 1);
    wordsEl.style.transform = `translateY(-${scrollLines * lineHeight}px)`;
  }, [currentWordIdx, currentCharIdx, wordStates]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-3xl mx-auto font-mono text-2xl leading-[1.7] tracking-wide overflow-hidden h-[132px] select-none"
    >
      <div
        ref={caretRef}
        className="absolute top-0 w-[2px] h-[1.35em] bg-accent caret-blink transition-[left,top] duration-100"
      />
      <div ref={wordsRef} className="transition-transform duration-200">
        {wordStates.map((word, wi) => (
          <span key={wi} data-word className="inline-block mr-[0.55em]">
            {word.chars.map((c, ci) => {
              const effective: CharStatus = blind && c.status === "incorrect" ? "correct" : c.status;
              return (
                <span key={ci} data-char className={STATUS_CLASS[effective]}>
                  {c.char}
                </span>
              );
            })}
            {word.extra && <span className="text-danger/60">{word.extra}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
