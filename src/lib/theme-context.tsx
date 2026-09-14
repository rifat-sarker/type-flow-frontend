"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

export const THEMES = ["sunset", "forest", "azure", "paper"] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "typeflow_theme";
const DEFAULT_THEME: Theme = "sunset";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
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
    } catch {
      /* private mode / storage disabled - theme just won't persist */
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
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
