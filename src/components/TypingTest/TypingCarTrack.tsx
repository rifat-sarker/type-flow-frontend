"use client";

import React, { useMemo, useEffect, useState } from "react";

interface TypingCarTrackProps {
  progress: number; // 0 to 100
  wpm: number;
  isStarted: boolean;
  isFinished: boolean;
  mode: "time" | "words" | "quote" | "zen" | "custom";
  timeLeft?: number;
  totalTime?: number;
  currentWordIdx?: number;
  totalWords?: number;
}

const CAR_COLORS = [
  { id: "amber", name: "Amber Flame", body: "#f97316", trim: "#fbbf24", glow: "rgba(249, 115, 22, 0.45)" },
  { id: "cyan", name: "Cyber Cyan", body: "#06b6d4", trim: "#67e8f9", glow: "rgba(6, 182, 212, 0.45)" },
  { id: "ruby", name: "Ruby Racer", body: "#ef4444", trim: "#f87171", glow: "rgba(239, 68, 68, 0.45)" },
  { id: "emerald", name: "Neon Emerald", body: "#10b981", trim: "#34d399", glow: "rgba(16, 185, 129, 0.45)" },
  { id: "ghost", name: "Ghost White", body: "#f4f4f5", trim: "#a1a1aa", glow: "rgba(244, 244, 245, 0.35)" },
  { id: "violet", name: "Hyper Violet", body: "#8b5cf6", trim: "#c084fc", glow: "rgba(139, 92, 246, 0.45)" },
];

