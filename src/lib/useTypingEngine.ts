"use client";

import { useCallback, useRef, useState } from "react";

export type CharStatus = "pending" | "correct" | "incorrect" | "missed";
export interface CharState {
  char: string;
  status: CharStatus;
}
export interface WordState {
  chars: CharState[];
  extra: string;
}

export interface FinishStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  timeElapsedSec: number;
}

function buildWordStates(words: string[]): WordState[] {
  return words.map((w) => ({
    chars: w.split("").map((c) => ({ char: c, status: "pending" as CharStatus })),
    extra: "",
  }));
}

/**
 * Character-by-character typing state machine.
 *
 * Indices are tracked in refs (not just state) so key handlers always read the
 * latest position even if several keydown events land before React re-renders -
 * this matters at fast typing speeds. The mirrored state values exist purely to
 * trigger re-renders for caret/highlighting.
 */
export function useTypingEngine(initialWords: string[]) {
  const [wordStates, setWordStates] = useState<WordState[]>(() => buildWordStates(initialWords));
  const [currentWordIdx, setCurrentWordIdxState] = useState(0);
  const [currentCharIdx, setCurrentCharIdxState] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const wordStatesRef = useRef<WordState[]>(wordStates);
  const wordIdxRef = useRef(0);
  const charIdxRef = useRef(0);
  const startTimeRef = useRef(0);
  const countsRef = useRef({ correct: 0, incorrect: 0, extra: 0, missed: 0, keystrokes: 0 });
  const wpmSamplesRef = useRef<number[]>([]);

  // Writes go through this instead of the setWordStates(prev => ...) form: React 18
  // Strict Mode invokes updater functions twice to detect impurity, and the old code
  // mutated refs (charIdxRef, countsRef) inside that updater - the second invocation
  // then read an already-bumped charIdxRef and silently skipped every other keystroke.
  const commitWordStates = useCallback((next: WordState[]) => {
    wordStatesRef.current = next;
    setWordStates(next);
  }, []);

  const setWordIdx = useCallback((v: number) => {
    wordIdxRef.current = v;
    setCurrentWordIdxState(v);
  }, []);
  const setCharIdx = useCallback((v: number) => {
    charIdxRef.current = v;
    setCurrentCharIdxState(v);
  }, []);

  const minutesElapsed = useCallback(() => {
    if (!startTimeRef.current) return 1 / 3600;
    return Math.max((Date.now() - startTimeRef.current) / 60000, 1 / 3600);
  }, []);

  /** Call on an interval (e.g. every second) for live WPM + consistency sampling. */
  const sampleWpm = useCallback((): number => {
    const wpm = Math.round(countsRef.current.keystrokes / 5 / minutesElapsed());
    wpmSamplesRef.current.push(wpm);
    return wpm;
  }, [minutesElapsed]);

  const appendWords = useCallback(
    (more: string[]) => {
      commitWordStates(wordStatesRef.current.concat(buildWordStates(more)));
    },
    [commitWordStates]
  );

  const typeChar = useCallback(
    (ch: string): CharStatus | "space" | null => {
      if (finished) return null;
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        setStarted(true);
      }
      countsRef.current.keystrokes++;

      const prev = wordStatesRef.current;
      const wi = wordIdxRef.current;
      const word = prev[wi];
      if (!word) return null;
      const next = prev.slice();

      if (ch === " ") {
        if (charIdxRef.current > 0) {
          const chars = word.chars.slice();
          for (let i = charIdxRef.current; i < chars.length; i++) {
            if (chars[i].status === "pending") {
              chars[i] = { ...chars[i], status: "missed" };
              countsRef.current.missed++;
            }
          }
          next[wi] = { ...word, chars };
          commitWordStates(next);
          setWordIdx(wi + 1);
          setCharIdx(0);
          return "space";
        }
        return null;
      }

      if (charIdxRef.current < word.chars.length) {
        const chars = word.chars.slice();
        const expected = chars[charIdxRef.current].char;
        const status: CharStatus = ch === expected ? "correct" : "incorrect";
        chars[charIdxRef.current] = { ...chars[charIdxRef.current], status };
        countsRef.current[status === "correct" ? "correct" : "incorrect"]++;
        next[wi] = { ...word, chars };
        commitWordStates(next);
        setCharIdx(charIdxRef.current + 1);
        return status;
      } else {
        next[wi] = { ...word, extra: word.extra + ch };
        countsRef.current.extra++;
        commitWordStates(next);
        return "incorrect";
      }
    },
    [finished, setWordIdx, setCharIdx, commitWordStates]
  );

  const backspace = useCallback(() => {
    if (finished) return;
    const prev = wordStatesRef.current;
    const wi = wordIdxRef.current;
    const word = prev[wi];
    if (!word) return;
    const next = prev.slice();

    if (word.extra.length > 0) {
      next[wi] = { ...word, extra: word.extra.slice(0, -1) };
      commitWordStates(next);
      return;
    }
    if (charIdxRef.current > 0) {
      const chars = word.chars.slice();
      chars[charIdxRef.current - 1] = { ...chars[charIdxRef.current - 1], status: "pending" };
      next[wi] = { ...word, chars };
      commitWordStates(next);
      setCharIdx(charIdxRef.current - 1);
      return;
    }
    if (wi > 0) {
      const prevWord = prev[wi - 1];
      setWordIdx(wi - 1);
      setCharIdx(prevWord.chars.length);
    }
  }, [finished, setWordIdx, setCharIdx, commitWordStates]);

  const computeFinishStats = useCallback((): FinishStats => {
    const c = countsRef.current;
    const minutes = minutesElapsed();
    const wpm = Math.max(0, Math.round(c.correct / 5 / minutes));
    const rawWpm = Math.round((c.correct + c.incorrect + c.extra) / 5 / minutes);
    const totalTyped = c.correct + c.incorrect;
    const accuracy = totalTyped > 0 ? Math.round((c.correct / totalTyped) * 100) : 100;

    const samples = wpmSamplesRef.current;
    let consistency = 100;
    if (samples.length > 1) {
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      if (mean > 0) {
        const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
        consistency = Math.max(0, Math.min(100, Math.round(100 - (Math.sqrt(variance) / mean) * 100)));
      }
    }

    return {
      wpm,
      rawWpm,
      accuracy,
      consistency,
      correct: c.correct,
      incorrect: c.incorrect,
      extra: c.extra,
      missed: c.missed,
      timeElapsedSec: startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0,
    };
  }, [minutesElapsed]);

  const finish = useCallback(() => {
    setFinished(true);
  }, []);

  const reset = useCallback(
    (words: string[]) => {
      commitWordStates(buildWordStates(words));
      setWordIdx(0);
      setCharIdx(0);
      setStarted(false);
      setFinished(false);
      startTimeRef.current = 0;
      countsRef.current = { correct: 0, incorrect: 0, extra: 0, missed: 0, keystrokes: 0 };
      wpmSamplesRef.current = [];
    },
    [setWordIdx, setCharIdx, commitWordStates]
  );

  const progressPct = wordStates.length
    ? Math.min(100, Math.round((currentWordIdx / wordStates.length) * 100))
    : 0;

  return {
    wordStates,
    currentWordIdx,
    currentCharIdx,
    started,
    finished,
    progressPct,
    typeChar,
    backspace,
    appendWords,
    finish,
    reset,
    sampleWpm,
    computeFinishStats,
  };
}
