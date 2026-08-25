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

function saveFavorites(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    return false;
  }
  return true;
}

export function JobFavoriteButton({ jobId, title = "vaga", compact = false }: JobFavoriteButtonProps) {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const localIds = readFavorites();
      try {
        const response = await fetch("/api/job-favorites", { cache: "no-store" });
        if (response.ok) {
          const payload = await response.json() as { favorites?: unknown };
          const cloudIds = Array.isArray(payload.favorites) ? payload.favorites.filter((item): item is string => typeof item === "string") : [];
          const mergedIds = Array.from(new Set([...cloudIds, ...localIds]));
          await Promise.all(localIds.filter((id) => !cloudIds.includes(id)).map((id) => fetch("/api/job-favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) })));
          if (!cancelled) {
            saveFavorites(mergedIds);
            setCloudReady(true);
            setSaved(mergedIds.includes(jobId));
          }
        } else if (!cancelled) {
          setSaved(localIds.includes(jobId));
        }
      } catch {
        if (!cancelled) setSaved(localIds.includes(jobId));
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void hydrate();
    return () => { cancelled = true; };
  }, [jobId]);

  async function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const previous = readFavorites();
    const next = previous.includes(jobId) ? previous.filter((id) => id !== jobId) : [...previous, jobId];
    const nextSaved = next.includes(jobId);
    if (!saveFavorites(next)) {
      setAnnouncement("Não foi possível guardar esta vaga neste navegador.");
      return;
    }
    setSaved(nextSaved);
    window.dispatchEvent(new Event("okutijobs:favorites-changed"));
    if (cloudReady) {
      try {
        const response = await fetch(nextSaved ? "/api/job-favorites" : `/api/job-favorites?jobId=${encodeURIComponent(jobId)}`, { method: nextSaved ? "POST" : "DELETE", headers: nextSaved ? { "Content-Type": "application/json" } : undefined, body: nextSaved ? JSON.stringify({ jobId }) : undefined });
        if (!response.ok) throw new Error("sync failed");
      } catch {
        saveFavorites(previous);
        setSaved(!nextSaved);
        window.dispatchEvent(new Event("okutijobs:favorites-changed"));
        setAnnouncement("Não foi possível sincronizar esta vaga. Tente novamente.");
        return;
      }
    }
    setAnnouncement(nextSaved ? `${title} foi guardada nas suas vagas favoritas.` : `${title} foi removida das vagas favoritas.`);
  }

  return <>
    <button type="button" className={`job-favorite${saved ? " is-saved" : ""}${compact ? " compact" : ""}`} onClick={toggle} aria-pressed={saved} aria-label={saved ? `Remover ${title} dos favoritos` : `Guardar ${title} nos favoritos`} disabled={!ready}>
      <span aria-hidden="true">{saved ? "★" : "☆"}</span>{!compact && <span>{saved ? "Favoritada" : "Favoritar"}</span>}
    </button>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
  </>;
}
