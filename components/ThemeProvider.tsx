"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeId = "neon" | "hud" | "minimal" | "steps";
type ThemeContextValue = { theme: ThemeId; setTheme: (theme: ThemeId) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "okutijobs-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("minimal");
  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) as ThemeId | null;
    if (saved && ["neon", "hud", "minimal", "steps"].includes(saved)) setThemeState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
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

const themes: Array<{ id: ThemeId; label: string; short: string }> = [
  { id: "neon", label: "Glassmorphism Neón", short: "Neón" },
  { id: "hud", label: "HUD Cyber-Tech", short: "HUD" },
  { id: "minimal", label: "Minimalista Flutuante", short: "Minimal" },
  { id: "steps", label: "Step-by-Step Interativo", short: "Etapas" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return <div className="theme-switcher" role="group" aria-label="Tema visual da plataforma">
    <span className="theme-switcher-label">Tema</span>
    {themes.map((item) => <button key={item.id} type="button" className={theme === item.id ? "active" : ""} onClick={() => setTheme(item.id)} aria-pressed={theme === item.id} title={item.label}>{item.short}</button>)}
  </div>;
}
