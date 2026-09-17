import type { Config } from "tailwindcss";

function themeColor(name: string) {
  return `rgb(var(--c-${name}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: themeColor("bg"),
        panel: themeColor("panel"),
        panel2: themeColor("panel2"),
        border: themeColor("border"),
        text: themeColor("text"),
        dim: themeColor("dim"),
        accent: themeColor("accent"),
        success: themeColor("success"),
        danger: themeColor("danger"),
      },
      fontFamily: {
        // CSS vars come from next/font in layout.tsx (self-hosted, no network
        // request at runtime) - the rest of each stack is just the fallback.
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
