"use client";

import { useRef } from "react";
import { Keyboard } from "./Keyboard";
import { Hands } from "./Hands";

interface KeyboardStageProps {
  pressedCode: string | null;
  pressId: number;
  showKeyboard: boolean;
  showHands: boolean;
}

export function KeyboardStage({ pressedCode, pressId, showKeyboard, showHands }: KeyboardStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  if (!showKeyboard) return null;

  return (
    <div ref={stageRef} className="relative w-full max-w-3xl mx-auto mt-10 hidden md:block">
      <Hands stageRef={stageRef} pressedCode={pressedCode} pressId={pressId} enabled={showHands} />
      <Keyboard pressedCode={pressedCode} pressId={pressId} />
    </div>
  );
}
