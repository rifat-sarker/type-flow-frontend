"use client";

import { useMemo } from "react";
import { RaceParticipant } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

const CAR_PALETTE = [
  { body: "#f97316", trim: "#fbbf24" }, // orange
  { body: "#06b6d4", trim: "#67e8f9" }, // cyan
  { body: "#a855f7", trim: "#e9d5ff" }, // purple
  { body: "#10b981", trim: "#6ee7b7" }, // emerald
  { body: "#f43f5e", trim: "#fda4af" }, // rose
  { body: "#eab308", trim: "#fef08a" }, // yellow
];

function stringToColorIndex(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % CAR_PALETTE.length;
}

export function PlayerProgressBar({ p, isMe }: { p: RaceParticipant; isMe: boolean }) {
  const carColors = useMemo(() => {
    if (isMe) return { body: "#f97316", trim: "#fbbf24" };
    const idx = stringToColorIndex(p.username);
    return CAR_PALETTE[idx];
  }, [p.username, isMe]);

  const carLeft = Math.min(93, Math.max(2, p.progress));

  return (
    <div className="mb-4">
      {/* Player Header Bar */}
      <div className="flex justify-between items-center text-xs font-mono mb-1.5">
        <span className={`flex items-center gap-2 ${isMe ? "text-amber-400 font-bold" : "text-text"}`}>
          <Avatar username={p.username} size={18} />
          <span>{p.username}</span>
          {isMe && <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[10px] font-extrabold">YOU</span>}
          {p.finished && p.place ? (
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-[10px]">
              🏆 #{p.place}
            </span>
          ) : null}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white tabular-nums">{p.wpm}</span>
          <span className="text-[10px] text-zinc-400">WPM</span>
          <span className="text-dim text-[11px] ml-1">({Math.round(p.progress)}%)</span>
        </div>
      </div>

      {/* Mini Race Highway Lane */}
      <div className="relative h-9 rounded-lg bg-[#14151b] border border-[#2b2d38] overflow-hidden shadow-inner flex items-center">
        {/* Road Center Dashed Line */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 12px, transparent 12px, transparent 24px)",
          }}
        />

        {/* Start Line */}
        <div className="absolute left-4 top-0 bottom-0 w-1 border-r border-dashed border-white/20 pointer-events-none" />

        {/* Finish Line Checkered Banner */}
        <div
          className="absolute right-4 top-0 bottom-0 w-4 pointer-events-none border-l border-white/40 opacity-70"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#ffffff 0% 25%, #000000 0% 50%) 50% / 8px 8px",
          }}
        />

        {/* Player's Top-Down Racing Car */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-10 flex items-center"
          style={{
            left: `${carLeft}%`,
            transition: "left 200ms cubic-bezier(0.2, 0.9, 0.4, 1)",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Flame if moving fast */}
          {p.wpm > 30 && (
            <div
              className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-1 bg-gradient-to-l from-amber-400 to-rose-500 rounded-full animate-pulse"
              style={{ clipPath: "polygon(0 50%, 100% 0, 100% 100%)" }}
            />
          )}

          {/* Mini Car SVG */}
          <svg width="42" height="18" viewBox="0 0 42 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Wheels */}
            <rect x="28" y="0" width="6" height="2" rx="0.5" fill="#18181b" />
            <rect x="28" y="16" width="6" height="2" rx="0.5" fill="#18181b" />
            <rect x="6" y="0" width="6" height="2" rx="0.5" fill="#18181b" />
            <rect x="6" y="16" width="6" height="2" rx="0.5" fill="#18181b" />

            {/* Body */}
            <path
              d="M3 3 C3 2, 5 1.5, 7 1.5 L33 1.5 C37 1.5, 40 4.5, 41 8.5 L41 9.5 C40 13.5, 37 16.5, 33 16.5 L7 16.5 C5 16.5, 3 16, 3 15 Z"
              fill={carColors.body}
            />

            {/* Stripes */}
            <rect x="3" y="7" width="37" height="1.5" fill={carColors.trim} opacity="0.9" />
            <rect x="3" y="9.5" width="37" height="1.5" fill={carColors.trim} opacity="0.9" />

            {/* Windshield */}
            <path
              d="M25 3 L30 3 C31.5 3, 33 5, 33 9 C33 13, 31.5 15, 30 15 L25 15 C26.5 12, 26.5 6, 25 3 Z"
              fill="#090d16"
            />

            {/* Headlights */}
            <rect x="39" y="2.5" width="1.5" height="2" rx="0.5" fill="#fef08a" />
            <rect x="39" y="13.5" width="1.5" height="2" rx="0.5" fill="#fef08a" />

            {/* Taillights */}
            <rect x="3" y="2.5" width="1" height="2" rx="0.5" fill="#ef4444" />
            <rect x="3" y="13.5" width="1" height="2" rx="0.5" fill="#ef4444" />
          </svg>
        </div>
      </div>
    </div>
  );
}
