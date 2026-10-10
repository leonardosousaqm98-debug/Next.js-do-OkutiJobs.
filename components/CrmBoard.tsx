"use client";

import { useEffect, useState } from "react";

type Stage = { id: string; name: string; position: number; color: string };
type Deal = {
  id: string;
  title: string;
  source: string;
  estimated_value: number;
  currency: string;
  stage_id: string;
  company?: { id: string; name: string; industry?: string; province?: string; municipality?: string } | null;
  contact?: { full_name?: string; email?: string; phone?: string } | null;
};

export function CrmBoard({ standalone = false }: { standalone?: boolean }) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/crm")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) {
          setStages(data.stages ?? []);
          setDeals(data.deals ?? []);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar o CRM.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function move(dealId: string, stageId: string) {
    const previous = deals;
    setDeals((rows) => rows.map((deal) => deal.id === dealId ? { ...deal, stage_id: stageId } : deal));
    const response = await fetch("/api/admin/crm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId, stageId }),
    });
    if (!response.ok) {
      setDeals(previous);
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível mover o negócio.");
    }
  }

  const money = (value: number, currency: string) => new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currency || "AOA",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

  return <main className="admin-crm-page">
    <header className="admin-crm-header">
      <div>
        <a className="text-link" href={standalone ? "/" : "/admin"}>{standalone ? "← OkutiJobs CRM" : "← Super Admin"}</a>
        <p className="eyebrow">Vendas e contas B2B</p>
        <h1>Pipeline comercial.</h1>
        <p>Acompanhe pedidos, propostas e empresas num único fluxo de trabalho.</p>
      </div>
      <a className="button button-orange" href="mailto:comercial@okutijobs.com?subject=CRM%20OkutiJobs">Contactar equipa</a>
    </header>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {loading ? <div className="admin-empty">A carregar o pipeline…</div> : <section className="crm-board" aria-label="Pipeline CRM">
      {stages.map((stage) => {
        const rows = deals.filter((deal) => deal.stage_id === stage.id);
        return <div className="crm-column" key={stage.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragged) void move(dragged, stage.id); setDragged(null); }}>
          <div className="crm-column-head"><div><span className={`crm-stage-dot ${stage.color}`} /> <strong>{stage.name}</strong></div><span>{rows.length}</span></div>
          <div className="crm-column-body">
            {rows.map((deal) => <article className="crm-deal-card" key={deal.id} draggable onDragStart={() => setDragged(deal.id)}>
              <small>{deal.source === "company_signup" ? "Nova conta" : "Pedido comercial"}</small>
              <h2>{deal.title}</h2>
              <strong>{deal.company?.name ?? "Empresa"}</strong>
              <span>{[deal.company?.industry, deal.company?.municipality, deal.company?.province].filter(Boolean).join(" · ") || "Sem localização indicada"}</span>
              {deal.contact?.email && <a href={`mailto:${deal.contact.email}`}>{deal.contact.email}</a>}
              <div className="crm-deal-footer">
                <b>{money(deal.estimated_value, deal.currency)}</b>
                <button type="button" onClick={() => {
                  const target = window.prompt("Novo valor estimado em AOA", String(deal.estimated_value));
                  if (target !== null) void fetch("/api/admin/crm", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dealId: deal.id, stageId: deal.stage_id, estimatedValue: Number(target) }) });
                }}>Editar valor</button>
              </div>
            </article>)}
            {!rows.length && <p className="crm-empty-column">Arraste negócios para aqui</p>}
          </div>
        </div>;
      })}
    </section>}
    <p className="crm-privacy">Área interna · cada acesso exige a confirmação individual do email @okutijobs.com. As decisões comerciais e de recrutamento continuam sujeitas a revisão humana.</p>
  </main>;
}
