"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorIllustration } from "@/components/ErrorIllustration";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("OkutiJobs application error", error);
  }, [error]);

  return (
    <main className="error-page" role="alert">
      <div className="error-topline">
        <Link className="error-brand" href="/" aria-label="Voltar à página inicial OkutiJobs"><span>O</span> OkutiJobs</Link>
        <span className="error-topcode">ERRO TEMPORÁRIO / 500</span>
      </div>
      <section className="error-content">
        <div className="error-copy">
          <p className="error-eyebrow">Vamos tentar outra vez</p>
          <h1><span>500</span> Algo correu mal.</h1>
          <p className="error-lede">Ocorreu um erro inesperado. Pode tentar novamente ou regressar à página inicial para continuar a explorar a OkutiJobs.</p>
          <div className="error-actions">
            <button className="button button-orange" type="button" onClick={() => reset()}>Tentar novamente <span>↻</span></button>
            <Link className="error-secondary-link" href="/">Ir para o início <span>→</span></Link>
          </div>
        </div>
        <ErrorIllustration code="500" />
      </section>
    </main>
  );
}
