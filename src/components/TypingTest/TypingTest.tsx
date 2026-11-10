"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTypingEngine, FinishStats } from "@/lib/useTypingEngine";
import { generateWords, randomQuoteWords, Difficulty, setActiveBank } from "@/lib/wordBank";
import { LANGUAGES, LanguageId, getLanguage } from "@/lib/languages";
import { codeFromKeyboardEvent } from "@/lib/fingerMap";
import { playKeySound, playErrorSound, playFinishSound, setSoundEnabled } from "@/lib/sound";
import { vibrateError } from "@/lib/haptics";
import { TextSize, TEXT_SIZES, TEXT_SIZE_LABEL, TEXT_SIZE_FULL_NAME, getStoredTextSize, setStoredTextSize } from "@/lib/textSize";
import { WordDisplay } from "./WordDisplay";
import { MobileInput } from "./MobileInput";
import { ResultsPanel } from "./ResultsPanel";
import { NitroRacerTrack } from "./NitroRacerTrack";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { BadgeInfo } from "@/components/ui/BadgeCard";
import { BadgeUnlock } from "@/components/ui/BadgeUnlock";

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
  const [language, setLanguage] = useState<LanguageId>("english");
  // Sound defaults on: absent from localStorage means "never chosen" (not "chose
  // off"), so only an explicit "0" should turn it off on first load.
  const [soundOn, setSoundOn] = useState(true);
  const [textSize, setTextSize] = useState<TextSize>("md");
  const [showConfig, setShowConfig] = useState(true);

  // Word source follows the selected language; English falls back to the built-in bank.
  useEffect(() => {
    setActiveBank(getLanguage(language).words);
  }, [language]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("typeflow_sound");
      const on = stored === null ? true : stored === "1";
      setSoundOn(on);
      setSoundEnabled(on);

      const savedConfig = localStorage.getItem("typeflow_show_config");
      if (savedConfig !== null) {
        setShowConfig(savedConfig === "1");
      }
    } catch {
      /* ignore */
    }
    setTextSize(getStoredTextSize());
  }, []);

  const toggleConfig = useCallback(() => {
    setShowConfig((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("typeflow_show_config", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      try {
        localStorage.setItem("typeflow_sound", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const soundOnRef = useRef(soundOn);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  const changeTextSize = useCallback((size: TextSize) => {
    setTextSize(size);
    setStoredTextSize(size);
  }, []);

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
  const [earnedBadges, setEarnedBadges] = useState<BadgeInfo[]>([]);
  const [streakDays, setStreakDays] = useState<number | null>(null);

  const [pressedCode, setPressedCode] = useState<string | null>(null);
  const [pressId, setPressId] = useState(0);

  const savedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    reset,
    appendWords,
    typeChar,
    backspace,
    finish,
    sampleWpm,
    computeFinishStats,
    getKeyStats,
    getLiveStats,
  } = engine;

  // Target characters for the race track:
  // - In time mode: benchmark target (timeAmount * 5 chars, e.g. 150 chars for 30s at 60 WPM benchmark)
  // - In words/quote/custom mode: total characters in the text
  const totalCharsCount = useMemo(() => {
    if (mode === "time") {
      return timeAmount * 5;
    }
    return words.reduce((acc, w) => acc + w.length + 1, 0);
  }, [mode, timeAmount, words]);

  // Real-time progress: ONLY advances when you type characters!
  // Uses full floating-point precision for buttery smooth animation
  const userProgress = useMemo(() => {
    if (!totalCharsCount || totalCharsCount === 0) return 0;
    let typed = 0;
    for (let i = 0; i < engine.currentWordIdx && i < engine.wordStates.length; i++) {
      typed += engine.wordStates[i].chars.length + 1;
    }
    if (engine.currentWordIdx < engine.wordStates.length) {
      typed += engine.currentCharIdx;
    }
    return Math.min(100, (typed / totalCharsCount) * 100);
  }, [totalCharsCount, engine.currentWordIdx, engine.currentCharIdx, engine.wordStates]);

  const [instantWpm, setInstantWpm] = useState(0);

  // Fast game physics loop for instantaneous speed and realistic deceleration
  useEffect(() => {
    if (!engine.started || engine.finished) {
      setInstantWpm(0);
      return;
    }
    const loop = setInterval(() => {
      const spd = engine.getInstantWpm();
      setInstantWpm(spd);
    }, 50);
    return () => clearInterval(loop);
  }, [engine.started, engine.finished, engine.getInstantWpm]);

  const restart = useCallback(() => {
    const w = buildWords(mode, wordsAmount, numbers, punctuation, difficulty, customText);
    setWords(w);
    reset(w);
    setTimeLeft(timeAmount);
    setLiveWpm(0);
    setFinishStats(null);
    setWpmSamples([]);
    setEarnedBadges([]);
    savedRef.current = false;
    if (tickRef.current) clearInterval(tickRef.current);
  }, [mode, timeAmount, wordsAmount, numbers, punctuation, difficulty, customText, reset]);

  // rebuild the word list whenever mode/config changes
  useEffect(() => {
    restart();
    // restart's own deps already cover mode/timeAmount/wordsAmount/numbers/punctuation/difficulty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeAmount, wordsAmount, numbers, punctuation, difficulty, customText, language]);

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
        .post<{ earnedBadges?: BadgeInfo[]; streakDays?: number }>("/api/results", {
          mode,
          amount: mode === "time" ? timeAmount : wordsAmount,
          ...stats,
          keyStats: getKeyStats(),
        })
        .then((d) => {
          if (d.earnedBadges?.length) setEarnedBadges(d.earnedBadges);
          if (typeof d.streakDays === "number") setStreakDays(d.streakDays);
        })
        .catch(() => {
          /* non-fatal: this result just won't sync this time */
        });
    }
  }, [engine.finished, computeFinishStats, user, mode, timeAmount, wordsAmount, getKeyStats]);

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
        if (result === "incorrect") vibrateError(); // independent of the sound toggle
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
          {showConfig ? (
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
              language={language}
              setLanguage={setLanguage}
              soundOn={soundOn}
              toggleSound={toggleSound}
              textSize={textSize}
              changeTextSize={changeTextSize}
              onToggleHide={toggleConfig}
            />
          ) : (
            <div className="w-full max-w-5xl flex items-center justify-center mb-3">
              <button
                onClick={toggleConfig}
                className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-panel/70 hover:bg-panel border border-border/70 hover:border-border text-xs font-mono text-dim hover:text-text transition-all duration-150 shadow-xs"
                title="Click to show filter options"
              >
                <span>⚙️</span>
                <span className="capitalize font-medium text-text">{mode}</span>
                {mode === "time" ? (
                  <span className="text-accent font-semibold">{timeAmount}s</span>
                ) : mode === "words" ? (
                  <span className="text-accent font-semibold">{wordsAmount}w</span>
                ) : null}
                <span className="text-dim/40">•</span>
                <span className="capitalize text-zinc-400">{difficulty}</span>
                <span className="text-[10px] text-accent/80 group-hover:text-accent font-semibold ml-1">
                  ▼ Show Options
                </span>
              </button>
            </div>
          )}

          {mode === "custom" && (
            <div className="w-full max-w-5xl mb-4">
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

          {/* Nitro Type Racing Speedway */}
          <NitroRacerTrack
            progress={engine.finished ? 100 : userProgress}
            wpm={engine.finished ? liveWpm : instantWpm}
            accuracy={getLiveStats().accuracy}
            isStarted={engine.started}
            isFinished={engine.finished}
            mode={mode}
            difficulty={difficulty}
            timeLeft={timeLeft}
            totalTime={timeAmount}
            currentWordIdx={engine.currentWordIdx}
            totalWords={words.length}
          />

          {/* Typing Arena Container with pure contrast */}
          <div className="w-full max-w-5xl px-6 py-8 rounded-xl bg-panel/40 border border-border/80 shadow-md backdrop-blur-xs transition-colors">
            <WordDisplay
              wordStates={engine.wordStates}
              currentWordIdx={engine.currentWordIdx}
              currentCharIdx={engine.currentCharIdx}
              blind={blind}
              size={textSize}
            />
          </div>

          <MobileInput
            onChar={(ch) => {
              const r = typeChar(ch);
              if (r === "incorrect") vibrateError(); // independent of the sound toggle
              if (soundOnRef.current) {
                if (r === "incorrect") playErrorSound();
                else if (r === "correct" || r === "space") playKeySound();
              }
            }}
            onBackspace={backspace}
            disabled={engine.finished}
          />

          <div className="mt-6 flex items-center gap-3">
            <Button variant="secondary" onClick={restart} className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Restart (Tab)</span>
            </Button>
          </div>

        </>
      ) : (
        <>
          <ResultsPanel stats={finishStats} wpmSamples={wpmSamples} onRestart={restart} />
          <BadgeUnlock badges={earnedBadges} streakDays={streakDays} />
        </>
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
  language: LanguageId;
  setLanguage: (l: LanguageId) => void;
  soundOn: boolean;
  toggleSound: () => void;
  textSize: TextSize;
  changeTextSize: (s: TextSize) => void;
  onToggleHide?: () => void;
}

function ConfigBar(props: ConfigBarProps) {
  const {
    mode, setMode, timeAmount, setTimeAmount, wordsAmount, setWordsAmount,
    numbers, setNumbers, punctuation, setPunctuation, blind, setBlind,
    difficulty, setDifficulty, language, setLanguage,
    soundOn, toggleSound, textSize, changeTextSize,
    onToggleHide,
  } = props;

  const tab = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
      active 
        ? "text-accent bg-accent/10" 
        : "text-dim hover:text-text hover:bg-panel2"
    }`;

  return (
    <div className="flex flex-col items-center gap-2.5 mb-8">
      {/* Row 1 — what to type: mode, amount, language. These three always change
          together (amount only makes sense for the active mode), so they read as
          one continuous decision rather than needing their own row each. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex gap-1 bg-panel/60 rounded-lg p-1">
          {(["time", "words", "quote", "zen", "custom"] as Mode[]).map((m) => (
            <button key={m} className={tab(mode === m)} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </div>

        {mode === "time" && (
          <div className="flex gap-1 bg-panel/60 rounded-lg p-1">
            {TIME_OPTIONS.map((v) => (
              <button key={v} className={tab(timeAmount === v)} onClick={() => setTimeAmount(v)}>
                {v}
              </button>
            ))}
          </div>
        )}
        {mode === "words" && (
          <div className="flex gap-1 bg-panel/60 rounded-lg p-1">
            {WORD_OPTIONS.map((v) => (
              <button key={v} className={tab(wordsAmount === v)} onClick={() => setWordsAmount(v)}>
                {v}
              </button>
            ))}
          </div>
        )}

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageId)}
          className="px-2.5 py-1.5 text-xs font-mono bg-panel/60 text-dim border-2 border-transparent rounded-lg focus:outline-none focus:border-accent"
          title="Language"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Row 2 — how to practice: difficulty, content modifiers, display prefs.
          Grouped into separate pill containers with real gaps between them
          instead of one dense strip, so each cluster reads as its own choice. */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex gap-1 bg-panel/60 rounded-lg p-1">
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

        <div className="flex gap-1 bg-panel/60 rounded-lg p-1">
          <button className={tab(punctuation)} onClick={() => setPunctuation(!punctuation)}>
            @ punctuation
          </button>
          <button className={tab(numbers)} onClick={() => setNumbers(!numbers)}>
            # numbers
          </button>
        </div>

        <div className="flex gap-1 bg-panel/60 rounded-lg p-1">
          <button className={tab(blind)} onClick={() => setBlind(!blind)}>
            blind
          </button>
          <button className={tab(soundOn)} onClick={toggleSound} title="Keystroke sound">
            {soundOn ? "🔊" : "🔇"} sound
          </button>
        </div>

        <div className="flex gap-1 bg-panel/60 rounded-lg p-1">
          {TEXT_SIZES.map((s) => (
            <button
              key={s}
              className={tab(textSize === s)}
              onClick={() => changeTextSize(s)}
              title={`Text size: ${TEXT_SIZE_FULL_NAME[s]}`}
            >
              {TEXT_SIZE_LABEL[s]}
            </button>
          ))}
        </div>

        {onToggleHide && (
          <div className="flex gap-1 bg-panel/60 rounded-lg p-1">
            <button
              onClick={onToggleHide}
              className="px-2.5 py-1.5 text-xs font-mono text-dim hover:text-text hover:bg-panel2 rounded-md transition-colors flex items-center gap-1.5"
              title="Hide filter options for more vertical space"
            >
              <span>▲</span>
              <span>Hide</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
