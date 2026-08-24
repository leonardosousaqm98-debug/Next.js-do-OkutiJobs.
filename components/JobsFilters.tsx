"use client";

import { useDebouncedCallback } from "use-debounce";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type JobsFiltersProps = {
  areas: string[];
  provinces: string[];
};

const filterOptions = {
  workModel: ["Presencial", "Híbrido", "Remoto"],
  contractType: ["Tempo Inteiro", "Tempo Parcial", "Estágio", "Consultoria/Freelance"],
  seniority: ["Estágio / Júnior", "Pleno", "Sénior", "Direção / Executivo"],
};

export function JobsFilters({ areas, provinces }: JobsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const params = new URLSearchParams(searchParams.toString());

  function updateParam(name: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(name, value); else next.delete(name);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const updateSearch = useDebouncedCallback((value: string) => updateParam("q", value), 350);
  const selected = (name: string) => params.get(name)?.split(",").filter(Boolean) ?? [];

  function toggle(name: string, value: string) {
    const values = selected(name);
    const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
    updateParam(name, next.join(","));
  }

  function clear() {
    router.replace(pathname, { scroll: false });
  }

  const activeCount = Array.from(params.keys()).filter((key) => key !== "page").length;
  const controls = <>
    <label className="jobs-filter-search"><span>Busca global</span><input defaultValue={params.get("q") ?? ""} onChange={(event) => updateSearch(event.target.value)} placeholder="Cargo, empresa ou palavra-chave" /></label>
    <label><span>Área funcional</span><select value={params.get("categoria") ?? ""} onChange={(event) => updateParam("categoria", event.target.value)}><option value="">Todas as áreas</option>{areas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
    <label><span>Província / localização</span><select value={params.get("localizacao") ?? ""} onChange={(event) => updateParam("localizacao", event.target.value)}><option value="">Todas as localizações</option>{provinces.map((province) => <option key={province} value={province}>{province}</option>)}<option value="Remoto">Remoto</option></select></label>
    <fieldset><legend>Modelo de trabalho</legend>{filterOptions.workModel.map((item) => <label className="jobs-check" key={item}><input type="checkbox" checked={selected("modelo").includes(item)} onChange={() => toggle("modelo", item)} />{item}</label>)}</fieldset>
    <fieldset><legend>Tipo de contrato</legend>{filterOptions.contractType.map((item) => <label className="jobs-check" key={item}><input type="checkbox" checked={selected("contrato").includes(item)} onChange={() => toggle("contrato", item)} />{item}</label>)}</fieldset>
    <label><span>Senioridade</span><select value={params.get("senioridade") ?? ""} onChange={(event) => updateParam("senioridade", event.target.value)}><option value="">Todos os níveis</option>{filterOptions.seniority.map((item) => <option key={item}>{item}</option>)}</select></label>
    <div className="jobs-salary-fields"><span>Intervalo salarial (AOA)</span><div><input type="number" min="0" placeholder="Mínimo" value={params.get("salaryMin") ?? ""} onChange={(event) => updateParam("salaryMin", event.target.value)} /><input type="number" min="0" placeholder="Máximo" value={params.get("salaryMax") ?? ""} onChange={(event) => updateParam("salaryMax", event.target.value)} /></div></div>
    <label><span>Ordenar por</span><select value={params.get("sort") ?? "recent"} onChange={(event) => updateParam("sort", event.target.value)}><option value="recent">Mais recentes</option><option value="salary">Maior salário</option><option value="popular">Mais populares</option></select></label>
    {activeCount > 0 && <button className="jobs-clear" type="button" onClick={clear}>Limpar filtros ({activeCount})</button>}
  </>;

  return <section className="jobs-filter-shell"><button className="jobs-filter-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>Filtrar vagas {activeCount > 0 ? `(${activeCount})` : ""}<span>☷</span></button><aside className={open ? "jobs-filter-panel open" : "jobs-filter-panel"}>{controls}</aside></section>;
}
