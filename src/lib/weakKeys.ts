import { WORD_BANK } from "./wordBank";

export interface WeakKey {
  key: string;
  hits: number;
  misses: number;
  total: number;
  accuracy: number;
}

/**
 * Drill text weighted toward the keys you keep missing: pick words that actually
 * contain them, and fall back to short random clusters of those keys so there's
 * always enough material even when few words match.
 */
export function generateWeakKeyWords(weak: WeakKey[], count = 30): string[] {
  const targets = weak.slice(0, 6).map((w) => w.key).filter((k) => /^[a-z]$/.test(k));
  if (targets.length === 0) return [];

  const targetSet = new Set(targets);
  const scored = WORD_BANK.map((w) => ({
    word: w,
    score: w.split("").filter((c) => targetSet.has(c)).length,
  })).filter((x) => x.score > 0);

  scored.sort((a, b) => b.score / b.word.length - a.score / a.word.length);
  const pool = scored.slice(0, 60).map((x) => x.word);

  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    // Mostly real words, with occasional pure key-clusters for concentrated reps.
    if (pool.length && Math.random() < 0.75) {
      out.push(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      const len = 3 + Math.floor(Math.random() * 3);
      let chunk = "";
      for (let j = 0; j < len; j++) chunk += targets[Math.floor(Math.random() * targets.length)];
      out.push(chunk);
    }
  }
  return out;
}
