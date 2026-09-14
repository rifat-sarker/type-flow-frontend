"use client";

import { useEffect, useRef, useState } from "react";
import { KB_ROWS } from "@/lib/fingerMap";

interface KeyboardProps {
  pressedCode: string | null;
  pressId: number;
}

function widthClass(w?: string): string {
  switch (w) {
    case "w15":
      return "flex-[1.5]";
    case "w175":
      return "flex-[1.75]";
    case "w2":
      return "flex-[2]";
    case "w225":
      return "flex-[2.25]";
    case "w275":
      return "flex-[2.75]";
    case "wspace":
      return "flex-[6.5]";
    default:
      return "flex-1";
  }
}

export function Keyboard({ pressedCode, pressId }: KeyboardProps) {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pressedCode) return;
    setActiveCode(pressedCode);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActiveCode(null), 110);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // pressId (not just pressedCode) drives re-triggering for repeated key presses
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressId]);

  return (
    <div className="relative z-[1] bg-panel border-2 border-border p-3">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5 mb-1.5 last:mb-0">
          {row.map(([label, code, w], ki) => (
            <div
              key={ki}
              data-code={code}
              className={`h-9 flex items-center justify-center text-[10px] font-mono font-medium border transition-colors select-none ${widthClass(
                w
              )} ${
                activeCode === code
                  ? "bg-accent text-bg border-accent"
                  : "bg-panel2 text-dim border-border"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
