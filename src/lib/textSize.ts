export type TextSize = "sm" | "md" | "lg" | "xl";

export const TEXT_SIZES: TextSize[] = ["sm", "md", "lg", "xl"];

// Short labels on purpose: "Medium" would collide visually (and for anyone
// scripting against the DOM) with the difficulty selector's own Easy/Medium/Hard,
// which sits in the same config bar.
export const TEXT_SIZE_LABEL: Record<TextSize, string> = {
  sm: "S",
  md: "M",
  lg: "L",
  xl: "XL",
};

export const TEXT_SIZE_FULL_NAME: Record<TextSize, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
  xl: "Extra large",
};

// Tailwind text class + a matching container height (leading-[1.75] * font-size * 3
// lines, rounded up a little) so the 3-line viewport in WordDisplay stays exactly
// 3 lines regardless of which size is picked, instead of clipping a 4th partial line.
export const TEXT_SIZE_CLASS: Record<TextSize, { text: string; height: string }> = {
  sm: { text: "text-xl", height: "h-[116px]" },
  md: { text: "text-3xl", height: "h-[162px]" },
  lg: { text: "text-4xl", height: "h-[194px]" },
  xl: { text: "text-5xl", height: "h-[240px]" },
};

const STORAGE_KEY = "typeflow_textsize";

export function getStoredTextSize(): TextSize {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "sm" || v === "md" || v === "lg" || v === "xl") return v;
  } catch {
    /* ignore */
  }
  return "md";
}

export function setStoredTextSize(size: TextSize): void {
  try {
    localStorage.setItem(STORAGE_KEY, size);
  } catch {
    /* ignore */
  }
}
