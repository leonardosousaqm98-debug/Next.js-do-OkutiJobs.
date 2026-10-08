"use client";

import { useState } from "react";

type Result = { candidateId: string; name: string; score: number; recommendation: "strong_match" | "review" | "low_match"; strengths: string[]; gaps: string[]; interviewTopics: string[] };

export function AiTriageButton({ jobId }: { jobId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  async function run() {
    setBusy(true); setError("");
    const response = await fetch("/api/company/ai-triage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setError(body.error || "Não foi possível concluir a triagem.");
    setResults(body.results || []);
  }
  return <div className="ai-triage-box"><button type="button" className="button button-dark" onClick={run} disabled={busy}>{busy ? "A analisar candidatos…" : "Triar candidatos com IA ↗"}</button>{error ? <p className="form-error" role="alert">{error}</p> : null}{results ? <div className="ai-triage-results"><div className="ai-triage-heading"><strong>Ranking assistido por IA</strong><span>Reveja antes de contactar ou excluir qualquer candidato.</span></div>{results.length ? results.map((result, index) => <article className="ai-triage-result" key={result.candidateId}><div className="ai-triage-rank"><b>#{index + 1}</b><strong>{result.score}%</strong></div><div><h3>{result.name}</h3><span className={`triage-badge ${result.recommendation}`}>{result.recommendation === "strong_match" ? "Forte correspondência" : result.recommendation === "review" ? "Revisão humana" : "Correspondência baixa"}</span><p><b>Pontos fortes:</b> {result.strengths.join(" · ") || "Por confirmar"}</p>{result.gaps.length ? <p className="triage-gap"><b>Lacunas:</b> {result.gaps.join(" · ")}</p> : null}<small><b>Temas para entrevista:</b> {result.interviewTopics.join(" · ") || "A definir"}</small></div></article>) : <p className="empty-state">Ainda não existem candidaturas para esta vaga.</p>}<small className="ai-disclaimer">A IA organiza os dados declarados. A decisão final é sempre da empresa e deve respeitar critérios justos e verificáveis.</small></div> : null}</div>;
}
