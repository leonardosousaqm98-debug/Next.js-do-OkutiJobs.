"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { JobsFilters } from "@/components/JobsFilters";
import { useEffect, useMemo, useState } from "react";
import { JobFavoriteButton } from "@/components/JobFavoriteButton";

export type Job = { id: string; slug?: string; title: string; company: string; place: string; country?: string | null; city?: string | null; province?: string | null; mode: string; area: string; contract: string; salaryKz?: number | null; experienceYears?: number | null; description?: string; requirements?: string | null };
type Course = { title: string; area: string; level: string; mode: string; duration: string };

const courses: Course[] = [
  { title: "Excel profissional para negócios", area: "Escritório", level: "Intermédio", mode: "Online", duration: "12 horas" },
  { title: "Contabilidade geral e financeira", area: "Contabilidade", level: "Fundamentos", mode: "Híbrido", duration: "20 horas" },
  { title: "Vendas consultivas e negociação", area: "Vendas", level: "Avançado", mode: "Presencial", duration: "16 horas" },
  { title: "Liderança de equipas de alto desempenho", area: "Liderança", level: "Executivo", mode: "Híbrido", duration: "10 horas" },
  { title: "Atendimento ao cliente", area: "Soft Skills", level: "Fundamentos", mode: "Online", duration: "8 horas" },
  { title: "Comunicação profissional", area: "Soft Skills", level: "Intermédio", mode: "Online", duration: "8 horas" },
  { title: "Gestão de projectos", area: "Gestão", level: "Intermédio", mode: "Híbrido", duration: "18 horas" },
  { title: "Literacia digital e produtividade", area: "Escritório", level: "Fundamentos", mode: "Online", duration: "6 horas" },
];

function Header() { return <SiteHeader />; }

export function ApplicationModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [confirmed, setConfirmed] = useState(false); const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle"); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!confirmed) { setState("error"); setMessage("Confirme que o seu perfil e CV estão actualizados antes de continuar."); return; } setState("loading"); const response = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId: job.id }) }); const body = await response.json().catch(() => ({})); if (response.ok) { setState("success"); setMessage("A sua candidatura foi registada com sucesso."); } else { setState("error"); setMessage(body.error || "Não foi possível enviar a candidatura."); } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="application-modal" role="dialog" aria-modal="true" aria-labelledby="application-title"><button className="modal-close" onClick={onClose} aria-label="Fechar formulário">×</button>{state === "success" ? <div className="modal-success"><span className="success-mark">✓</span><p className="eyebrow">Candidatura enviada</p><h2 id="application-title">Boa sorte no próximo passo.</h2><p>{message}</p><button className="button button-dark" onClick={onClose}>Continuar a explorar</button></div> : <><p className="eyebrow">Candidatura rápida</p><h2 id="application-title">{job.title}</h2><p className="modal-company">{job.company} · {job.place || "Localização a confirmar"}</p><div className="modal-summary"><strong>O que acontece agora?</strong><span>Usaremos o seu perfil e o CV privado guardado na conta para apresentar a candidatura à empresa.</span></div><form onSubmit={submit}><label className="modal-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> <span>Confirmo que o meu perfil está actualizado e autorizo o envio desta candidatura.</span></label>{message && <p className="form-message" role="alert">{message}</p>}<div className="modal-actions"><button type="button" className="button button-light" onClick={onClose}>Cancelar</button><button type="submit" className="button button-orange" disabled={state === "loading"}>{state === "loading" ? "A enviar…" : "Enviar candidatura ↗"}</button></div></form></>}</section></div>;
}

