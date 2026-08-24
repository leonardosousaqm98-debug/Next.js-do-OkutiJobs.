"use client";

import { useMemo, useState } from "react";

type AdminRow = { module: string; name: string; status: string; detail: string; date: string };

function csvCell(value: string) { return `"${value.replaceAll('"', '""')}"`; }

export default function AdminFilters({ rows }: { rows: AdminRow[] }) {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("all");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => rows.filter((row) => {
    const haystack = `${row.name} ${row.detail}`.toLocaleLowerCase();
    return (!query || haystack.includes(query.toLocaleLowerCase())) && (module === "all" || row.module === module) && (status === "all" || row.status === status);
  }), [module, query, rows, status]);
  const exportCsv = () => {
    const header = ["módulo", "nome", "estado", "detalhe", "data"].map(csvCell).join(",");
    const body = filtered.map((row) => [row.module, row.name, row.status, row.detail, row.date].map(csvCell).join(","));
    const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "okutijobs-relatorio-admin.csv"; anchor.click(); URL.revokeObjectURL(url);
  };
  const modules = [...new Set(rows.map((row) => row.module))];
  const statuses = [...new Set(rows.map((row) => row.status))];
  return <section className="admin-report-tools" aria-label="Filtros e exportação de relatórios"><div><p className="eyebrow">Pesquisa operacional</p><h2>Filtrar e exportar dados.</h2></div><div className="admin-filter-grid"><label>Pesquisar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, vaga ou detalhe" /></label><label>Módulo<select value={module} onChange={(event) => setModule(event.target.value)}><option value="all">Todos os módulos</option>{modules.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Estado<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos os estados</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><div className="admin-filter-actions"><strong>{filtered.length} registos</strong><button type="button" onClick={exportCsv}>Exportar CSV</button></div></div><div className="admin-filter-preview">{filtered.slice(0, 6).map((row) => <span key={`${row.module}-${row.name}-${row.date}`}><b>{row.name}</b><small>{row.module} · {row.status}</small></span>)}</div></section>;
}
