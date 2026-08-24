"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "okutijobs-audience-choice";

type Audience = "candidate" | "company";

export function AudienceChoiceModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Ask on the first visit only; the selected route is remembered for this browser.
    try {
      setOpen(window.localStorage.getItem(STORAGE_KEY) === null);
    } catch {
      setOpen(true);
    }
  }, []);

  function choose(audience: Audience) {
    try {
      window.localStorage.setItem(STORAGE_KEY, audience);
    } catch {
      // The modal remains functional even when storage is unavailable.
    }
    window.location.assign(audience === "candidate" ? "/pagina-candidatos" : "/pagina-empresas");
  }

  function explore() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "explorer");
    } catch {
      // Continue without persistence when browser storage is blocked.
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="audience-backdrop" role="presentation">
      <section className="audience-modal" role="dialog" aria-modal="true" aria-labelledby="audience-title">
        <button className="audience-close" type="button" onClick={explore} aria-label="Fechar e continuar a explorar">×</button>
        <p className="eyebrow">Bem-vindo à OkutiJobs</p>
        <h2 id="audience-title">Qual é o seu objectivo hoje?</h2>
        <p className="audience-lede">Escolha o percurso mais útil para si, sem bloquear a exploração da plataforma.</p>
        <div className="audience-options">
          <button className="audience-option audience-option-primary" type="button" onClick={() => choose("candidate")}>
            <span className="audience-icon" aria-hidden="true">♙</span>
            <strong>Sou candidato</strong>
            <span>Conheça serviços de carreira, crie o seu perfil e encontre novas oportunidades.</span>
            <b>Ver serviços <span aria-hidden="true">→</span></b>
          </button>
          <button className="audience-option" type="button" onClick={() => choose("company")}>
            <span className="audience-icon" aria-hidden="true">▤</span>
            <strong>Sou empregador / empresa</strong>
            <span>Explore recrutamento, Banco de Talentos, avaliações e formações corporativas.</span>
            <b>Conhecer soluções <span aria-hidden="true">→</span></b>
          </button>
        </div>
        <button className="audience-explore" type="button" onClick={explore}>Apenas visitar e explorar a plataforma</button>
      </section>
    </div>
  );
}

export function AudienceChoiceReset() {
  function reset() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
    window.location.reload();
  }

  return <button type="button" className="audience-reset" onClick={reset}>Alterar percurso</button>;
}

export { STORAGE_KEY as AUDIENCE_CHOICE_STORAGE_KEY };
