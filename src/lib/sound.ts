"use client";

// Tiny synthesized click/error/finish sounds via WebAudio - no audio assets needed.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function blip(freq: number, durationMs: number, type: OscillatorType, gain: number) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + durationMs / 1000);
  osc.connect(g).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + durationMs / 1000);
}

export function playKeySound() {
  blip(620 + Math.random() * 80, 35, "square", 0.05);
}

export function playErrorSound() {
  blip(160, 90, "sawtooth", 0.06);
}

export function playFinishSound() {
  const audio = getCtx();
  if (!audio) return;
  [523, 659, 784].forEach((f, i) => {
    setTimeout(() => blip(f, 140, "sine", 0.07), i * 90);
  });
}
