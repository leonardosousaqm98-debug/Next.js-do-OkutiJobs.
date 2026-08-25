"use client";

import { useState } from "react";

type JobShareButtonProps = { title: string; slug?: string; compact?: boolean };

export function JobShareButton({ title, slug, compact = false }: JobShareButtonProps) {
  const [message, setMessage] = useState("");

  async function share(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const url = `${window.location.origin}${slug ? `/vagas/${slug}` : window.location.pathname}`;
    const shareData = { title: `${title} — OkutiJobs`, text: `Veja esta oportunidade na OkutiJobs: ${title}`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setMessage("Partilha iniciada.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setMessage("Link copiado. Já pode enviá-lo a um amigo.");
      } else {
        window.location.href = `mailto:?subject=${encodeURIComponent(`Oportunidade: ${title}`)}&body=${encodeURIComponent(`${shareData.text}\n${url}`)}`;
        setMessage("A abrir o email.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Não foi possível partilhar agora.");
    }
  }

  return <>
    <button type="button" className={`job-share${compact ? " compact" : ""}`} onClick={share} aria-label={`Partilhar a vaga ${title}`}>
      <span aria-hidden="true">↗</span>{!compact && <span>Partilhar</span>}
    </button>
    <span className="sr-only" role="status" aria-live="polite">{message}</span>
  </>;
}
