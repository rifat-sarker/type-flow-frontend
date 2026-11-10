"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export interface NitroRacerProps {
  progress: number; // 0 to 100
  wpm: number;
  accuracy: number;
  isStarted: boolean;
  isFinished: boolean;
  mode: "time" | "words" | "quote" | "zen" | "custom";
  difficulty?: "easy" | "medium" | "hard";
  timeLeft?: number;
  totalTime?: number;
  currentWordIdx?: number;
  totalWords?: number;
}

interface BotRacer {
  id: string;
  name: string;
  targetWpm: number;
  color: string;
  trim: string;
  lane: number;
}

const CAR_PAINTS = [
  { id: "amber", name: "Amber Flame", body: "#f97316", trim: "#fbbf24", glow: "rgba(249, 115, 22, 0.5)" },
  { id: "cyan", name: "Cyber Cyan", body: "#06b6d4", trim: "#67e8f9", glow: "rgba(6, 182, 212, 0.5)" },
  { id: "ruby", name: "Ruby Red", body: "#ef4444", trim: "#fca5a5", glow: "rgba(239, 68, 68, 0.5)" },
  { id: "emerald", name: "Neon Emerald", body: "#10b981", trim: "#6ee7b7", glow: "rgba(16, 185, 129, 0.5)" },
  { id: "ghost", name: "Ghost White", body: "#f4f4f5", trim: "#a1a1aa", glow: "rgba(244, 244, 245, 0.4)" },
  { id: "violet", name: "Hyper Violet", body: "#8b5cf6", trim: "#d8b4fe", glow: "rgba(139, 92, 246, 0.5)" },
];

const BOTS_BY_DIFFICULTY: Record<"easy" | "medium" | "hard", BotRacer[]> = {
  easy: [
    { id: "bot1", name: "Silver GT", targetWpm: 76, color: "#94a3b8", trim: "#cbd5e1", lane: 0 },
    { id: "bot2", name: "Thunder V8", targetWpm: 86, color: "#f59e0b", trim: "#fde68a", lane: 2 },
    { id: "bot3", name: "Shadow Viper", targetWpm: 98, color: "#a855f7", trim: "#e9d5ff", lane: 3 },
  ],
  medium: [
    { id: "bot1", name: "Apex Phantom", targetWpm: 84, color: "#94a3b8", trim: "#cbd5e1", lane: 0 },
    { id: "bot2", name: "Turbo Cyclone", targetWpm: 95, color: "#f59e0b", trim: "#fde68a", lane: 2 },
    { id: "bot3", name: "Dark Nebula", targetWpm: 110, color: "#a855f7", trim: "#e9d5ff", lane: 3 },
  ],
  hard: [
    { id: "bot1", name: "Hyper Mach 1", targetWpm: 92, color: "#94a3b8", trim: "#cbd5e1", lane: 0 },
    { id: "bot2", name: "Velocity X", targetWpm: 106, color: "#f59e0b", trim: "#fde68a", lane: 2 },
    { id: "bot3", name: "Ghost Demon", targetWpm: 124, color: "#a855f7", trim: "#e9d5ff", lane: 3 },
  ],
};

