"use client";

import { useMemo, useState } from "react";

type Match = { score: number; reasons: string[]; gaps: string[] } | null;
type ApplicationCard = {
  application: { id: string; status: string; created_at: string };
  candidate: {
    current_title: string | null; headline: string | null; municipality: string | null; province: string | null;
    academic_level: string | null; study_field: string | null; seniority_level: string | null;
    skills: unknown; languages: unknown; certifications: unknown; experience: unknown;
    availability: string | null; preferred_work_mode: string | null;
  } | undefined;
  profile: { full_name: string | null } | undefined;
  jobTitle: string;
  match: Match;
  document: { original_name: string } | undefined;
  cvUrl: string | null;
};

type Props = { cards: ApplicationCard[] };
const list = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const text = (card: ApplicationCard) => {
  const c = card.candidate;
  return [c?.current_title, c?.headline, c?.municipality, c?.province, c?.academic_level, c?.study_field, c?.seniority_level, c?.availability, c?.preferred_work_mode, ...list(c?.skills), ...list(c?.languages), ...list(c?.certifications), ...list(c?.experience)].filter(Boolean).join(" ").toLocaleLowerCase();
};
const years = (card: ApplicationCard) => Math.max(0, ...list(card.candidate?.experience).flatMap((value) => [...value.matchAll(/(\d{1,2})\s*(?:anos?|years?)/gi)].map((match) => Number(match[1]))));

