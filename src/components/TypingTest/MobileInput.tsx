"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Phones don't fire usable keydown events for a page that has no focused field,
 * and they won't raise the on-screen keyboard at all. So on touch devices we park
 * an invisible input over the test: tapping it opens the keyboard, and we turn the
 * value changes it produces back into the same typeChar/backspace calls the
 * desktop key handler makes.
 */
export function MobileInput({
  onChar,
  onBackspace,
  disabled,
}: {
  onChar: (ch: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const prevRef = useRef("");
  const [isTouch, setIsTouch] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setIsTouch(
      typeof window !== "undefined" &&
        (("ontouchstart" in window) || navigator.maxTouchPoints > 0)
    );
  }, []);

  if (!isTouch) return null;

  return (
    <div className="md:hidden w-full max-w-3xl mx-auto mt-4">
      <input
        ref={ref}
        // Nothing here should help the user: no autocorrect, no capitalisation,
        // no suggestions - all of them would corrupt the keystroke stream.
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        disabled={disabled}
        value={prevRef.current}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const next = e.target.value;
          const prev = prevRef.current;

          if (next.length < prev.length) {
            for (let i = 0; i < prev.length - next.length; i++) onBackspace();
          } else {
            for (const ch of next.slice(prev.length)) onChar(ch);
          }

          // Keep the field short so the caret never scrolls out of reach.
          prevRef.current = next.length > 40 ? "" : next;
          e.target.value = prevRef.current;
        }}
        onKeyDown={(e) => {
          // Some keyboards send a real Backspace on an already-empty field.
          if (e.key === "Backspace" && prevRef.current.length === 0) onBackspace();
        }}
        className="w-full bg-panel2 border-2 border-border text-text px-3 py-3 font-mono text-sm rounded-none focus:outline-none focus:border-accent"
        placeholder={focused ? "" : "Tap here to start typing"}
      />
      <p className="text-dim text-xs font-mono mt-1.5">
        Typing on a phone? Tap the box above to bring up your keyboard.
      </p>
    </div>
  );
}