export function NitroRacerTrack({
  progress,
  wpm,
  accuracy,
  isStarted,
  isFinished,
  mode,
  difficulty = "easy",
  timeLeft,
  totalTime,
  currentWordIdx,
  totalWords,
}: NitroRacerProps) {
  const bots = useMemo(() => {
    return BOTS_BY_DIFFICULTY[difficulty] || BOTS_BY_DIFFICULTY.easy;
  }, [difficulty]);

  const [carPaintIdx, setCarPaintIdx] = useState(0);
  const [botPositions, setBotPositions] = useState<number[]>([0, 0, 0]);
  const [showPaintMenu, setShowPaintMenu] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load paint preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("typeflow_nitro_car_paint");
      if (saved) {
        const idx = CAR_PAINTS.findIndex((p) => p.id === saved);
        if (idx !== -1) setCarPaintIdx(idx);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectPaint = (idx: number) => {
    setCarPaintIdx(idx);
    try {
      localStorage.setItem("typeflow_nitro_car_paint", CAR_PAINTS[idx].id);
    } catch {
      /* ignore */
    }
  };

  // Track elapsed time during race to drive opponent AI cars
  useEffect(() => {
    if (!isStarted || isFinished) {
      if (!isStarted) {
        setElapsedSeconds(0);
        setBotPositions([0, 0, 0]);
      }
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((sec) => sec + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [isStarted, isFinished]);

  // Update AI bot positions smoothly
  useEffect(() => {
    if (!isStarted) {
      setBotPositions([0, 0, 0]);
      return;
    }

    // Target distance: in time mode (e.g. 30s), target is 30 words (matches user's target)
    // in words mode, target is exact words count
    const targetWords = mode === "time" && totalTime ? totalTime : (totalWords || 30);

    const newPositions = bots.map((bot) => {
      // Calculate bot progress: Bot moves steadily at its target WPM
      // A 60 WPM bot types 1 word/sec
      const wordsTyped = (bot.targetWpm / 60) * elapsedSeconds;
      const baseProgress = (wordsTyped / targetWords) * 100;
      // Cap at 98% until race finish
      return Math.min(isFinished ? 100 : 96, Math.max(0, baseProgress));
    });

    setBotPositions(newPositions);
  }, [elapsedSeconds, isStarted, isFinished, mode, totalTime, totalWords]);

  const userPaint = CAR_PAINTS[carPaintIdx] || CAR_PAINTS[0];

  // User position clamped on track (2% to 94%)
  const userCarLeft = Math.min(94, Math.max(2, progress));

  // Determine current place standing (1st, 2nd, 3rd, 4th)
  const standing = useMemo(() => {
    let place = 1;
    botPositions.forEach((botPos) => {
      if (botPos > progress) place++;
    });
    return place;
  }, [progress, botPositions]);

  const standingLabel = useMemo(() => {
    if (standing === 1) return { text: "1ST", icon: "🥇", color: "text-amber-400" };
    if (standing === 2) return { text: "2ND", icon: "🥈", color: "text-slate-300" };
    if (standing === 3) return { text: "3RD", icon: "🥉", color: "text-amber-600" };
    return { text: "4TH", icon: "🏎️", color: "text-zinc-400" };
  }, [standing]);

  // Continuous smooth road scroll using requestAnimationFrame
  // Eliminates CSS keyframe reset jumping when WPM updates
  const offsetRef = useRef(0);
  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Road lines keep running continuously so the highway feels alive all the time
      // Base cruising speed: 45 px/sec when racing (20 px/sec when waiting)
      // When typing, speed surges dynamically on top of cruising speed!
      const baseSpeed = isStarted ? 45 : 20;
      const boostSpeed = (wpmRef.current / 60) * 130;
      const pxPerSec = baseSpeed + boostSpeed;

      offsetRef.current = (offsetRef.current + pxPerSec * dt) % 40;

      const dividers = document.querySelectorAll<HTMLElement>(".road-lane-divider");
      dividers.forEach((el) => {
        el.style.backgroundPosition = `-${offsetRef.current}px 0`;
      });

      const rumbles = document.querySelectorAll<HTMLElement>(".road-rumble-strip");
      rumbles.forEach((el) => {
        el.style.backgroundPosition = `-${offsetRef.current % 24}px 0`;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isStarted]);

  // Nitro status
  const isNitro = wpm >= 70;

  return (
    <div className="w-full max-w-5xl mx-auto mb-6 select-none font-sans">
      {/* Top Bar with HUD & Paint Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-t-xl bg-[#14151a] border-t border-x border-[#282a33] shadow-md">
        {/* Left Side: Game HUD like Nitro Type (Large Speedometer & Stats) */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* WPM Speedometer */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-white tracking-tight drop-shadow-sm tabular-nums">
              {wpm}
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider">
              WPM
            </span>
          </div>

          {/* Accuracy */}
          <div className="flex items-baseline gap-1.5 border-l border-zinc-700/80 pl-4">
            <span className="text-lg sm:text-xl font-mono font-bold text-zinc-100 tabular-nums">
              {accuracy}%
            </span>
            <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              ACC
            </span>
          </div>

          {/* Standing / Place Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1e2029] border border-zinc-700/60 shadow-inner">
            <span className="text-sm">{standingLabel.icon}</span>
            <span className={`text-xs font-mono font-extrabold ${standingLabel.color}`}>
              {standingLabel.text}
            </span>
          </div>

          {/* Nitro Gauge */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  isNitro
                    ? "bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 animate-pulse shadow-sm shadow-cyan-400"
                    : "bg-gradient-to-r from-emerald-500 to-amber-500"
                }`}
                style={{ width: `${Math.min(100, (wpm / 100) * 100)}%` }}
              />
            </div>
            <span
              className={`text-[10px] font-mono font-extrabold tracking-wider ${
                isNitro ? "text-cyan-400 animate-pulse" : "text-zinc-500"
              }`}
            >
              {isNitro ? "⚡ NITRO" : "BOOST"}
            </span>
          </div>
        </div>

        {/* Right Side: Progress Counter & Paint Chooser */}
        <div className="flex items-center gap-3">
          {mode === "time" && timeLeft !== undefined && totalTime !== undefined ? (
            <div className="text-xs font-mono text-zinc-400">
              TIME: <span className="text-white font-bold">{timeLeft}s</span> / {totalTime}s
            </div>
          ) : currentWordIdx !== undefined && totalWords !== undefined ? (
            <div className="text-xs font-mono text-zinc-400">
              WORDS: <span className="text-white font-bold">{currentWordIdx}</span> / {totalWords}
            </div>
          ) : (
            <div className="text-xs font-mono text-zinc-400">
              <span className="text-amber-400 font-bold">{Math.round(progress)}%</span> Complete
            </div>
          )}

          <button
            onClick={() => setShowPaintMenu(!showPaintMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-zinc-400 hover:text-white bg-[#1e2029] hover:bg-[#282a35] border border-zinc-700/80 transition-colors"
            title="Choose Car Color"
          >
            <span>🎨</span>
            <span className="hidden sm:inline">Paint</span>
          </button>
        </div>
      </div>

      {/* Paint Menu Drawer */}
      {showPaintMenu && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1b22] border-x border-[#282a33] text-xs">
          <span className="text-zinc-400 font-mono text-[11px]">Select Paint:</span>
          <div className="flex items-center gap-2">
            {CAR_PAINTS.map((paint, i) => (
              <button
                key={paint.id}
                onClick={() => selectPaint(i)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  carPaintIdx === i
                    ? "scale-125 border-white shadow-md shadow-white/20"
                    : "border-transparent opacity-75 hover:opacity-100"
                }`}
                style={{ backgroundColor: paint.body }}
                title={paint.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4-Lane Top-Down Asphalt Speedway (Nitro Type Style) */}
      <div className="relative rounded-b-xl overflow-hidden border border-[#282a33] bg-[#101115] shadow-2xl">
        {/* Top Grass Verge */}
        <div className="h-2 bg-[#1b3320] border-b border-[#2e5234]" />

        {/* Top Rumble Strip (Checkered Red/White Curb) */}
        <div
          className="road-rumble-strip h-2 bg-repeat-x pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #dc2626 0px, #dc2626 12px, #f4f4f5 12px, #f4f4f5 24px)",
            backgroundSize: "24px 8px",
            boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.6)",
          }}
        />

        {/* The 4 Lanes Area */}
        <div className="relative h-44 sm:h-48 bg-[#16171d] flex flex-col justify-around py-1">
          {/* Lane 0: Bot 1 */}
          <LaneRow
            car={<TopDownCar bodyColor={bots[0].color} trimColor={bots[0].trim} />}
            carLeftPercent={Math.min(94, Math.max(2, botPositions[0]))}
            racerName={bots[0].name}
            isUser={false}
            wpm={bots[0].targetWpm}
          />

          {/* Lane Divider 1 */}
          <LaneDivider />

          {/* Lane 1: USER (Your Car!) */}
          <LaneRow
            car={
              <TopDownCar
                bodyColor={userPaint.body}
                trimColor={userPaint.trim}
                glowColor={userPaint.glow}
                isUser
                isNitro={isNitro}
                isStarted={isStarted}
                wpm={wpm}
              />
            }
            carLeftPercent={userCarLeft}
            racerName="YOU"
            isUser
            isFinished={isFinished}
            wpm={wpm}
          />

          {/* Lane Divider 2 */}
          <LaneDivider />

          {/* Lane 2: Bot 2 */}
          <LaneRow
            car={<TopDownCar bodyColor={bots[1].color} trimColor={bots[1].trim} />}
            carLeftPercent={Math.min(94, Math.max(2, botPositions[1]))}
            racerName={bots[1].name}
            isUser={false}
            wpm={bots[1].targetWpm}
          />

          {/* Lane Divider 3 */}
          <LaneDivider />

          {/* Lane 3: Bot 3 */}
          <LaneRow
            car={<TopDownCar bodyColor={bots[2].color} trimColor={bots[2].trim} />}
            carLeftPercent={Math.min(94, Math.max(2, botPositions[2]))}
            racerName={bots[2].name}
            isUser={false}
            wpm={bots[2].targetWpm}
          />

          {/* Starting Truss Bridge Gantry Structure on Left */}
          <div className="absolute left-6 top-0 bottom-0 w-3 z-30 pointer-events-none flex flex-col justify-between">
            <div
              className="w-full h-full border-r-2 border-white/40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #475569 0px, #475569 4px, #1e293b 4px, #1e293b 8px)",
                boxShadow: "2px 0 8px rgba(0,0,0,0.8)",
              }}
            />
          </div>

          {/* Finish Line Gantry & Checkered Strip on Right */}
          <div
            className="absolute right-6 top-0 bottom-0 w-6 z-30 pointer-events-none border-l-2 border-white/60"
            style={{
              backgroundImage:
                "repeating-conic-gradient(#ffffff 0% 25%, #000000 0% 50%) 50% / 12px 12px",
              boxShadow: "0 0 12px rgba(255,255,255,0.4)",
            }}
          >
            <div className="absolute -top-3 -right-2 text-sm drop-shadow">🏁</div>
          </div>
        </div>

        {/* Bottom Rumble Strip */}
        <div
          className="road-rumble-strip h-2 bg-repeat-x pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #dc2626 0px, #dc2626 12px, #f4f4f5 12px, #f4f4f5 24px)",
            backgroundSize: "24px 8px",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
          }}
        />

        {/* Bottom Grass Verge */}
        <div className="h-2 bg-[#1b3320] border-t border-[#2e5234]" />
      </div>
    </div>
  );
}

