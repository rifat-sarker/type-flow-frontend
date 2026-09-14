"use client";

import { useEffect, useRef, RefObject } from "react";
import { FINGER_MAP } from "@/lib/fingerMap";

interface HandsProps {
  stageRef: RefObject<HTMLDivElement>;
  pressedCode: string | null;
  pressId: number;
  enabled: boolean;
}

function FingerGroup({
  finger,
  x,
  y,
  w,
  h,
  rotate,
}: {
  finger: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: string;
}) {
  return (
    <g data-finger={finger} transform={rotate}>
      <g className="finger-inner">
        <rect x={x} y={y} width={w} height={h} className="fill-accent/10 stroke-accent/50" strokeWidth={1.5} />
      </g>
    </g>
  );
}

function HandSvg({ mirror }: { mirror: boolean }) {
  return (
    <svg
      viewBox="0 0 190 190"
      className="w-full h-full overflow-visible"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <rect x={14} y={118} width={162} height={64} className="fill-accent/10 stroke-accent/50" strokeWidth={1.5} />
      <FingerGroup finger="5" x={18} y={62} w={24} h={68} />
      <FingerGroup finger="4" x={48} y={40} w={26} h={92} />
      <FingerGroup finger="3" x={80} y={24} w={26} h={108} />
      <FingerGroup finger="2" x={112} y={40} w={26} h={92} />
      <FingerGroup finger="1" x={132} y={108} w={46} h={26} rotate="rotate(28 132 121)" />
    </svg>
  );
}

function pulseFinger(hand: HTMLDivElement | null, fingerNum: string) {
  if (!hand) return;
  const inner = hand.querySelector<SVGGElement>(`[data-finger="${fingerNum}"] .finger-inner`);
  if (!inner) return;
  inner.style.transition = "transform 130ms cubic-bezier(.3,1.4,.4,1)";
  inner.style.transform = "translateY(20px) scaleY(0.92)";
  setTimeout(() => {
    inner.style.transform = "";
  }, 130);
}

export function Hands({ stageRef, pressedCode, pressId, enabled }: HandsProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const idleTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!enabled || !pressedCode) return;
    const fingerKey = FINGER_MAP[pressedCode];
    if (!fingerKey) return;
    const stage = stageRef.current;
    if (!stage) return;

    if (fingerKey === "THUMB") {
      pulseFinger(leftRef.current, "1");
      pulseFinger(rightRef.current, "1");
      return;
    }

    const hand = fingerKey[0] === "L" ? leftRef.current : rightRef.current;
    const fingerNum = fingerKey[1];
    if (!hand) return;

    let dx = 0;
    const keyEl = stage.querySelector<HTMLElement>(`[data-code="${CSS.escape(pressedCode)}"]`);
    if (keyEl) {
      const kr = keyEl.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const keyCenter = (kr.left + kr.right) / 2 - sr.left;
      dx = Math.max(-70, Math.min(70, keyCenter - sr.width / 2));
    }
    hand.style.transition = "transform 200ms cubic-bezier(.25,.8,.35,1)";
    hand.style.transform = `translateX(${dx * 0.35}px)`;
    hand.classList.remove("floaty");
    pulseFinger(hand, fingerNum);

    const timerKey = fingerKey[0];
    if (idleTimers.current[timerKey]) clearTimeout(idleTimers.current[timerKey]);
    idleTimers.current[timerKey] = setTimeout(() => {
      hand.style.transform = "";
      hand.classList.add("floaty");
    }, 900);
    // pressId drives re-triggering; other values read fresh from closure each call
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressId]);

  if (!enabled) return null;

  return (
    <div className="absolute left-0 right-0 bottom-0 h-[150px] pointer-events-none z-[2]">
      <div ref={leftRef} className="absolute bottom-0 w-[190px] h-[150px] left-[14%] floaty">
        <HandSvg mirror={false} />
      </div>
      <div ref={rightRef} className="absolute bottom-0 w-[190px] h-[150px] right-[14%] floaty">
        <HandSvg mirror />
      </div>
    </div>
  );
}
