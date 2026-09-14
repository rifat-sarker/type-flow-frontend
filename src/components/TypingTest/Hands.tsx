"use client";

import { useEffect, useRef, RefObject } from "react";
import { FINGER_MAP } from "@/lib/fingerMap";
import { FINGER_HOME_KEY } from "@/lib/fingerHome";

interface HandsProps {
  stageRef: RefObject<HTMLDivElement>;
  pressedCode: string | null;
  pressId: number;
  enabled: boolean;
}

// ─── Dimensions ───────────────────────────────────────────────────────────────
const FINGER_W = 11;   // slim fingers like real typing hands
const FINGER_H = 52;
const THUMB_W  = 14;
const THUMB_H  = 38;

// Resting splay per finger (degrees)
const IDLE_ROTATION: Record<string, number> = {
  L5: -14, L4: -6, L3: 1, L2: 8,  L1: 34,
  R2:  -8, R3: -1, R4: 6, R5: 14, R1: -34,
};
const ALL_FINGERS = Object.keys(IDLE_ROTATION);

// ─── Single finger SVG ────────────────────────────────────────────────────────
// Tapered capsule: slightly wider at base, fully rounded at tip
function FingerSvg({ id, pressed }: { id: string; pressed: boolean }) {
  const isThumb = id === "L1" || id === "R1";
  const w = isThumb ? THUMB_W : FINGER_W;
  const h = isThumb ? THUMB_H : FINGER_H;
  const rx = w / 2;

  // Tapered path: full width at bottom, slightly narrower at top
  const taper = isThumb ? 1.5 : 1.5;
  const bw = w;
  const tw = w - taper * 2;
  const bl = (bw - tw) / 2; // left offset for top

  // Outer path (tapered capsule)
  const path = [
    `M ${bl},${h}`,
    `L ${bw - bl},${h}`,
    `Q ${bw},${h} ${bw},${h - rx}`,
    `L ${bw},${rx + 2}`,
    `Q ${bw},0 ${bw / 2},0`,
    `Q 0,0 0,${rx + 2}`,
    `L 0,${h - rx}`,
    `Q 0,${h} ${bl},${h}`,
    `Z`,
  ].join(" ");

  const gradId = `fg-${id}`;
  const sheenId = `sh-${id}`;
  const shadowId = `sd-${id}`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="finger-svg overflow-visible block"
      style={{
        transition: "transform 100ms cubic-bezier(0.3,1.4,0.4,1)",
        transform: pressed ? "translateY(4px) scaleY(0.93)" : "none",
        filter: pressed ? "brightness(0.82)" : "none",
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%"   stopColor={pressed ? "#c8845a" : "#f0c090"} />
          <stop offset="60%"  stopColor={pressed ? "#b87040" : "#dfa070"} />
          <stop offset="100%" stopColor={pressed ? "#a06030" : "#c07848"} />
        </linearGradient>
        {/* Side sheen */}
        <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
          <stop offset="28%"  stopColor="rgba(255,255,255,0.32)" />
          <stop offset="55%"  stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={shadowId} x="-30%" y="-10%" width="160%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>

      {/* Main finger body */}
      <path
        d={path}
        fill={`url(#${gradId})`}
        stroke="rgba(140,75,35,0.28)"
        strokeWidth="0.6"
        filter={`url(#${shadowId})`}
      />

      {/* Side sheen */}
      <path d={path} fill={`url(#${sheenId})`} />

      {/* Knuckle lines (not on thumb) */}
      {!isThumb && (
        <>
          <line
            x1={w * 0.2} y1={h * 0.54}
            x2={w * 0.8} y2={h * 0.54}
            stroke="rgba(140,75,35,0.18)" strokeWidth="0.7" strokeLinecap="round"
          />
          <line
            x1={w * 0.22} y1={h * 0.7}
            x2={w * 0.78} y2={h * 0.7}
            stroke="rgba(140,75,35,0.12)" strokeWidth="0.5" strokeLinecap="round"
          />
        </>
      )}

      {/* Fingernail */}
      <ellipse
        cx={w / 2}
        cy={h * (isThumb ? 0.17 : 0.13)}
        rx={w * 0.28}
        ry={h * 0.072}
        fill="rgba(255,235,215,0.6)"
        stroke="rgba(200,155,120,0.25)"
        strokeWidth="0.4"
      />
    </svg>
  );
}

// ─── One full hand overlay (left or right) ────────────────────────────────────
// Renders as an absolutely-positioned wrapper containing fingers + a slim wrist/palm strip.
function FingerEl({
  id,
  pressed,
  elRef,
}: {
  id: string;
  pressed: boolean;
  elRef: (el: HTMLDivElement | null) => void;
}) {
  const isThumb = id === "L1" || id === "R1";
  const w = isThumb ? THUMB_W : FINGER_W;
  const h = isThumb ? THUMB_H : FINGER_H;

  return (
    <div
      ref={elRef}
      data-finger={id}
      className="absolute pointer-events-none"
      style={{
        width: w,
        height: h,
        transition:
          "left 140ms cubic-bezier(0.22,0.8,0.3,1), top 140ms cubic-bezier(0.22,0.8,0.3,1)",
      }}
    >
      <FingerSvg id={id} pressed={pressed} />
    </div>
  );
}

// ─── Palm / wrist strip ───────────────────────────────────────────────────────
// A slim, rounded rectangle sitting just below the finger bases — acts as a wrist.
function PalmEl({
  elRef,
  mirror,
  id,
}: {
  elRef: (el: HTMLDivElement | null) => void;
  mirror: boolean;
  id: string;
}) {
  const gradId = `palm-grad-${id}`;
  const shadowId = `palm-sd-${id}`;
  return (
    <div
      ref={elRef}
      className="absolute pointer-events-none"
      style={{ transform: mirror ? "scaleX(-1)" : undefined }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 58"
        preserveAspectRatio="none"
        className="block overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0.2" y1="0" x2="0.6" y2="1">
            <stop offset="0%"   stopColor="#eebc90" />
            <stop offset="50%"  stopColor="#dda070" />
            <stop offset="100%" stopColor="#c07848" />
          </linearGradient>
          <filter id={shadowId} x="-10%" y="-10%" width="130%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.38)" />
          </filter>
        </defs>

        {/* Palm body — rounded rect that narrows toward the wrist */}
        <path
          d="M 4,0 L 96,0 Q 100,0 100,6 L 100,50 Q 100,58 88,58 L 12,58 Q 0,58 0,50 L 0,6 Q 0,0 4,0 Z"
          fill={`url(#${gradId})`}
          filter={`url(#${shadowId})`}
          stroke="rgba(150,85,40,0.22)"
          strokeWidth="0.7"
        />

        {/* Top sheen */}
        <path
          d="M 8,0 L 82,0 Q 96,0 96,8 L 90,26 Q 85,30 50,29 L 10,24 Q 3,18 4,8 Q 4,0 8,0 Z"
          fill="rgba(255,255,255,0.16)"
        />

        {/* Knuckle crease at finger base */}
        <path
          d="M 10,4 Q 50,1 90,4"
          fill="none"
          stroke="rgba(150,85,40,0.14)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Hands({ stageRef, pressedCode, pressId, enabled }: HandsProps) {
  const fingerRefs  = useRef<Record<string, HTMLDivElement | null>>({});
  const palmLeftRef  = useRef<HTMLDivElement | null>(null);
  const palmRightRef = useRef<HTMLDivElement | null>(null);
  const homePosRef  = useRef<Record<string, { left: number; top: number }>>({});
  const idleTimers  = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pressedRef  = useRef<string | null>(null); // track which finger is currently "down"

  function keyBox(stage: HTMLElement, code: string) {
    const keyEl = stage.querySelector<HTMLElement>(`[data-code="${CSS.escape(code)}"]`);
    if (!keyEl) return null;
    const kr = keyEl.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    return {
      left: kr.left - sr.left + kr.width / 2 - FINGER_W / 2,
      top:  kr.top  - sr.top  - 4,
    };
  }

  function applyFingerPos(
    fingerKey: string,
    pos: { left: number; top: number },
    rotate = true
  ) {
    const el = fingerRefs.current[fingerKey];
    if (!el) return;
    el.style.left = `${pos.left}px`;
    el.style.top  = `${pos.top}px`;
    if (rotate)
      el.style.transform = `rotate(${IDLE_ROTATION[fingerKey] ?? 0}deg)`;
  }

  function layout() {
    const stage = stageRef.current;
    if (!stage) return;

    for (const fk of ALL_FINGERS) {
      if (fk === "L1" || fk === "R1") continue;
      const home = FINGER_HOME_KEY[fk];
      const box  = home && keyBox(stage, home);
      if (!box) continue;
      homePosRef.current[fk] = box;
      applyFingerPos(fk, box);
    }

    const spaceBox = keyBox(stage, " ") ?? keyBox(stage, "space");
    if (spaceBox) {
      const lt = { left: spaceBox.left - 52, top: spaceBox.top - 4 };
      const rt = { left: spaceBox.left + 62, top: spaceBox.top - 4 };
      homePosRef.current.L1 = lt;
      homePosRef.current.R1 = rt;
      applyFingerPos("L1", lt);
      applyFingerPos("R1", rt);
    }

    // ── Palms: slim wrist strip just below each hand's home row ──
    const leftHomes  = ["L5","L4","L3","L2"].map(f => homePosRef.current[f]).filter(Boolean);
    const rightHomes = ["R2","R3","R4","R5"].map(f => homePosRef.current[f]).filter(Boolean);

    const placePalm = (
      el: HTMLDivElement | null,
      homes: { left: number; top: number }[]
    ) => {
      if (!el || !homes.length) return;
      const minL = Math.min(...homes.map(h => h.left)) - 10;
      const maxR = Math.max(...homes.map(h => h.left + FINGER_W)) + 10;
      const top  = Math.max(...homes.map(h => h.top))  + FINGER_H * 0.62;
      el.style.left   = `${minL}px`;
      el.style.width  = `${maxR - minL}px`;
      el.style.top    = `${top}px`;
      el.style.height = `52px`;
    };

    placePalm(palmLeftRef.current,  leftHomes);
    placePalm(palmRightRef.current, rightHomes);
  }

  useEffect(() => {
    if (!enabled) return;
    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // We track pressed finger key in a ref so FingerEl can re-render pressed state
  const [pressedFinger, setPressedFinger] = React.useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !pressedCode) return;
    const stage = stageRef.current;
    if (!stage) return;
    const fingerKey = FINGER_MAP[pressedCode];
    if (!fingerKey) return;

    if (fingerKey === "THUMB") {
      setPressedFinger("THUMB");
      setTimeout(() => setPressedFinger(null), 130);
      return;
    }

    const el  = fingerRefs.current[fingerKey];
    const box = keyBox(stage, pressedCode);
    if (!el || !box) return;

    el.style.left = `${box.left}px`;
    el.style.top  = `${box.top}px`;

    setPressedFinger(fingerKey);
    setTimeout(() => setPressedFinger(null), 130);

    if (idleTimers.current[fingerKey]) clearTimeout(idleTimers.current[fingerKey]);
    idleTimers.current[fingerKey] = setTimeout(() => {
      const home = homePosRef.current[fingerKey];
      if (home) applyFingerPos(fingerKey, home, false);
    }, 480);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressId]);

  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[2]"
      style={{ opacity: 0.82 }}
    >
      <PalmEl id="left"  elRef={el => (palmLeftRef.current  = el)} mirror={false} />
      <PalmEl id="right" elRef={el => (palmRightRef.current = el)} mirror />

      {ALL_FINGERS.map(id => {
        const isThumb  = id === "L1" || id === "R1";
        const isPressed =
          pressedFinger === id ||
          (pressedFinger === "THUMB" && isThumb);

        return (
          <FingerEl
            key={id}
            id={id}
            pressed={isPressed}
            elRef={el => (fingerRefs.current[id] = el)}
          />
        );
      })}
    </div>
  );
}

// Need React import for useState inside
import React from "react";
