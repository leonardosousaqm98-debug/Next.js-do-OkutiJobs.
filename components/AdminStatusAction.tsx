"use client";

import { useState } from "react";

const labels: Record<string, string> = { active: "Activo", pending: "Pendente", suspended: "Suspenso", blocked: "Bloqueado", approved: "Aprovada", rejected: "Rejeitada", received: "Recebida", in_review: "Em análise", quoted: "Orçamentada", won: "Ganha", lost: "Perdida", closed: "Encerrada" };

export function AdminStatusAction({ action, id, value, options }: { action: string; id: string; value: string; options: string[] }) {
  const [next, setNext] = useState(value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function save() {
    if (next === value) return;
    setBusy(true); setMessage(null);
    const response = await fetch("/api/admin/manage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, id, value: next }) });
    setBusy(false);
    setMessage(response.ok ? "Guardado" : response.status === 403 ? "MFA necessário" : "Erro");
  }
  return <div className="admin-action"><select value={next} onChange={(event) => setNext(event.target.value)} aria-label="Novo estado">{options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}</select><button type="button" onClick={save} disabled={busy || next === value}>{busy ? "…" : "Guardar"}</button>{message ? <small role="status">{message}</small> : null}</div>;
}
