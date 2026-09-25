"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export type CompanyJobStat = { id: string; title: string; status: string; applications: number };

type CompanyService = { icon: string; title: string; description: string; href: string; tone: string };

const candidateLinks = [
  { label: "Oportunidades compatíveis", href: "/vagas", note: "6 vagas disponíveis" },
  { label: "O meu perfil", href: "/profile", note: "Complete os seus dados" },
  { label: "As minhas candidaturas", href: "/candidato/candidaturas", note: "Acompanhe o seu percurso" },
  { label: "Revisão de CV por IA", href: "/profile", note: "Disponível ao carregar um CV" },
];

const companyLinks = [
  { label: "Criar nova oferta", href: "/pagina-empresas", note: "Publique uma oportunidade" },
  { label: "Ofertas de emprego", href: "/vagas", note: "Gerir vagas publicadas" },
  { label: "Candidaturas recebidas", href: "/empresa/candidaturas", note: "Consultar perfis e CVs" },
  { label: "Estatísticas e métricas", href: "/empresa/estatisticas", note: "Acompanhar o desempenho" },
  { label: "Banco de talentos", href: "/empresa/talentos", note: "Pesquisar perfis compatíveis" },
];

const companyServices: CompanyService[] = [
  { icon: "◈", title: "Recrutamento executivo", description: "Identificação confidencial de líderes e especialistas para posições críticas.", href: "/pagina-empresas", tone: "service-gold" },
  { icon: "⌁", title: "Recrutamento operacional", description: "Selecção rápida de profissionais preparados para a operação diária.", href: "/pagina-empresas", tone: "service-blue" },
  { icon: "◌", title: "Cedência temporária de pessoal", description: "Reforce a sua equipa por projecto, época ou necessidade temporária.", href: "/pagina-empresas", tone: "service-mint" },
  { icon: "▥", title: "Inquérito salarial", description: "Tome decisões com referências salariais adaptadas ao mercado.", href: "mailto:comercial@okutijobs.com?subject=Solicitar%20inquérito%20salarial", tone: "service-lilac" },
  { icon: "↗", title: "Outplacement", description: "Apoie transições profissionais com acompanhamento humano e estruturado.", href: "/pagina-empresas", tone: "service-coral" },
  { icon: "✦", title: "Recrutamento em massa", description: "Organize grandes volumes de contratação com triagem e ritmo.", href: "/pagina-empresas", tone: "service-orange" },
  { icon: "◎", title: "Programa de estágios", description: "Crie uma entrada de talento jovem com objectivos e acompanhamento.", href: "/pagina-empresas", tone: "service-green" },
];

function CompanyAccountHeader() {
  return <header className="company-account-header">
    <Link href="/" className="brand" aria-label="OkutiJobs — início"><span className="brand-lockup"><span className="brand-symbol"><img src="/icon.png" alt="" width="34" height="34" /></span><span className="brand-word">Okuti<span>Jobs</span></span></span></Link>
    <nav aria-label="Serviços da empresa" className="company-account-nav">
      <a href="#company-services"><span>◈</span><strong>Serviços</strong><small>Soluções para a sua equipa</small></a>
      <Link href="/formacoes"><span>✦</span><strong>Formações corporativas</strong><small>Ver catálogo completo</small></Link>
      <a href="#company-credits"><span>◇</span><strong>Comprar crédito</strong><small>Expandir o seu acesso</small></a>
    </nav>
    <div className="company-account-actions"><Link href="/empresa">Painel</Link><Link className="button button-dark" href="/empresa">Área da empresa <span>↗</span></Link></div>
  </header>;
}

function Header({ kind }: { kind: "candidate" | "company" }) { return kind === "company" ? <CompanyAccountHeader /> : <SiteHeader signedIn accountHref="/candidato" />; }

function CompanyWelcome({ email }: { email: string }) {
  return <section className="company-welcome" aria-labelledby="company-welcome-title"><div className="company-welcome-copy"><p className="eyebrow">Área da empresa · Bem-vindo</p><h1 id="company-welcome-title">A sua equipa começa <em>aqui.</em></h1><p>{email} · Sessão protegida por Supabase</p><span className="portal-status">● Conta activa</span></div><div className="company-welcome-lamp" aria-hidden="true"><span className="welcome-lamp-glow" /><span className="welcome-lamp-shade" /><span className="welcome-lamp-stem" /><span className="welcome-lamp-base" /><i>✦</i><i>·</i><i>✦</i></div></section>;
}

function CompanyServices() {
  return <section className="company-account-services" id="company-services" aria-labelledby="company-services-title"><div className="company-account-section-heading"><div><p className="eyebrow">Soluções para organizações</p><h2 id="company-services-title">Escolha o apoio certo para a sua equipa.</h2></div><p>Serviços especializados para encontrar, preparar e desenvolver talento com mais clareza.</p></div><div className="company-account-service-grid">{companyServices.map((service) => <article className={`company-account-service ${service.tone}`} key={service.title}><span className="company-account-service-icon">{service.icon}</span><h3>{service.title}</h3><p>{service.description}</p><a href={service.href}>Solicitar proposta <span>↗</span></a></article>)}</div></section>;
}

function CompanyCredits() {
  return <section className="company-credit-strip" id="company-credits"><div><p className="eyebrow light">Acesso flexível</p><h2>Compre créditos quando a sua equipa precisar.</h2><p>Use créditos para pesquisar no Banco de Talentos, consultar contactos e ampliar a divulgação das suas vagas.</p></div><a className="button button-orange" href="mailto:comercial@okutijobs.com?subject=Solicitar%20compra%20de%20créditos">Solicitar créditos <span>↗</span></a></section>;
}