export function ReceivedApplicationsList({ cards }: Props) {
  const [minimum, setMinimum] = useState("0");
  const [skill, setSkill] = useState("");
  const [language, setLanguage] = useState("");
  const [minExperience, setMinExperience] = useState("0");
  const [status, setStatus] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [job, setJob] = useState("");
  const [driving, setDriving] = useState("");
  const [passport, setPassport] = useState("");
  const [maritime, setMaritime] = useState("");
  const [excel, setExcel] = useState("");
  const [primavera, setPrimavera] = useState("");
  const [immediate, setImmediate] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => cards.filter((card) => {
    const c = card.candidate;
    const haystack = text(card);
    const score = card.match?.score ?? 0;
    const flag = (value: string, terms: string[]) => !value || (value === "yes" ? terms.some((term) => haystack.includes(term)) : !terms.some((term) => haystack.includes(term)));
    const immediateTerms = ["imediat", "immediate", "já", "ja", "disponível agora", "available now"];
    return score >= Number(minimum) && (!skill || haystack.includes(skill.toLocaleLowerCase().trim())) && (!language || list(c?.languages).some((value) => value.toLocaleLowerCase().includes(language.toLocaleLowerCase().trim()))) && years(card) >= Number(minExperience) && (!status || card.application.status === status) && (!workMode || (c?.preferred_work_mode ?? "").toLocaleLowerCase().includes(workMode.toLocaleLowerCase())) && (!job || card.jobTitle === job) && flag(driving, ["carta de condução", "carta de conducao", "driving license", "driver"]) && flag(passport, ["passaporte", "passport"]) && flag(maritime, ["marítim", "maritim", "maritime", "porto", "portuári", "portuari"]) && flag(excel, ["excel", "microsoft office"]) && flag(primavera, ["primavera", "erp primavera"]) && flag(immediate, immediateTerms);
  }), [cards, minimum, skill, language, minExperience, status, workMode, job, driving, passport, maritime, excel, primavera, immediate]);
  const jobs = Array.from(new Set(cards.map((card) => card.jobTitle))).sort();
  return <section className="received-applications-manager" aria-label="Filtros de candidaturas recebidas">
    <div className="received-filter-header"><div><p className="eyebrow">Pesquisa avançada</p><h2>Filtrar candidatos recebidos.</h2><p>Combine critérios como os do Banco de Talentos para encontrar rapidamente os perfis mais alinhados.</p></div><strong>{filtered.length} de {cards.length}</strong></div>
    <button className="received-filter-mobile-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Fechar filtros" : "Abrir filtros avançados"} <span>☷</span></button>
    <div className={`received-filters${open ? " is-open" : ""}`}>
      <label><span>Compatibilidade mínima</span><select value={minimum} onChange={(e) => setMinimum(e.target.value)}><option value="0">Qualquer compatibilidade</option><option value="50">50% ou mais</option><option value="60">60% ou mais</option><option value="70">70% ou mais</option><option value="80">80% ou mais</option><option value="90">90% ou mais</option></select></label>
      <label><span>Competência, formação ou certificação</span><input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Ex.: Excel, Primavera, liderança" /></label>
      <label><span>Idioma</span><input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Ex.: Inglês" /></label>
      <label><span>Experiência mínima</span><select value={minExperience} onChange={(e) => setMinExperience(e.target.value)}><option value="0">Qualquer experiência</option><option value="1">1+ ano</option><option value="3">3+ anos</option><option value="5">5+ anos</option><option value="8">8+ anos</option><option value="10">10+ anos</option></select></label>
      <label><span>Estado da candidatura</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os estados</option><option value="pending">Pendente</option><option value="reviewing">Em análise</option><option value="shortlisted">Pré-seleccionado</option><option value="interview">Entrevista</option><option value="rejected">Não seleccionado</option></select></label>
      <label><span>Regime de trabalho</span><select value={workMode} onChange={(e) => setWorkMode(e.target.value)}><option value="">Todos os regimes</option><option value="presencial">Presencial</option><option value="híbrido">Híbrido</option><option value="remoto">Remoto</option><option value="offshore">Offshore</option></select></label>
      <label><span>Vaga</span><select value={job} onChange={(e) => setJob(e.target.value)}><option value="">Todas as vagas</option>{jobs.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label><span>Carta de condução</span><select value={driving} onChange={(e) => setDriving(e.target.value)}><option value="">Todos</option><option value="yes">Tem</option><option value="no">Não tem</option></select></label>
      <label><span>Passaporte</span><select value={passport} onChange={(e) => setPassport(e.target.value)}><option value="">Todos</option><option value="yes">Tem</option><option value="no">Não tem</option></select></label>
      <label><span>Experiência marítima</span><select value={maritime} onChange={(e) => setMaritime(e.target.value)}><option value="">Todos</option><option value="yes">Tem</option><option value="no">Não tem</option></select></label>
      <label><span>Excel</span><select value={excel} onChange={(e) => setExcel(e.target.value)}><option value="">Todos</option><option value="yes">Tem</option><option value="no">Não tem</option></select></label>
      <label><span>Primavera</span><select value={primavera} onChange={(e) => setPrimavera(e.target.value)}><option value="">Todos</option><option value="yes">Tem</option><option value="no">Não tem</option></select></label>
      <label><span>Disponibilidade imediata</span><select value={immediate} onChange={(e) => setImmediate(e.target.value)}><option value="">Todos</option><option value="yes">Disponível já</option><option value="no">Outra disponibilidade</option></select></label>
      <button type="button" className="received-filter-clear" onClick={() => { setMinimum("0"); setSkill(""); setLanguage(""); setMinExperience("0"); setStatus(""); setWorkMode(""); setJob(""); setDriving(""); setPassport(""); setMaritime(""); setExcel(""); setPrimavera(""); setImmediate(""); }}>Repor filtros</button>
    </div>
    {filtered.length ? <div className="applications-grid">{filtered.map(({ application, candidate, profile, jobTitle, match, document, cvUrl }) => <article className="received-application" key={application.id}><div className="application-card-top"><span className="job-tag">{application.status}</span><time dateTime={application.created_at}>{new Date(application.created_at).toLocaleDateString("pt-PT")}</time></div><h2>{profile?.full_name || "Candidato"}</h2><p className="received-role">{candidate?.current_title || candidate?.headline || "Perfil profissional"}</p><p className="received-job">Candidatura para: <strong>{jobTitle}</strong></p><p className="received-meta">{[candidate?.municipality, candidate?.province, candidate?.academic_level, candidate?.study_field].filter(Boolean).join(" · ") || "Perfil ainda em preenchimento"}</p>{match ? <div className="ats-match"><strong>{match.score}% Match Score</strong><span>{match.reasons.slice(0, 3).join(" · ") || "A rever"}</span>{match.gaps.length ? <small>{match.gaps.slice(0, 2).join(" · ")}</small> : null}</div> : null}{document && cvUrl ? <a className="button button-orange" href={cvUrl} target="_blank" rel="noreferrer">Ver CV privado <span>↗</span></a> : <span className="document-pending">CV ainda não carregado</span>}</article>)}</div> : <div className="empty-state"><h2>Nenhum candidato corresponde aos filtros.</h2><p>Experimente reduzir a compatibilidade mínima ou remover uma competência.</p></div>}
  </section>;
}
