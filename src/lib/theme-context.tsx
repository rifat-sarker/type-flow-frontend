"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

export const THEMES = ["sunset", "forest", "azure", "paper"] as const;
export type Theme = (typeof THEMES)[number];
export type Mode = "light" | "dark";

const STORAGE_KEY = "typeflow_theme";
const LAST_DARK_KEY = "typeflow_last_dark_theme";
const DEFAULT_THEME: Theme = "sunset";

// Only "paper" is a light background - everything else in THEMES is dark, just
// with a different accent colour.
function modeOf(t: Theme): Mode {
  return t === "paper" ? "light" : "dark";
}

interface ThemeContextValue {
  theme: Theme;
  mode: Mode;
  setTheme: (t: Theme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  mode: "dark",
  setTheme: () => {},
  toggleMode: () => {},
});

// Runs before paint (see the inline <script> in layout.tsx) so this just keeps
// React's state in sync with whatever the script already applied to <html>.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (current && THEMES.includes(current)) setThemeState(current);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
      // Track the last non-light theme so the mode toggle can restore your actual
      // colour choice (not just a hardcoded default) when you switch back to dark.
      if (modeOf(t) === "dark") localStorage.setItem(LAST_DARK_KEY, t);
    } catch {
      /* private mode / storage disabled - theme just won't persist */
    }
  }, []);

  const toggleMode = useCallback(() => {
    if (modeOf(theme) === "light") {
      let lastDark: Theme = DEFAULT_THEME;
      try {
        const stored = localStorage.getItem(LAST_DARK_KEY) as Theme | null;
        if (stored && THEMES.includes(stored) && modeOf(stored) === "dark") lastDark = stored;
      } catch {
        /* ignore */
      }
      setTheme(lastDark);
    } else {
      setTheme("paper");
    }
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, mode: modeOf(theme), setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Inlined into <head> as a raw string (not imported) so it can run synchronously
// before first paint, avoiding a flash of the default theme.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("${STORAGE_KEY}");
    var valid = ${JSON.stringify(THEMES)};
    if (t && valid.indexOf(t) !== -1) {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();
`;
