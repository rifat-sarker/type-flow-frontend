"use client";

import { useTheme } from "@/lib/theme-context";

/**
 * A single obvious dark/light switch, separate from the accent-colour swatch
 * picker - the swatch dropdown technically included a light theme ("paper") but
 * nothing about it read as "here's a dark/light toggle" at a glance.
 */
export function ModeToggle() {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === "dark";

  return (
    <button
      onClick={toggleMode}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-8 h-8 flex items-center justify-center border-2 border-border hover:border-dim transition-colors text-dim hover:text-text"
    >
      {isDark ? (
        // Sun - shown when currently dark, click to go light.
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="8" cy="8" r="3.2" />
          <path
            d="M8 0.8v2M8 13.2v2M15.2 8h-2M2.8 8h-2M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4M13.1 13.1l-1.4-1.4M4.3 4.3L2.9 2.9"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Moon - shown when currently light, click to go dark.
        <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.5 9.5A6 6 0 116.5 2.5a5 5 0 107 7z" />
        </svg>
      )}
    </button>
  );
}
