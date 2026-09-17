"use client";

// Short buzz on a mistyped key. Only Android Chrome (and a few others) implement
// the Vibration API - iOS Safari does not and never has, so this silently no-ops
// there instead of throwing. Independent of the sound toggle: someone typing with
// sound off may still want the haptic nudge on mistakes.
export function vibrateError() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(35);
  } catch {
    /* some browsers throw if called outside a user gesture - not worth surfacing */
  }
}
