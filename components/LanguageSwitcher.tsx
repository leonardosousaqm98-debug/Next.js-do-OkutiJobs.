"use client";

import { useEffect, useState } from "react";

const languages = [
  ["pt", "PT"],
  ["en", "EN"],
  ["es", "ES"],
  ["fr", "FR"],
  ["hi", "HI"],
  ["zh", "中文"],
] as const;

export function LanguageSwitcher() {
  const [language, setLanguage] = useState("pt");
  useEffect(() => {
    const saved = window.localStorage.getItem("okutijobs-language");
    if (saved && languages.some(([code]) => code === saved)) setLanguage(saved);
  }, []);
  function change(value: string) {
    setLanguage(value);
    window.localStorage.setItem("okutijobs-language", value);
    document.cookie = `okutijobs-language=${encodeURIComponent(value)};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = value;
    window.dispatchEvent(new CustomEvent("okutijobs-language-change", { detail: value }));
  }
  return <label className="language-switcher"><span className="sr-only">Idioma da plataforma</span><select aria-label="Idioma da plataforma" value={language} onChange={(event) => change(event.target.value)}>{languages.map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label>;
}