function CompanyAnalytics({ stats }: { stats: CompanyJobStat[] }) {
  const total = stats.reduce((sum, job) => sum + job.applications, 0);
  const published = stats.filter((job) => job.status === "published").length;
  const top = Math.max(...stats.map((job) => job.applications), 1);
  return <section className="company-analytics" aria-labelledby="analytics-title"><div className="analytics-heading"><div><p className="eyebrow">Desempenho das ofertas</p><h2 id="analytics-title">Candidaturas por vaga.</h2><p>Acompanhe o interesse recebido e identifique rapidamente as oportunidades com maior procura.</p></div><span className="analytics-live">Dados Supabase · actualizado agora</span></div><div className="analytics-kpis"><div><strong>{total}</strong><span>Candidaturas recebidas</span></div><div><strong>{published}</strong><span>Ofertas publicadas</span></div><div><strong>{stats.length ? Math.round(total / stats.length) : 0}</strong><span>Média por vaga</span></div></div>{stats.length ? <div className="analytics-bars">{stats.map((job) => <div className="analytics-row" key={job.id}><div className="analytics-row-label"><span title={job.title}>{job.title}</span><strong>{job.applications}</strong></div><div className="analytics-track"><span style={{ width: `${Math.max((job.applications / top) * 100, job.applications ? 8 : 0)}%` }} /></div></div>)}</div> : <div className="analytics-empty"><strong>Ainda não existem dados de candidaturas.</strong><span>Publique uma oferta para começar a acompanhar o desempenho aqui.</span></div>}</section>;
}

export function PortalDashboard({ kind, email, companyStats = [] }: { kind: "candidate" | "company"; email: string; companyStats?: CompanyJobStat[] }) {
  const candidate = kind === "candidate";
  const links = candidate ? candidateLinks : companyLinks;
  const [notice, setNotice] = useState<string | null>(null);
  const analytics = useMemo(() => companyStats, [companyStats]);
  return <main><Header kind={kind} /><section className="portal-wrap">{candidate ? <div className="portal-heading"><div><p className="eyebrow">Área do candidato</p><h1>O seu próximo passo começa aqui.</h1><p className="lede">{email} · Sessão protegida por Supabase</p></div><span className="portal-status">● Conta activa</span><div className="welcome-particles" aria-hidden="true"><i>✦</i><i>·</i><i>✦</i><i>·</i><i>✧</i></div></div> : <CompanyWelcome email={email} />}<div className="email-verification-notice" role="status"><strong>Verificação de email pendente</strong><span>A sua conta já está activa. Pode preencher o perfil, publicar ou enviar candidaturas normalmente. Confirme o email quando receber a mensagem para manter os dados de contacto actualizados.</span></div>{!candidate && <CompanyServices />}<div className="portal-visual"><img src={candidate ? "/okutijobs-candidate-career-hero.png" : "/okutijobs-employer-hero.png"} alt={candidate ? "Profissional a preparar o seu percurso de carreira" : "Equipa empresarial a analisar oportunidades e crescimento"} /></div><div className="portal-grid"><article className="portal-summary"><p className="eyebrow">Resumo</p><h2>{candidate ? "Perfil em construção." : "Organização em crescimento."}</h2><p>{candidate ? "Quanto mais completo estiver o seu perfil, melhores serão as recomendações de oportunidades." : "Complete os dados da sua organização para apresentar uma presença mais forte aos candidatos."}</p><div className="progress-track"><span style={{ width: candidate ? "42%" : "34%" }} /></div><strong>{candidate ? "42%" : "34%"} completo</strong><a className="button button-orange" href={candidate ? "/profile" : "/pagina-empresas"}>Completar perfil <span>↗</span></a></article><div className="portal-actions">{links.map((link, index) => <a className="portal-action" href={link.href} key={link.label}><span className="portal-index">0{index + 1}</span><span><strong>{link.label}</strong><small>{link.note}</small></span><b>↗</b></a>)}</div></div>{!candidate && <CompanyAnalytics stats={analytics} />}{!candidate && <CompanyCredits />} {!candidate && <section className="portal-company-contact" aria-labelledby="company-contact-title"><div><p className="eyebrow">Fale com a OkutiJobs</p><h2 id="company-contact-title">Precisa de apoio no seu processo de recrutamento?</h2><p>A nossa equipa pode orientar a publicação de vagas, a pesquisa de talentos e a escolha de créditos.</p></div><div className="company-contact-details"><a href="tel:+244936161636"><span className="contact-icon" aria-hidden="true">⌕</span><span>+244 936 161 636</span></a><a href="https://wa.me/244936161636" target="_blank" rel="noreferrer"><span className="contact-icon" aria-hidden="true">◌</span><span>WhatsApp +244 936 161 636</span></a><a href="mailto:adm@okutijobs.com"><span className="contact-icon" aria-hidden="true">✉</span><span>adm@okutijobs.com</span></a></div></section>}<section className="portal-lower"><div><p className="eyebrow">Actividade recente</p><h2>{candidate ? "Continue a explorar." : companyStats.length ? "As suas ofertas estão activas." : "Ainda não publicou ofertas."}</h2><p>{candidate ? "Explore as vagas e candidate-se às oportunidades que combinam consigo." : companyStats.length ? "Consulte as candidaturas recebidas e acompanhe cada processo a partir do painel." : "Crie a primeira oferta para começar a receber candidatos compatíveis."}</p></div><div className="portal-note"><span>◌</span><p>{notice ?? "As notificações e os dados reais serão ligados a este painel na próxima etapa da migração."}</p>{!notice && <button onClick={() => setNotice("Notificação marcada como lida.")}>Marcar como lida</button>}</div></section></section></main>;
}