// Single Lane Row
function LaneRow({
  car,
  carLeftPercent,
  racerName,
  isUser,
  isFinished,
  wpm,
}: {
  car: React.ReactNode;
  carLeftPercent: number;
  racerName: string;
  isUser: boolean;
  isFinished?: boolean;
  wpm: number;
}) {
  return (
    <div className="relative h-9 sm:h-10 w-full flex items-center">
      {/* Car Container */}
      <div
        className="absolute top-1/2 -translate-y-1/2 z-20 flex items-center"
        style={{
          left: `${carLeftPercent}%`,
          transition: isUser
            ? "left 180ms cubic-bezier(0.16, 1, 0.3, 1)"
            : "left 260ms cubic-bezier(0.25, 0.9, 0.4, 1)",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Name Tag above car */}
        <div
          className={`absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-tight whitespace-nowrap shadow pointer-events-none ${
            isUser
              ? isFinished
                ? "bg-emerald-400 text-black border border-emerald-300 font-extrabold scale-110 animate-bounce"
                : "bg-amber-400 text-black border border-amber-300 font-extrabold scale-105"
              : "bg-zinc-800/90 text-zinc-300 border border-zinc-700 text-[8px]"
          }`}
        >
          {isUser && isFinished ? `🏁 FINISHED! (${wpm} WPM)` : `${racerName} ${isUser ? `(${wpm})` : ""}`}
        </div>

        {/* Car Visual */}
        {car}
      </div>
    </div>
  );
}

// Dashed Lane Divider with Continuous requestAnimationFrame Scroll
function LaneDivider() {
  return (
    <div
      className="road-lane-divider h-[2px] w-full pointer-events-none opacity-60"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0px, rgba(255,255,255,0.85) 20px, transparent 20px, transparent 40px)",
        backgroundSize: "40px 2px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

// Top-Down Bird's-Eye View Vector Sports Car (Nitro Type style)
function TopDownCar({
  bodyColor,
  trimColor,
  glowColor,
  isUser = false,
  isNitro = false,
  isStarted = false,
  wpm = 0,
}: {
  bodyColor: string;
  trimColor: string;
  glowColor?: string;
  isUser?: boolean;
  isNitro?: boolean;
  isStarted?: boolean;
  wpm?: number;
}) {
  return (
    <div className="relative flex items-center">
      {/* Nitro Flame from Exhaust in Rear (Shooting to the Left) */}
      {isUser && isStarted && wpm > 15 && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none">
          {/* Top Exhaust Flame */}
          <div
            className={`h-1.5 rounded-full ${
              isNitro
                ? "w-8 bg-gradient-to-l from-amber-400 via-rose-500 to-cyan-400 animate-pulse shadow-md shadow-cyan-400"
                : "w-4 bg-gradient-to-l from-amber-400 to-orange-500"
            }`}
            style={{ clipPath: "polygon(0 50%, 100% 0, 100% 100%)" }}
          />
          {/* Bottom Exhaust Flame */}
          <div
            className={`h-1.5 rounded-full ${
              isNitro
                ? "w-8 bg-gradient-to-l from-amber-400 via-rose-500 to-cyan-400 animate-pulse shadow-md shadow-cyan-400"
                : "w-4 bg-gradient-to-l from-amber-400 to-orange-500"
            }`}
            style={{ clipPath: "polygon(0 50%, 100% 0, 100% 100%)" }}
          />
        </div>
      )}

      {/* Headlights Light Cone (Shooting to the Right) */}
      {isUser && (
        <div
          className="absolute -right-16 top-1/2 -translate-y-1/2 w-16 h-8 pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at left, rgba(255,255,220,0.5) 0%, rgba(255,255,200,0.15) 50%, transparent 80%)",
          }}
        />
      )}

      {/* Underglow for User's Car */}
      {isUser && glowColor && (
        <div
          className="absolute inset-0 rounded-lg blur-[4px] -z-10"
          style={{ backgroundColor: glowColor }}
        />
      )}

      {/* Top-Down Car SVG */}
      <svg
        width="54"
        height="24"
        viewBox="0 0 54 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        {/* Wheels (4 Black Tires) */}
        {/* Front-Top */}
        <rect x="36" y="0" width="8" height="3" rx="1" fill="#18181b" />
        {/* Front-Bottom */}
        <rect x="36" y="21" width="8" height="3" rx="1" fill="#18181b" />
        {/* Rear-Top */}
        <rect x="8" y="0" width="8" height="3" rx="1" fill="#18181b" />
        {/* Rear-Bottom */}
        <rect x="8" y="21" width="8" height="3" rx="1" fill="#18181b" />

        {/* Aerodynamic Car Body Silhouette */}
        <path
          d="M4 4 C4 3, 6 2, 9 2 L42 2 C47 2, 51 6, 52 11 L52 13 C51 18, 47 22, 42 22 L9 22 C6 22, 4 21, 4 20 Z"
          fill={bodyColor}
        />

        {/* Dual Racing Stripes */}
        <rect x="4" y="9" width="48" height="2" fill={trimColor} opacity="0.9" />
        <rect x="4" y="13" width="48" height="2" fill={trimColor} opacity="0.9" />

        {/* Front Windshield (Dark Tinted Glass) */}
        <path
          d="M32 4 L38 4 C40 4, 42 7, 42 12 C42 17, 40 20, 38 20 L32 20 C34 16, 34 8, 32 4 Z"
          fill="#090d16"
          stroke="#1e293b"
          strokeWidth="0.5"
        />

        {/* Roof Area */}
        <rect x="18" y="5" width="14" height="14" rx="2" fill={bodyColor} />

        {/* Rear Windshield */}
        <path
          d="M14 5 L17 5 L17 19 L14 19 C12 16, 12 8, 14 5 Z"
          fill="#090d16"
          stroke="#1e293b"
          strokeWidth="0.5"
        />

        {/* Rear Spoiler / Wing */}
        <rect x="3" y="3" width="3" height="18" rx="1" fill={trimColor} />

        {/* Headlights (Front Edge) */}
        <rect x="50" y="3" width="2" height="3" rx="0.5" fill="#fef08a" />
        <rect x="50" y="18" width="2" height="3" rx="0.5" fill="#fef08a" />

        {/* Taillights (Rear Edge) */}
        <rect x="4" y="3" width="1.5" height="3" rx="0.5" fill="#ef4444" />
        <rect x="4" y="18" width="1.5" height="3" rx="0.5" fill="#ef4444" />
      </svg>
    </div>
  );
}

