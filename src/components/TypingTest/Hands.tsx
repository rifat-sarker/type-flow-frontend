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

// ─── Constants ────────────────────────────────────────────────────────────────

const FINGER_W = 18;
const FINGER_H = 56;
const THUMB_W = 22;
const THUMB_H = 42;

// Idle splay rotation per finger (degrees)
const IDLE_ROTATION: Record<string, number> = {
  L5: -16, L4: -7, L3: 1, L2: 9, L1: 38,
  R2: -9, R3: -1, R4: 7, R5: 16, R1: -38,
};
const ALL_FINGERS = Object.keys(IDLE_ROTATION);

// ─── SVG Finger ───────────────────────────────────────────────────────────────

function SvgFinger({
  id,
  elRef,
}: {
  id: string;
  elRef: (el: HTMLDivElement | null) => void;
}) {
  const isThumb = id === "L1" || id === "R1";
  const w = isThumb ? THUMB_W : FINGER_W;
  const h = isThumb ? THUMB_H : FINGER_H;
  const rx = w / 2;

  return (
    <div
      ref={elRef}
      data-finger={id}
      className="absolute pointer-events-none"
      style={{
        width: w,
        height: h,
        transition:
          "left 145ms cubic-bezier(.22,.8,.3,1), top 145ms cubic-bezier(.22,.8,.3,1)",
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="finger-svg overflow-visible"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={`fgGrad-${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#f5c9a0" />
            <stop offset="55%" stopColor="#e8a876" />
            <stop offset="100%" stopColor="#c8845a" />
          </linearGradient>
          <linearGradient id={`fgSheen-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
          </linearGradient>
          <filter id={`fgShadow-${id}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="rgba(0,0,0,0.38)" />
          </filter>
        </defs>

        {/* Finger body */}
        <rect
          x={1}
          y={1}
          width={w - 2}
          height={h - 2}
          rx={rx}
          fill={`url(#fgGrad-${id})`}
          filter={`url(#fgShadow-${id})`}
          stroke="rgba(160,90,50,0.35)"
          strokeWidth="0.8"
        />

        {/* Side sheen */}
        <rect
          x={w * 0.15}
          y={h * 0.05}
          width={w * 0.3}
          height={h * 0.7}
          rx={w * 0.15}
          fill={`url(#fgSheen-${id})`}
        />

        {/* Knuckle lines — 2 subtle lines */}
        {!isThumb && (
          <>
            <line
              x1={w * 0.18}
              y1={h * 0.52}
              x2={w * 0.82}
              y2={h * 0.52}
              stroke="rgba(160,90,50,0.2)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <line
              x1={w * 0.22}
              y1={h * 0.68}
              x2={w * 0.78}
              y2={h * 0.68}
              stroke="rgba(160,90,50,0.15)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Fingernail */}
        <ellipse
          cx={w / 2}
          cy={h * (isThumb ? 0.18 : 0.14)}
          rx={w * 0.32}
          ry={h * (isThumb ? 0.1 : 0.08)}
          fill="rgba(255,230,210,0.55)"
          stroke="rgba(200,150,120,0.3)"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}

// ─── SVG Palm ─────────────────────────────────────────────────────────────────

function SvgPalm({
  elRef,
  mirror,
  id,
}: {
  elRef: (el: HTMLDivElement | null) => void;
  mirror: boolean;
  id: string;
}) {
  return (
    <div
      ref={elRef}
      className="absolute pointer-events-none"
      style={{ transform: mirror ? "scaleX(-1)" : undefined }}
    >
      <svg
        id={id}
        width="100%"
        height="100%"
        viewBox="0 0 100 80"
        preserveAspectRatio="none"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`palmGrad-${id}`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#eebc90" />
            <stop offset="50%" stopColor="#dca06a" />
            <stop offset="100%" stopColor="#c07a48" />
          </linearGradient>
          <filter id={`palmShadow-${id}`}>
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="rgba(0,0,0,0.45)" />
          </filter>
        </defs>

        {/* Palm body — slightly curved trapezoid via path */}
        <path
          d="M 5,8 Q 5,0 14,0 L 86,0 Q 95,0 95,8 L 98,72 Q 98,80 88,80 L 12,80 Q 2,80 2,72 Z"
          fill={`url(#palmGrad-${id})`}
          filter={`url(#palmShadow-${id})`}
          stroke="rgba(160,90,50,0.3)"
          strokeWidth="0.8"
        />

        {/* Sheen on palm */}
        <path
          d="M 20,2 Q 15,0 30,0 L 65,0 Q 75,0 72,5 L 68,30 Q 65,35 50,34 L 28,30 Q 18,26 20,2 Z"
          fill="rgba(255,255,255,0.18)"
        />

        {/* Knuckle crease at top */}
        <path
          d="M 12,8 Q 50,4 88,8"
          fill="none"
          stroke="rgba(160,90,50,0.15)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// ─── Press animation on finger ────────────────────────────────────────────────

function pressFingerSvg(el: HTMLDivElement | null) {
  const svg = el?.querySelector<SVGElement>(".finger-svg");
  if (!svg) return;
  svg.style.transition = "transform 100ms cubic-bezier(0.3,1.4,0.4,1)";
  svg.style.transform = "translateY(5px) scaleY(0.92)";
  setTimeout(() => {
    svg.style.transform = "";
  }, 120);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Hands({ stageRef, pressedCode, pressId, enabled }: HandsProps) {
  const fingerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const palmLeftRef = useRef<HTMLDivElement | null>(null);
  const palmRightRef = useRef<HTMLDivElement | null>(null);
  const homePosRef = useRef<Record<string, { left: number; top: number }>>({});
  const idleTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function keyBox(stage: HTMLElement, code: string) {
    const keyEl = stage.querySelector<HTMLElement>(`[data-code="${CSS.escape(code)}"]`);
    if (!keyEl) return null;
    const kr = keyEl.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    return {
      left: kr.left - sr.left + kr.width / 2 - FINGER_W / 2,
      top: kr.top - sr.top - 6,
      keyRect: kr,
    };
  }

  function applyFingerPos(fingerKey: string, pos: { left: number; top: number }, rotate = true) {
    const el = fingerRefs.current[fingerKey];
    if (!el) return;
    el.style.left = `${pos.left}px`;
    el.style.top = `${pos.top}px`;
    if (rotate) el.style.transform = `rotate(${IDLE_ROTATION[fingerKey] ?? 0}deg)`;
  }

  function layout() {
    const stage = stageRef.current;
    if (!stage) return;

    for (const fingerKey of ALL_FINGERS) {
      if (fingerKey === "L1" || fingerKey === "R1") continue;
      const home = FINGER_HOME_KEY[fingerKey];
      const box = home && keyBox(stage, home);
      if (!box) continue;
      homePosRef.current[fingerKey] = { left: box.left, top: box.top };
      applyFingerPos(fingerKey, box);
    }

    const spaceBox = keyBox(stage, " ") ?? keyBox(stage, "space");
    if (spaceBox) {
      const leftThumb = { left: spaceBox.left - 55, top: spaceBox.top - 6 };
      const rightThumb = { left: spaceBox.left + 65, top: spaceBox.top - 6 };
      homePosRef.current.L1 = leftThumb;
      homePosRef.current.R1 = rightThumb;
      applyFingerPos("L1", leftThumb);
      applyFingerPos("R1", rightThumb);
    }

    // Position palms
    const leftHome = ["L5", "L4", "L3", "L2"].map((f) => homePosRef.current[f]).filter(Boolean);
    const rightHome = ["R2", "R3", "R4", "R5"].map((f) => homePosRef.current[f]).filter(Boolean);

    const placePalm = (el: HTMLDivElement | null, homes: { left: number; top: number }[]) => {
      if (!el || homes.length === 0) return;
      const minLeft = Math.min(...homes.map((h) => h.left)) - 14;
      const maxRight = Math.max(...homes.map((h) => h.left + FINGER_W)) + 14;
      const top = Math.max(...homes.map((h) => h.top)) + FINGER_H * 0.6;
      el.style.left = `${minLeft}px`;
      el.style.width = `${maxRight - minLeft}px`;
      el.style.top = `${top}px`;
      el.style.height = "68px";
    };
    placePalm(palmLeftRef.current, leftHome);
    placePalm(palmRightRef.current, rightHome);
  }

  useEffect(() => {
    if (!enabled) return;
    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !pressedCode) return;
    const stage = stageRef.current;
    if (!stage) return;
    const fingerKey = FINGER_MAP[pressedCode];
    if (!fingerKey) return;

    if (fingerKey === "THUMB") {
      pressFingerSvg(fingerRefs.current.L1);
      pressFingerSvg(fingerRefs.current.R1);
      return;
    }

    const el = fingerRefs.current[fingerKey];
    const box = keyBox(stage, pressedCode);
    if (!el || !box) return;

    el.style.left = `${box.left}px`;
    el.style.top = `${box.top}px`;
    pressFingerSvg(el);

    if (idleTimers.current[fingerKey]) clearTimeout(idleTimers.current[fingerKey]);
    idleTimers.current[fingerKey] = setTimeout(() => {
      const home = homePosRef.current[fingerKey];
      if (home) applyFingerPos(fingerKey, home, false);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressId]);

  if (!enabled) return null;

  return (
    <div
      className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none z-[2]"
      style={{ opacity: 0.88 }}
    >
      <SvgPalm
        id="palm-left"
        elRef={(el) => (palmLeftRef.current = el)}
        mirror={false}
      />
      <SvgPalm
        id="palm-right"
        elRef={(el) => (palmRightRef.current = el)}
        mirror
      />
      {ALL_FINGERS.map((id) => (
        <SvgFinger
          key={id}
          id={id}
          elRef={(el) => (fingerRefs.current[id] = el)}
        />
      ))}
    </div>
  );
}
