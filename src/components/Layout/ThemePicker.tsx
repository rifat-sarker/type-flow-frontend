"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, useTheme } from "@/lib/theme-context";

const SWATCH: Record<(typeof THEMES)[number], string> = {
  sunset: "#FF4B2B",
  forest: "#44D67A",
  azure: "#42A5FF",
  paper: "#D63E1E",
};

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        className="w-8 h-8 flex items-center justify-center border-2 border-border hover:border-dim transition-colors"
      >
        <span className="w-3.5 h-3.5" style={{ backgroundColor: SWATCH[theme] }} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-10 bg-panel border-2 border-border p-1.5 flex flex-col gap-1 min-w-[120px]">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTheme(t);
                setOpen(false);
              }}
              className={`flex items-center gap-2 px-2 py-1.5 text-xs font-mono uppercase tracking-wide transition-colors ${
                theme === t ? "bg-panel2 text-text" : "text-dim hover:text-text"
              }`}
            >
              <span className="w-3 h-3 shrink-0" style={{ backgroundColor: SWATCH[t] }} />
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
