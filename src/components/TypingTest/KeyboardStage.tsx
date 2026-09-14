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

export function KeyboardStage({
  pressedCode,
  pressId,
  showKeyboard,
  showHands,
}: KeyboardStageProps) {
  // Hands measure real key positions out of this container, so both have to live
  // under the same positioned ancestor.
  const stageRef = useRef<HTMLDivElement>(null);

  if (!showKeyboard) return null;

  return (
    <div ref={stageRef} className="relative w-full max-w-4xl mx-auto mt-10 hidden md:block">
      <Keyboard
        pressedCode={pressedCode}
        pressId={pressId}
      />
      <Hands
        stageRef={stageRef}
        pressedCode={pressedCode}
        pressId={pressId}
        enabled={showHands}
      />
    </div>
  );
}
