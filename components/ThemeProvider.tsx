"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeId = "light" | "dark";
type ThemeContextValue = { theme: ThemeId; setTheme: (theme: ThemeId) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "okutijobs-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("light");
  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "dark" || saved === "light") setThemeState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = "minimal";
    document.documentElement.dataset.mode = theme;
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);
  const value = useMemo(() => ({ theme, setTheme: setThemeState }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return context;
}

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return <button className="dark-mode-toggle" type="button" onClick={() => setTheme(dark ? "light" : "dark")} aria-pressed={dark} aria-label={dark ? "Mudar para modo claro" : "Mudar para modo escuro"} title={dark ? "Modo claro" : "Modo escuro"}>{dark ? "☀" : "◐"}<span>{dark ? "Claro" : "Escuro"}</span></button>;
}
