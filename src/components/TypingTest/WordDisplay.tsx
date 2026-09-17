"use client";

import { useEffect, useRef, useState } from "react";
import { WordState, CharStatus } from "@/lib/useTypingEngine";
import { TextSize, TEXT_SIZE_CLASS } from "@/lib/textSize";

interface WordDisplayProps {
  wordStates: WordState[];
  currentWordIdx: number;
  currentCharIdx: number;
  blind?: boolean;
  size?: TextSize;
}

const STATUS_CLASS: Record<CharStatus, string> = {
  pending: "text-dim",
  correct: "text-text",
  incorrect: "text-danger underline decoration-2 underline-offset-2",
  missed: "text-dim/60 underline decoration-dotted",
};

export function WordDisplay({
  wordStates,
  currentWordIdx,
  currentCharIdx,
  blind = false,
  size = "md",
}: WordDisplayProps) {
  const sizeClass = TEXT_SIZE_CLASS[size];
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<Map<string, CharStatus>>(new Map());

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smooth caret + word scroll positioning
  useEffect(() => {
    // Stop blinking while typing
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 500);

    const wordsEl = wordsRef.current;
    const caret = caretRef.current;
    if (!wordsEl || !caret) return;

    const wordEls = wordsEl.querySelectorAll<HTMLElement>("[data-word]");
    const curWordEl = wordEls[currentWordIdx];
    if (!curWordEl) return;
    const charEls = curWordEl.querySelectorAll<HTMLElement>("[data-char]");

    let left: number;
    let rawTop: number;
    let lineHeight = 44;

    if (currentCharIdx < charEls.length) {
      const el = charEls[currentCharIdx];
      left = el.offsetLeft;
      rawTop = el.offsetTop;
      lineHeight = el.offsetHeight || lineHeight;
    } else {
      const lastChar = charEls[charEls.length - 1];
      const el = lastChar ?? curWordEl;
      left = el.offsetLeft + (lastChar ? el.offsetWidth : 0);
      rawTop = el.offsetTop;
      lineHeight = el.offsetHeight || lineHeight;
    }

    const scrollLines = Math.max(0, Math.floor(rawTop / lineHeight) - 1);
    const top = rawTop - scrollLines * lineHeight;

    caret.style.left = `${left}px`;
    caret.style.top = `${top}px`;
    wordsEl.style.transform = `translateY(-${scrollLines * lineHeight}px)`;
  }, [currentWordIdx, currentCharIdx, wordStates]);

  // Animate chars that just changed status
  useEffect(() => {
    const wordsEl = wordsRef.current;
    if (!wordsEl) return;

    const wordEls = wordsEl.querySelectorAll<HTMLElement>("[data-word]");
    wordStates.forEach((word, wi) => {
      const wordEl = wordEls[wi];
      if (!wordEl) return;
      const charEls = wordEl.querySelectorAll<HTMLElement>("[data-char]");
      word.chars.forEach((c, ci) => {
        const key = `${wi}-${ci}`;
        const prev = prevStatusRef.current.get(key);
        const el = charEls[ci];
        if (!el) return;

        if (prev !== c.status) {
          // Remove existing animation classes first
          el.classList.remove("char-correct-anim", "char-error-anim");

          if (c.status === "correct" && prev === "pending") {
            // Trigger correct animation
            void el.offsetWidth; // force reflow
            el.classList.add("char-correct-anim");
          } else if (c.status === "incorrect" && prev === "pending") {
            // Trigger error shake
            void el.offsetWidth;
            el.classList.add("char-error-anim");
            setTimeout(() => el.classList.remove("char-error-anim"), 130);
          }

          prevStatusRef.current.set(key, c.status);
        }
      });
    });
  }, [wordStates]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-5xl mx-auto typing-font leading-[1.75] tracking-wide overflow-hidden select-none ${sizeClass.text} ${sizeClass.height}`}
    >
      {/* Smooth caret — no blink while typing, blinks at rest */}
      <div
        ref={caretRef}
        className={`absolute top-0 w-[2.5px] rounded-full h-[1.3em] bg-accent ${!isTyping ? "caret-blink" : ""}`}
        style={{
          transition: "left 100ms ease-out, top 100ms ease-out",
          boxShadow: "0 0 6px rgba(var(--c-accent),0.5)",
        }}
      />

      {/* Fade edges for scroll effect */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-10"
        style={{ height: 8, background: "linear-gradient(to bottom, rgb(var(--c-bg)), transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{ height: 16, background: "linear-gradient(to top, rgb(var(--c-bg)), transparent)" }}
      />

      <div
        ref={wordsRef}
        style={{ transition: "transform 160ms cubic-bezier(0.22,1,0.36,1)" }}
      >
        {wordStates.map((word, wi) => (
          <span
            key={wi}
            data-word
            className={`inline-block mr-[0.6em] ${wi < currentWordIdx && word.chars.some((c) => c.status === "incorrect") ? "underline decoration-danger/40 underline-offset-2 decoration-dotted" : ""}`}
          >
            {word.chars.map((c, ci) => {
              const effective: CharStatus =
                blind && c.status === "incorrect" ? "correct" : c.status;
              return (
                <span
                  key={ci}
                  data-char
                  className={STATUS_CLASS[effective]}
                  style={{ transition: "color 60ms ease" }}
                >
                  {c.char}
                </span>
              );
            })}
            {word.extra && (
              <span className="text-danger/60">{word.extra}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