export function TypingCarTrack({
  progress,
  wpm,
  isStarted,
  isFinished,
  mode,
  timeLeft,
  totalTime,
  currentWordIdx,
  totalWords,
}: TypingCarTrackProps) {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [trackVisible, setTrackVisible] = useState(true);

  // Load saved car color and visibility from localStorage
  useEffect(() => {
    try {
      const savedColor = localStorage.getItem("typeflow_car_color");
      if (savedColor) {
        const idx = CAR_COLORS.findIndex((c) => c.id === savedColor);
        if (idx !== -1) setSelectedColorIdx(idx);
      }
      const savedVis = localStorage.getItem("typeflow_car_track_visible");
      if (savedVis !== null) {
        setTrackVisible(savedVis === "1");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectColor = (idx: number) => {
    setSelectedColorIdx(idx);
    try {
      localStorage.setItem("typeflow_car_color", CAR_COLORS[idx].id);
    } catch {
      /* ignore */
    }
  };

  const toggleTrack = () => {
    setTrackVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("typeflow_car_track_visible", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const carColor = CAR_COLORS[selectedColorIdx] || CAR_COLORS[0];

  // Dynamic road animation speed based on WPM
  // Faster WPM = faster road scroll animation
  const roadScrollDuration = useMemo(() => {
    if (!isStarted || wpm === 0) return 0;
    // WPM 20 -> 1.5s, WPM 60 -> 0.7s, WPM 100 -> 0.35s, WPM 140+ -> 0.2s
    const dur = Math.max(0.18, 1.8 - (wpm / 100) * 1.3);
    return dur;
  }, [isStarted, wpm]);

  // Speed level status
  const speedTier = useMemo(() => {
    if (!isStarted || wpm === 0) return { label: "IDLE", color: "text-dim", gear: "N", nitro: false };
    if (wpm < 35) return { label: "CRUISING", color: "text-zinc-300", gear: "1", nitro: false };
    if (wpm < 60) return { label: "ACCELERATING", color: "text-cyan-400", gear: "2", nitro: false };
    if (wpm < 85) return { label: "FAST SPEED 💨", color: "text-amber-400", gear: "3", nitro: true };
    if (wpm < 110) return { label: "TURBO BOOST ⚡", color: "text-orange-400", gear: "4", nitro: true };
    return { label: "HYPERSPEED 🔥", color: "text-rose-400", gear: "5", nitro: true };
  }, [isStarted, wpm]);

  // Clamped position for the car on the track
  const carLeftPercent = Math.min(92, Math.max(2, progress));

  if (!trackVisible) {
    return (
      <div className="w-full max-w-5xl mb-4 flex justify-end">
        <button
          onClick={toggleTrack}
          className="text-xs font-mono text-dim hover:text-text px-2.5 py-1 rounded bg-panel/60 border border-border/60 transition-all flex items-center gap-1.5"
          title="Show Race Car"
        >
          <span>🏎️</span>
          <span>Show Race Car</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mb-6 select-none font-sans">
      {/* Race Dashboard Header */}
      <div className="flex items-center justify-between px-3 py-1.5 mb-1.5 rounded-t-lg bg-panel/80 border-t border-x border-border/80 text-xs font-mono">
        {/* Speedometer & Gear */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-amber-400">⚡</span>
            <span className="text-text tracking-wide">SPEED:</span>
            <span className="text-accent text-sm tabular-nums font-extrabold">{wpm}</span>
            <span className="text-dim text-[10px]">WPM</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-panel2/80 border border-border/60 text-[11px]">
            <span className="text-dim">GEAR</span>
            <span className="font-bold text-accent">{speedTier.gear}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <div className="h-1.5 w-16 bg-panel2 rounded-full overflow-hidden border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (wpm / 120) * 100)}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold tracking-wider ${speedTier.color}`}>
              {speedTier.label}
            </span>
          </div>
        </div>

        {/* Progress Info */}
        <div className="flex items-center gap-3">
          {mode === "time" && timeLeft !== undefined && totalTime !== undefined ? (
            <div className="text-[11px] text-dim flex items-center gap-1">
              <span>⏱️</span>
              <span className="text-text font-bold">{timeLeft}s</span>
              <span className="text-dim/70">/ {totalTime}s</span>
            </div>
          ) : currentWordIdx !== undefined && totalWords !== undefined ? (
            <div className="text-[11px] text-dim flex items-center gap-1">
              <span>🏁</span>
              <span className="text-text font-bold">{currentWordIdx}</span>
              <span className="text-dim/70">/ {totalWords} words</span>
            </div>
          ) : (
            <div className="text-[11px] text-dim font-bold">
              <span className="text-accent">{Math.round(progress)}%</span> Complete
            </div>
          )}

          {/* Color Switcher & Hide Toggle */}
          <div className="flex items-center gap-1 pl-2 border-l border-border/60">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded text-dim hover:text-text hover:bg-panel2 transition-colors text-xs"
              title="Car Paint Options"
            >
              🎨
            </button>
            <button
              onClick={toggleTrack}
              className="p-1 rounded text-dim hover:text-text hover:bg-panel2 transition-colors text-xs"
              title="Hide Race Car"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Paint Selector Dropdown */}
      {showSettings && (
        <div className="flex items-center gap-2 px-3 py-2 bg-panel2/90 border-x border-border/80 text-xs">
          <span className="text-dim font-mono text-[11px]">Racer Color:</span>
          <div className="flex items-center gap-2">
            {CAR_COLORS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => selectColor(i)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  selectedColorIdx === i ? "scale-125 border-white shadow-sm" : "border-transparent opacity-75 hover:opacity-100"
                }`}
                style={{ backgroundColor: c.body }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Race Track Road */}
      <div className="relative h-24 sm:h-28 rounded-b-lg overflow-hidden border border-border/80 bg-[#121316] shadow-inner">
        {/* Upper Rumble Strip (Red & White Curbs) */}
        <div
          className="absolute top-0 left-0 right-0 h-2 bg-repeat-x z-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 14px, #f4f4f5 14px, #f4f4f5 28px)",
            boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.5)",
          }}
        />

        {/* Lower Rumble Strip */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 bg-repeat-x z-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 14px, #f4f4f5 14px, #f4f4f5 28px)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
          }}
        />

        {/* Road Surface Texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#18191d] via-[#111214] to-[#18191d] opacity-90" />

        {/* Animated Dashed Lane Dividers */}
        <div
          className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[3px]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 24px, transparent 24px, transparent 48px)",
            backgroundSize: "48px 3px",
            animation: roadScrollDuration > 0 ? `roadMove ${roadScrollDuration}s linear infinite` : "none",
          }}
        />

        {/* Distance Hash Marks */}
        <div className="absolute inset-x-0 bottom-3 flex justify-between px-6 pointer-events-none text-[9px] font-mono text-white/20 select-none">
          <span>START</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span className="text-amber-400/60 font-bold">FINISH</span>
        </div>

        {/* Start Line */}
        <div className="absolute left-6 top-2 bottom-2 w-1 border-r border-dashed border-white/30 pointer-events-none" />

        {/* Checkered Finish Line Banner */}
        <div
          className="absolute right-4 top-2 bottom-2 w-5 pointer-events-none z-10 border-l border-white/40 opacity-80"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#ffffff 0% 25%, #000000 0% 50%) 50% / 10px 10px",
            boxShadow: "0 0 10px rgba(255,255,255,0.3)",
          }}
        >
          <div className="absolute -top-1 -right-2 text-xs">🏁</div>
        </div>

        {/* The Racing Car */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20"
          style={{
            left: `${carLeftPercent}%`,
            transition: "left 260ms cubic-bezier(0.2, 0.9, 0.4, 1)",
            transform: `translate(-50%, -50%) ${
              isStarted && wpm > 0 ? "translateY(0.5px)" : ""
            }`,
          }}
        >
          {/* Underglow Neon Light */}
          <div
            className="absolute -bottom-1 left-2 right-2 h-2.5 rounded-full blur-[6px] opacity-75"
            style={{ backgroundColor: carColor.glow }}
          />

          {/* Exhaust Flame & Smoke Particles */}
          {isStarted && wpm > 20 && (
            <div className="absolute left-[-26px] top-[14px] flex items-center pointer-events-none">
              {/* Flame Particle */}
              <div
                className={`h-3 rounded-full animate-pulse ${
                  wpm > 80
                    ? "w-8 bg-gradient-to-l from-amber-400 via-orange-500 to-rose-500 blur-[1px]"
                    : "w-5 bg-gradient-to-l from-cyan-400 to-blue-500 blur-[1px]"
                }`}
                style={{
                  clipPath: "polygon(0 40%, 100% 0, 100% 100%, 0 60%)",
                  filter: `drop-shadow(0 0 6px ${carColor.body})`,
                }}
              />
              {/* Nitro spark */}
              {wpm > 65 && (
                <div className="absolute -left-2 top-0.5 w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
              )}
            </div>
          )}

          {/* Headlight Beam shining forward on the track */}
          {isStarted && (
            <div
              className="absolute right-[-45px] top-[10px] w-28 h-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at left, rgba(255, 255, 230, 0.35) 0%, rgba(255, 255, 200, 0.08) 50%, transparent 80%)",
                transform: "translateY(-20%)",
              }}
            />
          )}

          {/* Detailed Vector Sports Car SVG */}
          <svg
            width="84"
            height="34"
            viewBox="0 0 84 34"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            {/* Rear Wing / Spoiler */}
            <path
              d="M4 11 L14 11 L11 15 L2 15 Z"
              fill={carColor.trim}
            />
            <rect x="7" y="15" width="2" height="4" fill="#333" />

            {/* Aerodynamic Car Body */}
            <path
              d="M10 20 
                 C11 16, 17 14, 25 12 
                 L44 11 
                 C54 11, 62 14, 70 19 
                 L78 20 
                 C81 21, 83 23, 83 26 
                 L81 27 
                 C81 28, 77 28, 73 28 
                 C72 25, 68 23, 64 23 
                 C60 23, 56 25, 55 28 
                 L34 28 
                 C33 25, 29 23, 25 23 
                 C21 23, 17 25, 16 28 
                 L8 28 
                 C5 28, 4 25, 4 23 
                 L10 20 Z"
              fill={carColor.body}
            />

            {/* Body Highlights / Accent Stripe */}
            <path
              d="M26 13 L45 12 C53 12, 60 14, 66 18 L76 19"
              stroke={carColor.trim}
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Cockpit / Windshield */}
            <path
              d="M27 19 L32 13 L47 13 L56 19 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="0.8"
            />
            {/* Windshield Glare Reflection */}
            <path
              d="M34 14 L37 14 L42 18 L39 18 Z"
              fill="rgba(255,255,255,0.4)"
            />

            {/* Headlight LED */}
            <path
              d="M78 21 L82 22 L80 24 L76 23 Z"
              fill="#fef08a"
              filter="drop-shadow(0 0 2px #fef08a)"
            />

            {/* Taillight LED strip */}
            <path
              d="M5 21 L7 21 L6 24 L4 24 Z"
              fill="#ef4444"
              filter="drop-shadow(0 0 2px #ef4444)"
            />

            {/* Exhaust Pipe */}
            <rect x="2" y="24" width="3" height="2" rx="0.5" fill="#475569" />

            {/* Rear Wheel */}
            <g
              style={{
                transformOrigin: "25px 27px",
                animation:
                  roadScrollDuration > 0
                    ? `spinWheel ${roadScrollDuration * 0.4}s linear infinite`
                    : "none",
              }}
            >
              <circle cx="25" cy="27" r="6.5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
              <circle cx="25" cy="27" r="3.5" fill="#71717a" />
              {/* Alloy Spokes */}
              <line x1="25" y1="21.5" x2="25" y2="32.5" stroke="#e4e4e7" strokeWidth="1" />
              <line x1="19.5" y1="27" x2="30.5" y2="27" stroke="#e4e4e7" strokeWidth="1" />
            </g>

            {/* Front Wheel */}
            <g
              style={{
                transformOrigin: "64px 27px",
                animation:
                  roadScrollDuration > 0
                    ? `spinWheel ${roadScrollDuration * 0.4}s linear infinite`
                    : "none",
              }}
            >
              <circle cx="64" cy="27" r="6.5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
              <circle cx="64" cy="27" r="3.5" fill="#71717a" />
              {/* Alloy Spokes */}
              <line x1="64" y1="21.5" x2="64" y2="32.5" stroke="#e4e4e7" strokeWidth="1" />
              <line x1="58.5" y1="27" x2="69.5" y2="27" stroke="#e4e4e7" strokeWidth="1" />
            </g>
          </svg>

          {/* Finish Line Victory Badge */}
          {isFinished && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-emerald-500 text-white font-mono text-[10px] font-bold shadow-lg animate-bounce whitespace-nowrap">
              🏁 FINISH!
            </div>
          )}
        </div>
      </div>

      {/* Scoped CSS animations for road and wheels */}
      <style jsx>{`
        @keyframes roadMove {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: -48px 0;
          }
        }
        @keyframes spinWheel {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

