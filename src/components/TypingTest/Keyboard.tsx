"use client";

import { useEffect, useRef, useState } from "react";
import { KB_ROWS, FINGER_MAP } from "@/lib/fingerMap";

interface KeyboardProps {
  pressedCode: string | null;
  pressId: number;
}

// Finger zone colors — subtle tints showing which finger owns each key
const FINGER_ZONE_COLORS: Record<string, string> = {
  L5: "rgba(255,160,80,0.18)",   // pinky — amber
  L4: "rgba(255,220,60,0.15)",   // ring — yellow
  L3: "rgba(100,220,130,0.15)",  // middle — green
  L2: "rgba(70,160,255,0.18)",   // index — blue
  R2: "rgba(70,160,255,0.18)",   // index — blue
  R3: "rgba(100,220,130,0.15)",  // middle — green
  R4: "rgba(255,220,60,0.15)",   // ring — yellow
  R5: "rgba(255,160,80,0.18)",   // pinky — amber
  THUMB: "rgba(180,100,255,0.15)", // thumb — purple
};

// Map each key code to its finger zone

function getFingerColor(code: string): string {
  const finger = FINGER_MAP[code] ?? FINGER_MAP[code.toLowerCase()];
  return finger ? (FINGER_ZONE_COLORS[finger] ?? "transparent") : "transparent";
}

// Key width multipliers
function widthFactor(w?: string): number {
  switch (w) {
    case "w15":  return 1.5;
    case "w175": return 1.75;
    case "w2":   return 2;
    case "w225": return 2.25;
    case "w275": return 2.75;
    case "wspace": return 6.5;
    default: return 1;
  }
}

const KEY_H = 36;      // key height px
const KEY_GAP = 5;     // gap between keys
const KEY_UNIT = 36;   // base key width (1u)
const ROW_INDENT = [0, 0, 0, 0, 0]; // left indent per row (px) — Magic Keyboard starts flush

export function Keyboard({ pressedCode, pressId }: KeyboardProps) {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pressedCode) return;
    setActiveCode(pressedCode);
    setAnimKey(pressedCode);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActiveCode(null), 120);

    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = setTimeout(() => setAnimKey(null), 130);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animRef.current) clearTimeout(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressId]);

  // Compute total SVG width from the widest row
  const rowWidths = KB_ROWS.map((row) =>
    row.reduce((sum, [, , w]) => sum + widthFactor(w) * KEY_UNIT + KEY_GAP, -KEY_GAP)
  );
  const svgW = Math.max(...rowWidths) + 28; // padding
  const svgH = KB_ROWS.length * (KEY_H + KEY_GAP) - KEY_GAP + 28;

  return (
    <div
      className="relative"
      style={{
        background: "linear-gradient(160deg, #d8d8d8 0%, #c4c4c4 100%)",
        borderRadius: 14,
        padding: "14px 14px 16px",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 8px 32px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3)",
        border: "1px solid rgba(0,0,0,0.25)",
        userSelect: "none",
      }}
    >
      {/* Keyboard top sheen */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "50%",
          borderRadius: "14px 14px 0 0",
          background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          {/* Normal key gradient — slight top highlight */}
          <linearGradient id="keyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#dcdcdc" />
          </linearGradient>
          {/* Pressed key gradient — inverted, darker */}
          <linearGradient id="keyGradPressed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8c8c8" />
            <stop offset="100%" stopColor="#d8d8d8" />
          </linearGradient>
          {/* Accent key gradient for pressed accent */}
          <linearGradient id="keyGradAccent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(var(--c-accent),1)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="rgba(var(--c-accent),0.8)" stopOpacity="0.85" />
          </linearGradient>
          <filter id="keyShadow" x="-5%" y="-5%" width="120%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="rgba(0,0,0,0.28)" />
          </filter>
          <filter id="keyPressShadow" x="-5%" y="-5%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="rgba(0,0,0,0.18)" />
          </filter>
        </defs>

        {KB_ROWS.map((row, ri) => {
          let x = 14 + ROW_INDENT[ri];
          const y = 14 + ri * (KEY_H + KEY_GAP);

          return row.map(([label, code, w], ki) => {
            const kw = widthFactor(w) * KEY_UNIT + (widthFactor(w) - 1) * 0;
            const isActive = activeCode === code;
            const isAnim = animKey === code;
            const fingerColor = getFingerColor(code);
            const rx = 6; // corner radius

            const keyX = x;
            x += kw + KEY_GAP;

            const translateY = isAnim ? 1.5 : 0;

            return (
              <g
                key={`${ri}-${ki}`}
                data-code={code}
                style={{
                  transform: `translateY(${translateY}px)`,
                  transition: isAnim ? "none" : "transform 90ms cubic-bezier(0.25,0.8,0.35,1)",
                }}
              >
                {/* Key shadow / border */}
                <rect
                  x={keyX}
                  y={y + 1}
                  width={kw}
                  height={KEY_H}
                  rx={rx}
                  fill={isActive ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.22)"}
                />

                {/* Key face */}
                <rect
                  x={keyX}
                  y={y}
                  width={kw}
                  height={KEY_H}
                  rx={rx}
                  fill={isActive ? `url(#keyGradPressed)` : `url(#keyGrad)`}
                  filter={isActive ? "url(#keyPressShadow)" : "url(#keyShadow)"}
                />

                {/* Finger zone tint */}
                {fingerColor !== "transparent" && (
                  <rect
                    x={keyX}
                    y={y}
                    width={kw}
                    height={KEY_H}
                    rx={rx}
                    fill={fingerColor}
                  />
                )}

                {/* Pressed accent overlay */}
                {isActive && (
                  <rect
                    x={keyX}
                    y={y}
                    width={kw}
                    height={KEY_H}
                    rx={rx}
                    fill="rgba(var(--c-accent), 0.25)"
                    style={{
                      "--c-accent": "255 75 43",
                    } as React.CSSProperties}
                  />
                )}

                {/* Top sheen on key */}
                <rect
                  x={keyX + 1}
                  y={y + 1}
                  width={kw - 2}
                  height={KEY_H * 0.4}
                  rx={rx - 1}
                  fill="rgba(255,255,255,0.55)"
                />

                {/* Key label */}
                <text
                  x={keyX + kw / 2}
                  y={y + KEY_H / 2 + 4.5}
                  textAnchor="middle"
                  fontSize={label.length > 3 ? 8 : label.length > 1 ? 9 : 11}
                  fontFamily="-apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
                  fontWeight="500"
                  fill={isActive ? "rgba(180,60,30,0.9)" : "rgba(60,60,60,0.9)"}
                  style={{ letterSpacing: label.length > 3 ? "-0.3px" : "0" }}
                >
                  {label}
                </text>
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
}
