"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "okutijobs:favourite-jobs";

type JobFavoriteButtonProps = {
  jobId: string;
  title?: string;
  compact?: boolean;
};

function readFavorites() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function JobFavoriteButton({ jobId, title = "vaga", compact = false }: JobFavoriteButtonProps) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    setSaved(readFavorites().includes(jobId));
    setReady(true);
  }, [jobId]);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const favorites = readFavorites();
    const next = favorites.includes(jobId) ? favorites.filter((id) => id !== jobId) : [...favorites, jobId];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setAnnouncement("Não foi possível guardar esta vaga neste navegador.");
      return;
    }
    const nextSaved = next.includes(jobId);
    setSaved(nextSaved);
    window.dispatchEvent(new Event("okutijobs:favorites-changed"));
    setAnnouncement(nextSaved ? `${title} foi guardada nas suas vagas favoritas.` : `${title} foi removida das vagas favoritas.`);
  }

  return <>
    <button type="button" className={`job-favorite${saved ? " is-saved" : ""}${compact ? " compact" : ""}`} onClick={toggle} aria-pressed={saved} aria-label={saved ? `Remover ${title} dos favoritos` : `Guardar ${title} nos favoritos`} disabled={!ready}>
      <span aria-hidden="true">{saved ? "★" : "☆"}</span>{!compact && <span>{saved ? "Favoritada" : "Favoritar"}</span>}
    </button>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
  </>;
}
