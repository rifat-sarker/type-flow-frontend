"use client";

import { Keyboard } from "./Keyboard";

interface KeyboardStageProps {
  pressedCode: string | null;
  pressId: number;
  showKeyboard: boolean;
}

export function KeyboardStage({ pressedCode, pressId, showKeyboard }: KeyboardStageProps) {
  if (!showKeyboard) return null;

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-10 hidden md:block">
      <Keyboard pressedCode={pressedCode} pressId={pressId} />
    </div>
  );
}
