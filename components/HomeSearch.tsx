"use client";

import { FormEvent, useMemo, useState } from "react";

type Opportunity = { company: string; title: string; place: string; tag: string; area: string; slug: string };

export function HomeSearch({ opportunities }: { opportunities: Opportunity[] }) {
  const [term, setTerm] = useState("");
  const [place, setPlace] = useState("");
  const [category, setCategory] = useState("Todas as categorias");
  const [submitted, setSubmitted] = useState(false);
  const categories = useMemo(() => ["Todas as categorias", ...Array.from(new Set(opportunities.map((job) => job.area)))], [opportunities]);
  const matches = useMemo(() => opportunities.filter((job) => {
    const haystack = `${job.title} ${job.company} ${job.area}`.toLowerCase();
    return haystack.includes(term.toLowerCase()) && job.place.toLowerCase().includes(place.toLowerCase()) && (category === "Todas as categorias" || job.area === category);
  }), [category, opportunities, place, term]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => document.getElementById("opportunity-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  return <div className="search-module">
    <form className="search-form" onSubmit={submit}>
      <label><span>O que procura?</span><input value={term} onChange={(event) => { setTerm(event.target.value); setSubmitted(false); }} placeholder="Cargo, competência ou empresa" /></label>
      <label><span>Onde?</span><input value={place} onChange={(event) => { setPlace(event.target.value); setSubmitted(false); }} placeholder="Cidade ou província" /></label>
      <label><span>Categoria</span><select aria-label="Filtrar por categoria" value={category} onChange={(event) => { setCategory(event.target.value); setSubmitted(false); }}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <button className="button button-dark" type="submit">Pesquisar <span>⌕</span></button>
    </form>
    <p className="search-result" aria-live="polite">{submitted ? `${matches.length} oportunidade${matches.length === 1 ? "" : "s"} encontrada${matches.length === 1 ? "" : "s"}` : "Pesquise por função, competência, categoria ou localização."}</p>
    {submitted && <div className="search-match-list" aria-label="Resultados da pesquisa">
      {matches.length ? matches.map((job) => <a className="search-match" href={`/vagas/${job.slug}`} key={job.slug}><span><strong>{job.title}</strong><small>{job.company} · {job.place} · {job.area}</small></span><b>↗</b></a>) : <p className="search-no-match">Não encontrámos vagas com estes critérios. Tente ajustar a pesquisa.</p>}
    </div>}
  </div>;
}
