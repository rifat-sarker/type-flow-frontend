"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTypingEngine, FinishStats } from "@/lib/useTypingEngine";
import { generateWords, randomQuoteWords, Difficulty } from "@/lib/wordBank";
import { codeFromKeyboardEvent } from "@/lib/fingerMap";
import { playKeySound, playErrorSound, playFinishSound, setSoundType, SoundType } from "@/lib/sound";
import { WordDisplay } from "./WordDisplay";
import { KeyboardStage } from "./KeyboardStage";
import { ResultsPanel } from "./ResultsPanel";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type Mode = "time" | "words" | "quote" | "zen" | "custom";

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function buildWords(
  mode: Mode,
  wordsAmount: number,
  numbers: boolean,
  punctuation: boolean,
  difficulty: Difficulty,
  customText: string
): string[] {
  if (mode === "custom") return customText.trim().split(/\s+/).filter(Boolean);
  if (mode === "quote") return randomQuoteWords();
  if (mode === "words") return generateWords(wordsAmount, numbers, punctuation, difficulty);
  if (mode === "zen") return generateWords(40, numbers, punctuation, difficulty);
  return generateWords(60, numbers, punctuation, difficulty); // time mode: generous starting buffer
}

export function TypingTest() {
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>("time");
  const [timeAmount, setTimeAmount] = useState(30);
  const [wordsAmount, setWordsAmount] = useState(25);
  const [numbers, setNumbers] = useState(false);
  const [punctuation, setPunctuation] = useState(false);
  const [blind, setBlind] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [customText, setCustomText] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [soundType, setSoundTypeState] = useState<SoundType>("mechanical");

  useEffect(() => {
    try {
      setSoundOn(localStorage.getItem("typeflow_sound") === "1");
      const savedType = (localStorage.getItem("typeflow_sound_type") as SoundType) ?? "mechanical";
      setSoundTypeState(savedType);
      setSoundType(savedType);
    } catch {
      /* ignore */
    }
  }, []);
  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("typeflow_sound", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const cycleSoundType = useCallback(() => {
    const types: SoundType[] = ["mechanical", "soft", "off"];
    setSoundTypeState((prev) => {
      // When muted, the first click should switch the current type on rather than
      // skipping past it (otherwise "off" -> click -> "soft" hides mechanical).
      const next = soundOnRef.current
        ? types[(types.indexOf(prev) + 1) % types.length]
        : prev === "off"
        ? "mechanical"
        : prev;
      setSoundType(next);
      // auto-enable sound when a type is selected
      if (next !== "off") setSoundOn(true);
      else setSoundOn(false);
      try {
        localStorage.setItem("typeflow_sound_type", next);
        localStorage.setItem("typeflow_sound", next !== "off" ? "1" : "0");
      } catch { /* ignore */ }
      return next;
    });
  }, []);
  const soundOnRef = useRef(soundOn);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  // Empty on first render (server and client match) - the mount effect below fills
  // this in with randomly generated words client-side only, avoiding a hydration
  // mismatch (Math.random() would otherwise produce different words on the server
  // render vs. the client's first render).
  const [words, setWords] = useState<string[]>([]);
  const engine = useTypingEngine(words);

  const [timeLeft, setTimeLeft] = useState(timeAmount);
  const [liveWpm, setLiveWpm] = useState(0);
  const [finishStats, setFinishStats] = useState<FinishStats | null>(null);
  const [wpmSamples, setWpmSamples] = useState<number[]>([]);

  const [pressedCode, setPressedCode] = useState<string | null>(null);
  const [pressId, setPressId] = useState(0);

  const savedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { reset, appendWords, typeChar, backspace, finish, sampleWpm, computeFinishStats } = engine;

  const restart = useCallback(() => {
    const w = buildWords(mode, wordsAmount, numbers, punctuation, difficulty, customText);
    setWords(w);
    reset(w);
    setTimeLeft(timeAmount);
    setLiveWpm(0);
    setFinishStats(null);
    setWpmSamples([]);
    savedRef.current = false;
    if (tickRef.current) clearInterval(tickRef.current);
  }, [mode, timeAmount, wordsAmount, numbers, punctuation, difficulty, customText, reset]);

  // rebuild the word list whenever mode/config changes
  useEffect(() => {
    restart();
    // restart's own deps already cover mode/timeAmount/wordsAmount/numbers/punctuation/difficulty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeAmount, wordsAmount, numbers, punctuation, difficulty, customText]);

  const finishTest = useCallback(() => finish(), [finish]);

  // keep the word buffer ahead of the typist in time mode
  useEffect(() => {
    if (mode !== "time") return;
    if (words.length - engine.currentWordIdx < 15) {
      const more = generateWords(30, numbers, punctuation, difficulty);
      appendWords(more);
      setWords((prev) => prev.concat(more));
    }
  }, [mode, words.length, engine.currentWordIdx, numbers, punctuation, difficulty, appendWords]);

  // per-second sampling + countdown while a test is in progress
  useEffect(() => {
    if (!engine.started || engine.finished) return;
    tickRef.current = setInterval(() => {
      const wpm = sampleWpm();
      setLiveWpm(wpm);
      setWpmSamples((prev) => [...prev, wpm]);
      if (mode === "time") {
        setTimeLeft((t) => Math.max(0, t - 1));
      }
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [engine.started, engine.finished, mode, sampleWpm]);

  // time mode ends when the clock runs out
  useEffect(() => {
    if (mode !== "time" || engine.finished) return;
    if (engine.started && timeLeft <= 0) finishTest();
  }, [timeLeft, mode, engine.started, engine.finished, finishTest]);

  // words/quote mode ends right after the last character of the last word
  useEffect(() => {
    if (mode === "zen" || mode === "time" || engine.finished || !engine.started) return;
    const total = words.length;
    if (total === 0) return;
    const onLastWord = engine.currentWordIdx >= total - 1;
    const lastWordLen = words[total - 1]?.length ?? 0;
    if (onLastWord && engine.currentCharIdx >= lastWordLen) finishTest();
  }, [engine.currentWordIdx, engine.currentCharIdx, engine.finished, engine.started, mode, words, finishTest]);

  // compute + persist stats exactly once when the test finishes
  useEffect(() => {
    if (!engine.finished || savedRef.current) return;
    savedRef.current = true;
    if (tickRef.current) clearInterval(tickRef.current);
    const stats = computeFinishStats();
    setFinishStats(stats);
    if (soundOnRef.current) playFinishSound();

    if (user) {
      api
        .post("/api/results", { mode, amount: mode === "time" ? timeAmount : wordsAmount, ...stats })
        .catch(() => {
          /* non-fatal: this result just won't sync this time */
        });
    }
  }, [engine.finished, computeFinishStats, user, mode, timeAmount, wordsAmount]);

  // global keyboard input
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't hijack keystrokes meant for an actual form field (none on this page
      // today, but this keeps the global listener from ever fighting one later).
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      const code = codeFromKeyboardEvent(e);
      setPressedCode(code);
      setPressId((id) => id + 1);

      if (e.key === "Escape" || e.key === "Tab") {
        e.preventDefault();
        restart();
        return;
      }
      if (e.key === "Enter") {
        // Always swallow Enter here - words never contain a literal newline, and if we
        // don't preventDefault, the browser forwards it as a native click to whichever
        // button last had focus (e.g. "Restart"), silently resetting the test mid-type.
        e.preventDefault();
        if (mode === "zen" && engine.started && !engine.finished) finishTest();
        return;
      }
      if (engine.finished) return;

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const result = typeChar(e.key);
        if (soundOnRef.current) {
          if (result === "incorrect") playErrorSound();
          else if (result === "correct" || result === "space") playKeySound();
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
      }
    }
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, engine.started, engine.finished, restart, finishTest, typeChar, backspace]);

  return (
    <div className="flex flex-col items-center">
      {!finishStats ? (
        <>
          <ConfigBar
            mode={mode}
            setMode={setMode}
            timeAmount={timeAmount}
            setTimeAmount={setTimeAmount}
            wordsAmount={wordsAmount}
            setWordsAmount={setWordsAmount}
            numbers={numbers}
            setNumbers={setNumbers}
            punctuation={punctuation}
            setPunctuation={setPunctuation}
            blind={blind}
            setBlind={setBlind}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            showKeyboard={showKeyboard}
            setShowKeyboard={setShowKeyboard}
            soundOn={soundOn}
            toggleSound={toggleSound}
            soundType={soundType}
            cycleSoundType={cycleSoundType}
          />

          {mode === "custom" && (
            <div className="w-full max-w-3xl mb-4">
              <label className="block text-xs font-mono uppercase text-dim mb-1.5">
                Your own text
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                placeholder="Paste or type anything you want to practise, then click away and start typing."
                className="w-full bg-panel2 border-2 border-border text-text placeholder:text-dim px-3 py-2 font-mono text-sm rounded-none focus:outline-none focus:border-accent resize-y"
              />
              {!customText.trim() && (
                <p className="text-dim text-xs font-mono mt-1.5">
                  Add some text above to start.
                </p>
              )}
            </div>
          )}

          <div className="h-8 mb-2 font-mono text-accent text-xl font-semibold">
            {mode === "time" ? timeLeft : mode === "zen" ? `${liveWpm} wpm` : `${liveWpm} wpm`}
          </div>

          <WordDisplay
            wordStates={engine.wordStates}
            currentWordIdx={engine.currentWordIdx}
            currentCharIdx={engine.currentCharIdx}
            blind={blind}
          />

          <div className="mt-6">
            <Button variant="secondary" onClick={restart}>
              Restart (tab)
            </Button>
          </div>

          {/* Keyboard is temporarily hidden as requested */}
        </>
      ) : (
        <ResultsPanel stats={finishStats} wpmSamples={wpmSamples} onRestart={restart} />
      )}
    </div>
  );
}

interface ConfigBarProps {
  mode: Mode;
  setMode: (m: Mode) => void;
  timeAmount: number;
  setTimeAmount: (n: number) => void;
  wordsAmount: number;
  setWordsAmount: (n: number) => void;
  numbers: boolean;
  setNumbers: (b: boolean) => void;
  punctuation: boolean;
  setPunctuation: (b: boolean) => void;
  blind: boolean;
  setBlind: (b: boolean) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  showKeyboard: boolean;
  setShowKeyboard: (b: boolean) => void;
  soundOn: boolean;
  toggleSound: () => void;
  soundType: SoundType;
  cycleSoundType: () => void;
}

function ConfigBar(props: ConfigBarProps) {
  const {
    mode, setMode, timeAmount, setTimeAmount, wordsAmount, setWordsAmount,
    numbers, setNumbers, punctuation, setPunctuation, blind, setBlind,
    difficulty, setDifficulty,
    showKeyboard, setShowKeyboard, soundOn, toggleSound,
    soundType, cycleSoundType,
  } = props;

  const tab = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
      active 
        ? "text-accent bg-accent/10" 
        : "text-dim hover:text-text hover:bg-panel2"
    }`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-8 bg-transparent p-2">
      <div className="flex gap-1">
        {(["time", "words", "quote", "zen", "custom"] as Mode[]).map((m) => (
          <button key={m} className={tab(mode === m)} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </div>
      <div className="w-1 h-1 rounded-full bg-border mx-2" />
      {mode === "time" && (
        <div className="flex gap-1">
          {TIME_OPTIONS.map((v) => (
            <button key={v} className={tab(timeAmount === v)} onClick={() => setTimeAmount(v)}>
              {v}
            </button>
          ))}
        </div>
      )}
      {mode === "words" && (
        <div className="flex gap-1">
          {WORD_OPTIONS.map((v) => (
            <button key={v} className={tab(wordsAmount === v)} onClick={() => setWordsAmount(v)}>
              {v}
            </button>
          ))}
        </div>
      )}
      <div className="w-1 h-1 rounded-full bg-border mx-2" />
      <div className="flex gap-1">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            // normal-case overrides the shared tab styling's uppercase, so these
            // read "Easy / Medium / Hard" rather than shouting.
            className={`${tab(difficulty === d)} normal-case`}
            onClick={() => setDifficulty(d)}
            title={
              d === "easy"
                ? "Short, common words"
                : d === "medium"
                ? "Everyday vocabulary"
                : "Long words + capitals & punctuation"
            }
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>
      <div className="w-1 h-1 rounded-full bg-border mx-2" />
      <div className="flex gap-1">
        <button className={tab(punctuation)} onClick={() => setPunctuation(!punctuation)}>
          @ punctuation
        </button>
        <button className={tab(numbers)} onClick={() => setNumbers(!numbers)}>
          # numbers
        </button>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex gap-1">
        <button className={tab(showKeyboard)} onClick={() => setShowKeyboard(!showKeyboard)}>
          keyboard
        </button>
        <button className={tab(blind)} onClick={() => setBlind(!blind)}>
          blind
        </button>
        <button
          className={tab(soundOn)}
          onClick={cycleSoundType}
          title="Click to cycle: mechanical → soft → off"
        >
          {/* Label has to follow soundOn, not just soundType - otherwise it reads
              "mech" while sound is actually muted. */}
          {soundOn ? "🔊" : "🔇"}{" "}
          {!soundOn ? "off" : soundType === "mechanical" ? "mech" : "soft"}
        </button>
      </div>
    </div>
  );
}