export function JobsCatalog({ jobs, areas, provinces, countries, citiesByCountry }: { jobs: Job[]; areas: string[]; provinces: string[]; countries: string[]; citiesByCountry: Record<string, string[]> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const selectedAreas = useMemo(() => searchParams.get("categoria")?.split(",").filter(Boolean) ?? [], [searchParams]);
  const selectedLocations = useMemo(() => searchParams.get("localizacao")?.split(",").filter(Boolean) ?? [], [searchParams]);
  const selectedCountry = searchParams.get("pais") ?? "";
  const selectedCity = searchParams.get("cidade") ?? "";
  const customArea = searchParams.get("categoriaManual")?.toLowerCase().trim() ?? "";
  const selectedModels = useMemo(() => searchParams.get("modelo")?.split(",").filter(Boolean) ?? [], [searchParams]);
  const selectedContracts = useMemo(() => searchParams.get("contrato")?.split(",").filter(Boolean) ?? [], [searchParams]);
  const seniority = searchParams.get("senioridade") ?? "";
  const minSalary = Number(searchParams.get("salaryMin") || 0);
  const maxSalary = Number(searchParams.get("salaryMax") || Number.MAX_SAFE_INTEGER);
  const sort = searchParams.get("sort") ?? "recent";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 9;
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("okutijobs:favourite-jobs");
      const parsed = stored ? JSON.parse(stored) : [];
      setFavoriteIds(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
    } catch {
      setFavoriteIds([]);
    }
    const syncFavorites = () => {
      try {
        const stored = window.localStorage.getItem("okutijobs:favourite-jobs");
        const parsed = stored ? JSON.parse(stored) : [];
        setFavoriteIds(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
      } catch {
        setFavoriteIds([]);
      }
    };
    window.addEventListener("okutijobs:favorites-changed", syncFavorites);
    return () => window.removeEventListener("okutijobs:favorites-changed", syncFavorites);
  }, []);
  useEffect(() => {
    setIsFiltering(true);
    const timer = window.setTimeout(() => setIsFiltering(false), 280);
    return () => window.clearTimeout(timer);
  }, [searchParams]);
  const filtered = useMemo(() => jobs.filter((job) => { const text = `${job.title} ${job.company} ${job.place} ${job.description ?? ""} ${job.requirements ?? ""}`.toLowerCase(); const location = job.place.toLowerCase(); const modelsOk = !selectedModels.length || selectedModels.some((item) => job.mode.toLowerCase().includes(item.toLowerCase())); const contractsOk = !selectedContracts.length || selectedContracts.some((item) => job.contract.toLowerCase().includes(item.toLowerCase())); const areaOk = (!selectedAreas.length || selectedAreas.includes(job.area)) && (!customArea || text.includes(customArea)); const locationOk = (!selectedLocations.length || selectedLocations.some((item) => location.includes(item.toLowerCase()))) && (!selectedCountry || job.country?.toLowerCase() === selectedCountry.toLowerCase()) && (!selectedCity || job.city?.toLowerCase() === selectedCity.toLowerCase()); const salaryOk = (job.salaryKz ?? 0) >= minSalary && (job.salaryKz ?? Number.MAX_SAFE_INTEGER) <= maxSalary; const seniorityOk = !seniority || (seniority.includes("Júnior") && (job.experienceYears ?? 0) <= 2) || (seniority === "Pleno" && (job.experienceYears ?? 0) >= 3 && (job.experienceYears ?? 0) <= 5) || (seniority === "Sénior" && (job.experienceYears ?? 0) >= 6) || (seniority.includes("Direção")); return text.includes(query) && areaOk && locationOk && modelsOk && contractsOk && seniorityOk && salaryOk && (!showFavoritesOnly || favoriteIds.includes(job.id)); }).sort((a, b) => sort === "salary" ? (b.salaryKz ?? 0) - (a.salaryKz ?? 0) : sort === "popular" ? a.title.localeCompare(b.title) : 0), [jobs, query, selectedAreas, selectedLocations, selectedModels, selectedContracts, seniority, minSalary, maxSalary, sort, selectedCountry, selectedCity, customArea, showFavoritesOnly, favoriteIds]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleJobs = filtered.slice((page - 1) * pageSize, page * pageSize);
  return <main><Header /><section className="catalog-hero"><p className="eyebrow">Oportunidades OkutiJobs</p><h1>Encontre o próximo<br /><em>movimento.</em></h1><p className="lede">Pesquise oportunidades reais por função, área, localização e regime de trabalho.</p><JobsFilters areas={areas} countries={countries} citiesByCountry={citiesByCountry} /></section><section className="catalog-section"><div className="section-heading"><div><p className="eyebrow">{filtered.length} resultados reais</p><h2>Vagas disponíveis.</h2></div><div className="jobs-heading-actions"><button type="button" className={`jobs-favorites-filter${showFavoritesOnly ? " active" : ""}`} onClick={() => setShowFavoritesOnly((current) => !current)} aria-pressed={showFavoritesOnly}>☆ {showFavoritesOnly ? "Ver todas as vagas" : `Favoritas${favoriteIds.length ? ` (${favoriteIds.length})` : ""}`}</button><Link className="button button-orange" href="/profile">Criar perfil candidato <span>↗</span></Link></div></div>{isFiltering ? <div className="catalog-grid jobs-skeleton-grid" aria-live="polite" aria-label="A actualizar resultados"><div className="job-skeleton" /><div className="job-skeleton" /><div className="job-skeleton" /></div> : visibleJobs.length > 0 ? <><div className="catalog-grid">{visibleJobs.map((job) => <article className="opportunity-card" key={job.id} onClick={() => job.slug ? router.push(`/vagas/${job.slug}`) : setSelectedJob(job)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") job.slug ? router.push(`/vagas/${job.slug}`) : setSelectedJob(job); }}><div className="card-top"><span className="mini-icon">↗</span><span className="job-tag">{job.contract || "Oportunidade"}</span><JobFavoriteButton jobId={job.id} title={job.title} compact /></div><p className="card-company">{job.company}</p><h3>{job.title}</h3><p className="card-place">◌ &nbsp;{job.place || "Localização não indicada"} · {job.mode || "Regime a definir"}</p>{job.area && <p className="card-meta">{job.area}</p>}<button className="card-link card-apply" onClick={(event) => { event.stopPropagation(); job.slug ? router.push(`/vagas/${job.slug}`) : setSelectedJob(job); }}>Ver vaga e candidatar-me →</button></article>)}</div><div className="jobs-pagination">{Array.from({ length: totalPages }, (_, index) => <button type="button" className={page === index + 1 ? "active" : ""} key={index + 1} onClick={() => { const next = new URLSearchParams(searchParams.toString()); next.set("page", String(index + 1)); router.replace(`/vagas?${next.toString()}`, { scroll: false }); }}>{index + 1}</button>)}</div></> : <div className="empty-state"><h3>Ainda não existem vagas publicadas.</h3><p>Quando uma empresa publicar uma oportunidade, ela aparecerá aqui. Tente ajustar os filtros ou volte mais tarde.</p></div>}</section>{selectedJob && <ApplicationModal job={selectedJob} onClose={() => setSelectedJob(null)} />}</main>;
}

export function TrainingCatalog() { return <main><Header /><section className="catalog-hero training-hero"><p className="eyebrow">Formação corporativa</p><h1>Competências que<br /><em>fazem avançar.</em></h1><p className="lede">Programas práticos para equipas mais preparadas, produtivas e alinhadas com o futuro do trabalho.</p></section><section className="catalog-section"><div className="section-heading"><div><p className="eyebrow">Catálogo OkutiJobs</p><h2>Aprendizagem aplicada.</h2></div><Link className="button button-dark" href="/pagina-empresas">Solicitar formação <span>↗</span></Link></div><div className="course-grid">{courses.map((course) => <article className="course-card" key={course.title}><span className="course-area">{course.area}</span><h3>{course.title}</h3><p>{course.level} · {course.mode}</p><strong>{course.duration}</strong><Link href="/pagina-empresas">Saber mais <span>↗</span></Link></article>)}</div></section></main>; }

export function ServicesPage({ audience }: { audience: "candidate" | "company" }) {
  const candidate = audience === "candidate";
  if (!candidate) {
    const companyServices = [
      { number: "01", icon: "◈", title: "Recrutamento especializado", text: "Encontre profissionais alinhados com a função, a cultura e o momento da sua organização.", href: "/pagina-empresas?servico=recrutamento", tone: "company-card-blue" },
      { number: "02", icon: "✦", title: "Banco de talentos", text: "Pesquise perfis públicos por competências, senioridade, localização e experiência.", href: "/empresa/talentos", tone: "company-card-orange" },
      { number: "03", icon: "◎", title: "Avaliação e testes", text: "Apoie decisões melhores com testes técnicos, psicotécnicos, idiomáticos e de raciocínio.", href: "/pagina-empresas?servico=avaliacao", tone: "company-card-mint" },
      { number: "04", icon: "⌁", title: "Formação corporativa", text: "Prepare equipas para crescer com programas práticos e adaptados às necessidades do negócio.", href: "/formacoes", tone: "company-card-lilac" },
    ];
    return <main><Header /><section className="company-hero"><div className="company-hero-copy"><p className="eyebrow">Soluções para organizações em movimento</p><h1>Equipas mais fortes começam com <em>decisões melhores.</em></h1><p className="lede">Recrutamento, avaliação e desenvolvimento de talento para transformar desafios de pessoas em crescimento sustentável.</p><div className="company-hero-actions"><Link href="/pagina-empresas" className="button button-orange">Solicitar uma proposta <span>↗</span></Link><Link href="/empresa/talentos" className="button button-outline">Explorar talentos <span>→</span></Link></div></div><div className="company-hero-panel"><div className="company-orbit" aria-hidden="true"></div><div className="company-panel-card panel-card-main"><span className="panel-card-icon">✦</span><strong>Decisões com contexto</strong><p>Dados, experiência e acompanhamento humano.</p></div><div className="company-panel-card panel-card-float"><span>+32%</span><small>mais clareza<br />na triagem</small></div></div></section><section className="company-services catalog-section"><div className="section-heading"><div><p className="eyebrow">O que podemos construir consigo</p><h2>Uma equipa melhor<br /><em>começa aqui.</em></h2></div><p className="section-intro">Escolha o ponto de partida mais importante para a sua organização. A nossa equipa ajuda a desenhar a solução certa.</p></div><div className="company-service-grid">{companyServices.map((service) => <Link href={service.href} className={`company-service-card ${service.tone}`} key={service.number}><span className="service-number">{service.number}</span><span className="company-service-icon">{service.icon}</span><h3>{service.title}</h3><p>{service.text}</p><strong>Conhecer solução <span>↗</span></strong></Link>)}</div></section><section className="company-highlights"><div className="highlight-copy"><p className="eyebrow light">Mais do que preencher vagas</p><h2>Construa capacidade para o <em>próximo ciclo.</em></h2><p>Da identificação do perfil à integração da pessoa certa, a OkutiJobs combina tecnologia, conhecimento local e visão internacional.</p><Link href="/pagina-empresas" className="button button-orange">Falar com a OkutiJobs <span>↗</span></Link></div><div className="highlight-metrics"><div><strong>01</strong><span>Briefing claro<br />e orientado</span></div><div><strong>02</strong><span>Triagem por<br />compatibilidade</span></div><div><strong>03</strong><span>Acompanhamento<br />até à decisão</span></div></div></section><section className="company-bottom-cta"><div><p className="eyebrow">Pronto para avançar?</p><h2>Vamos desenhar a solução certa para a <em>sua equipa.</em></h2></div><Link href="/pagina-empresas" className="button button-dark">Solicitar uma proposta <span>↗</span></Link></section></main>;
  }
  const services = [
    { number: "01", icon: "✦", title: "Perfil profissional", text: "Construa um perfil completo, claro e pronto para ser encontrado.", href: "/profile", tone: "service-coral" },
    { number: "02", icon: "◒", title: "Revisão de CV por IA", text: "Descubra os pontos fortes do seu CV e melhore a sua apresentação.", href: "/revisao-cv", tone: "service-sun" },
    { number: "03", icon: "↗", title: "Oportunidades compatíveis", text: "Encontre vagas alinhadas com as suas competências e ambições.", href: "/vagas", tone: "service-mint" },
    { number: "04", icon: "⌁", title: "Plano de carreira", text: "Organize o próximo passo com mais clareza, foco e confiança.", href: "/profile", tone: "service-lilac" },
  ];
  const trainingCategories = [
    { name: "Escritório e produtividade", detail: "Excel, ferramentas digitais e organização", href: "/formacoes" },
    { name: "Contabilidade e finanças", detail: "Fundamentos, controlo e gestão financeira", href: "/formacoes" },
    { name: "Vendas e atendimento", detail: "Negociação, comunicação e experiência do cliente", href: "/formacoes" },
    { name: "Liderança e gestão", detail: "Equipas, projectos e decisões melhores", href: "/formacoes" },
  ];
  return <main><Header /><section className="candidate-hero"><div className="candidate-hero-copy"><p className="eyebrow">Para profissionais em movimento</p><h1>O seu talento merece <em>um palco maior.</em></h1><p className="lede">Ferramentas, orientação e oportunidades para transformar a sua experiência no próximo capítulo da sua carreira.</p><div className="candidate-quick-actions"><Link href="/vagas" className="button button-orange"><span className="quick-icon">↗</span><span><strong>Encontrar vagas</strong><small>Oportunidades para si</small></span></Link><Link href="/formacoes" className="button button-dark"><span className="quick-icon">◌</span><span><strong>Formações</strong><small>Aprender e avançar</small></span></Link><Link href="/profile" className="button button-outline"><span className="quick-icon">✦</span><span><strong>Plano de carreira</strong><small>Definir o próximo passo</small></span></Link></div></div><div className="candidate-hero-art" aria-hidden="true"><span className="hero-sticker sticker-one">O seu<br /><strong>próximo passo</strong></span><div className="hero-orbit"></div><div className="hero-sun">O</div><span className="hero-sticker sticker-two">talento<br /><strong>em movimento</strong></span></div></section><section className="candidate-services catalog-section"><div className="section-heading"><div><p className="eyebrow">Ferramentas para avançar</p><h2>Escolha o impulso<br /><em>certo para si.</em></h2></div><p className="section-intro">Pequenos passos, melhores decisões. Comece pelo serviço que faz mais sentido para o momento da sua carreira.</p></div><div className="candidate-service-grid">{services.map((service) => <Link href={service.href} className={`candidate-service-card ${service.tone}`} key={service.number}><span className="service-number">{service.number}</span><span className="candidate-service-icon">{service.icon}</span><h3>{service.title}</h3><p>{service.text}</p><strong>Começar agora <span>↗</span></strong></Link>)}</div></section><section className="candidate-training catalog-section"><div className="section-heading"><div><p className="eyebrow">Aprender também é avançar</p><h2>Formações para o seu <em>próximo nível.</em></h2></div><Link className="button button-dark" href="/formacoes">Ver catálogo completo <span>↗</span></Link></div><div className="training-category-grid">{trainingCategories.map((category) => <Link href={category.href} className="training-category-card" key={category.name}><span className="category-arrow">↗</span><h3>{category.name}</h3><p>{category.detail}</p><span className="category-link">Explorar categoria →</span></Link>)}</div></section><section className="candidate-bottom-cta"><div><p className="eyebrow light">O próximo capítulo começa com uma escolha</p><h2>Não precisa de ter<br /><em>todas as respostas.</em></h2></div><Link href="/profile" className="button button-orange">Criar o meu perfil <span>↗</span></Link></section></main>;
}

export function JobDetailView({ job }: { job: Job }) {
  const requirements = (job.requirements || "Os requisitos serão apresentados pela empresa durante o processo.").split(/[\n;•]+/).map((item) => item.trim()).filter(Boolean);
  const loginHref = `/login?next=${encodeURIComponent(`/vagas/${job.slug ?? ""}`)}`;
  return <main><Header /><section className="job-detail-hero"><Link className="back-link" href="/vagas">← Voltar às vagas</Link><p className="eyebrow">{job.company}</p><h1>{job.title}</h1><div className="job-detail-facts"><span>{job.place || "Angola"}</span><span>{job.mode || "Regime a confirmar"}</span><span>{job.contract || "Oportunidade"}</span>{job.area && <span>{job.area}</span>}</div><JobFavoriteButton jobId={job.id} title={job.title} /><Link className="button button-orange job-detail-cta" href={loginHref}>Candidatar-me a esta vaga <span>↗</span></Link></section><section className="job-detail-body"><article><p className="eyebrow">Descrição completa e funções</p><div className="detail-copy">{(job.description || "Conheça esta oportunidade e veja como o seu perfil pode contribuir.").split(/\n|\. /).map((sentence, index) => <p key={index}>{sentence.trim()}{sentence.trim().endsWith(".") ? "" : "."}</p>)}</div></article><aside className="job-detail-aside"><p className="eyebrow">Requisitos da vaga</p><ul className="requirements-list">{requirements.map((requirement, index) => <li key={`${requirement}-${index}`}>{requirement}</li>)}</ul><div className="detail-contact"><strong>Pronto para avançar?</strong><span>Inicie sessão para enviar o seu perfil e CV privado à empresa.</span><Link className="button button-orange" href={loginHref}>Enviar candidatura <span>↗</span></Link></div></aside></section></main>;
}
