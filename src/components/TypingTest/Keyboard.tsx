"use client";

import { useEffect, useRef, useState } from "react";
import { KB_ROWS } from "@/lib/fingerMap";

interface KeyboardProps {
  pressedCode: string | null;
  pressId: number;
}

// ─── Key widths ───────────────────────────────────────────────────────────────
const KEY_H   = 44;
const KEY_UNIT = 44;
const KEY_GAP  = 6;
const PAD      = 16;
const ROW_INDENT = [0, 0, 0, 0, 0];

function widthFactor(w?: string): number {
  switch (w) {
    case "w15":    return 1.5;
    case "w175":   return 1.75;
    case "w2":     return 2;
    case "w225":   return 2.25;
    case "w275":   return 2.75;
    case "wspace": return 6.5;
    default:       return 1;
  }
}

// ─── Main Keyboard component ──────────────────────────────────────────────────
export function Keyboard({ pressedCode, pressId }: KeyboardProps) {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [animKey,    setAnimKey]    = useState<string | null>(null);

  const keyTRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pressedCode) return;

    setActiveCode(pressedCode);
    setAnimKey(pressedCode);
    
    if (keyTRef.current)  clearTimeout(keyTRef.current);
    if (animTRef.current) clearTimeout(animTRef.current);
    
    keyTRef.current  = setTimeout(() => setActiveCode(null), 100);
    animTRef.current = setTimeout(() => setAnimKey(null),    120);

    return () => {
      if (keyTRef.current)  clearTimeout(keyTRef.current);
      if (animTRef.current) clearTimeout(animTRef.current);
    };
  }, [pressId, pressedCode]);

  // Calculate width of each row
  const rowWidths = KB_ROWS.map((row) =>
    row.reduce((sum, [, , w]) => sum + widthFactor(w) * KEY_UNIT + KEY_GAP, -KEY_GAP)
  );
  
  // Find the maximum row width to ensure all rows are flush on the right edge
  const maxRowWidth = Math.max(...rowWidths);
  const svgW = maxRowWidth + PAD * 2;
  const svgH = KB_ROWS.length * (KEY_H + KEY_GAP) - KEY_GAP + PAD * 2;

  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #E8E9EB, #D1D2D5)", // Mac Aluminum finish
        borderRadius: 20,
        padding: "18px",
        boxShadow:
          "0 1px 2px rgba(255,255,255,0.8) inset, " +
          "0 -1px 3px rgba(0,0,0,0.1) inset, " +
          "0 15px 35px rgba(0,0,0,0.15), " +
          "0 5px 15px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.4)",
        userSelect: "none",
        position: "relative",
        width: "fit-content",
        margin: "0 auto",
        maxWidth: "100%", // Prevent CSS from squishing the width
        overflowX: "auto" // Allow scrolling on very small screens instead of cutting off
      }}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <filter id="keyShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="rgba(0,0,0,0.15)" />
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="rgba(0,0,0,0.12)" />
          </filter>
          <filter id="keyPressShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="rgba(0,0,0,0.1)" />
          </filter>
        </defs>

        {/* ── Keys ── */}
        {KB_ROWS.map((row, ri) => {
          let x = PAD + ROW_INDENT[ri];
          const y = PAD + ri * (KEY_H + KEY_GAP);

          return row.map(([label, code, w], ki) => {
            const isLastInRow = ki === row.length - 1;
            let kw = widthFactor(w) * KEY_UNIT;
            
            // If it's the last key in the row, stretch it so the right edge is flush
            if (isLastInRow) {
              const currentXEnd = x + kw - PAD;
              const diff = maxRowWidth - currentXEnd;
              if (diff > 0) kw += diff;
            }

            const isActive = activeCode === code;
            const isAnim   = animKey    === code;
            const rx       = 7; // Magic keyboard soft corners
            const keyX     = x;
            
            x += kw + KEY_GAP;

            // Magic Keyboard press effect: key depresses slightly
            const translateY = isAnim ? 1.5 : 0;
            
            // Modifier keys have different label positioning in mac
            const isModifier = label.length > 1;

            return (
              <g
                key={`${ri}-${ki}`}
                data-code={code}
                style={{
                  transform: `translateY(${translateY}px)`,
                  transition: isAnim
                    ? "none"
                    : "transform 100ms cubic-bezier(0.2, 0.9, 0.3, 1)",
                }}
              >
                {/* Key face (White plastic) */}
                <rect
                  x={keyX} y={y} width={kw} height={KEY_H} rx={rx}
                  fill={isActive ? "#E8E8E8" : "#FFFFFF"}
                  filter={isActive ? "url(#keyPressShadow)" : "url(#keyShadow)"}
                  stroke={isActive ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.8)"}
                  strokeWidth="1"
                />
                
                {/* Label */}
                <text
                  x={isModifier ? keyX + 8 : keyX + kw / 2} 
                  y={isModifier ? y + KEY_H - 10 : y + KEY_H / 2 + 5}
                  textAnchor={isModifier ? "start" : "middle"}
                  fontSize={isModifier ? 10 : 13}
                  fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif"
                  fontWeight={isModifier ? "400" : "500"}
                  letterSpacing={isModifier ? "0" : "0.5"}
                  fill={isActive ? "#444444" : "#555555"}
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
