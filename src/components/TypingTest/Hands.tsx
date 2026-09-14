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

// A skin tone reads as an actual hand regardless of the active site theme, unlike
// tying it to --c-accent (which is red in one theme, green in another).
const SKIN_FILL = "#d9ac82";
const SKIN_STROKE = "#8a5f3c";

const FINGER_W = 22;
const FINGER_H = 62;
// Cosmetic idle splay per finger (degrees) - purely visual, independent of where a
// finger is actually reaching to, so the hand still looks like a relaxed hand at rest.
const IDLE_ROTATION: Record<string, number> = {
  L5: -16,
  L4: -6,
  L3: 2,
  L2: 10,
  L1: 40,
  R2: -10,
  R3: -2,
  R4: 6,
  R5: 16,
  R1: -40,
};
const ALL_FINGERS = Object.keys(IDLE_ROTATION);

function Finger({ id, elRef }: { id: string; elRef: (el: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={elRef}
      data-finger={id}
      className="absolute pointer-events-none"
      style={{ width: FINGER_W, height: FINGER_H, transition: "left 150ms cubic-bezier(.25,.8,.35,1), top 150ms cubic-bezier(.25,.8,.35,1)" }}
    >
      <div
        className="finger-inner w-full h-full rounded-full"
        style={{ background: SKIN_FILL, border: `1.5px solid ${SKIN_STROKE}` }}
      >
        <div
          className="absolute rounded-full opacity-60"
          style={{
            background: "#c99a6e",
            width: FINGER_W * 0.6,
            height: FINGER_W * 0.75,
            left: FINGER_W * 0.2,
            top: FINGER_W * 0.28,
          }}
        />
      </div>
    </div>
  );
}

function Palm({ elRef, mirror }: { elRef: (el: HTMLDivElement | null) => void; mirror: boolean }) {
  return (
    <div
      ref={elRef}
      className="absolute rounded-[32px] pointer-events-none"
      style={{
        background: SKIN_FILL,
        border: `1.5px solid ${SKIN_STROKE}`,
        boxShadow: "0 6px 10px rgba(0,0,0,0.35)",
        transform: mirror ? "scaleX(-1)" : undefined,
      }}
    />
  );
}

function pulseFinger(el: HTMLDivElement | null) {
  const inner = el?.querySelector<HTMLDivElement>(".finger-inner");
  if (!inner) return;
  inner.style.transition = "transform 130ms cubic-bezier(.3,1.4,.4,1)";
  inner.style.transform = "translateY(8px) scaleY(0.86)";
  setTimeout(() => {
    inner.style.transform = "";
  }, 130);
}

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
      top: kr.top - sr.top - 8,
      keyRect: kr,
      stageRect: sr,
    };
  }

  function applyFingerPos(fingerKey: string, pos: { left: number; top: number }, rotate = true) {
    const el = fingerRefs.current[fingerKey];
    if (!el) return;
    el.style.left = `${pos.left}px`;
    el.style.top = `${pos.top}px`;
    if (rotate) el.style.transform = `rotate(${IDLE_ROTATION[fingerKey]}deg)`;
  }

  function layout() {
    const stage = stageRef.current;
    if (!stage) return;

    for (const fingerKey of ALL_FINGERS) {
      if (fingerKey === "L1" || fingerKey === "R1") continue; // thumbs anchor to space, handled below
      const home = FINGER_HOME_KEY[fingerKey];
      const box = home && keyBox(stage, home);
      if (!box) continue;
      homePosRef.current[fingerKey] = { left: box.left, top: box.top };
      applyFingerPos(fingerKey, box);
    }

    const spaceBox = keyBox(stage, " ") ?? keyBox(stage, "space");
    if (spaceBox) {
      const leftThumb = { left: spaceBox.left - 60, top: spaceBox.top - 10 };
      const rightThumb = { left: spaceBox.left + 60, top: spaceBox.top - 10 };
      homePosRef.current.L1 = leftThumb;
      homePosRef.current.R1 = rightThumb;
      applyFingerPos("L1", leftThumb);
      applyFingerPos("R1", rightThumb);
    }

    // Anchor each palm just under its own four fingers' home position, spanning wide
    // enough that small per-finger reaches never visually detach it from the hand.
    const leftHome = ["L5", "L4", "L3", "L2"].map((f) => homePosRef.current[f]).filter(Boolean);
    const rightHome = ["R2", "R3", "R4", "R5"].map((f) => homePosRef.current[f]).filter(Boolean);
    const placePalm = (el: HTMLDivElement | null, homes: { left: number; top: number }[]) => {
      if (!el || homes.length === 0) return;
      const minLeft = Math.min(...homes.map((h) => h.left)) - 20;
      const maxRight = Math.max(...homes.map((h) => h.left + FINGER_W)) + 20;
      const top = Math.max(...homes.map((h) => h.top)) + FINGER_H * 0.55;
      el.style.left = `${minLeft}px`;
      el.style.width = `${maxRight - minLeft}px`;
      el.style.top = `${top}px`;
      el.style.height = "72px";
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
      pulseFinger(fingerRefs.current.L1);
      pulseFinger(fingerRefs.current.R1);
      return;
    }

    const el = fingerRefs.current[fingerKey];
    const box = keyBox(stage, pressedCode);
    if (!el || !box) return;

    el.style.left = `${box.left}px`;
    el.style.top = `${box.top}px`;
    pulseFinger(el);

    if (idleTimers.current[fingerKey]) clearTimeout(idleTimers.current[fingerKey]);
    idleTimers.current[fingerKey] = setTimeout(() => {
      const home = homePosRef.current[fingerKey];
      if (home) applyFingerPos(fingerKey, home, false);
    }, 550);
    // pressId drives re-triggering; other values read fresh from closure each call
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressId]);

  if (!enabled) return null;

  return (
    <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none z-[2]">
      <Palm elRef={(el) => (palmLeftRef.current = el)} mirror={false} />
      <Palm elRef={(el) => (palmRightRef.current = el)} mirror />
      {ALL_FINGERS.map((id) => (
        <Finger key={id} id={id} elRef={(el) => (fingerRefs.current[id] = el)} />
      ))}
    </div>
  );
}
