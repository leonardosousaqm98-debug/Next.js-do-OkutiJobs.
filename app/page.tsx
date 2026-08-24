import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HomeSearch } from "@/components/HomeSearch";
import { SiteHeader } from "@/components/SiteHeader";

const services = [
  { number: "01", title: "Recrutamento especializado", text: "Encontramos profissionais alinhados com a cultura, a função e o momento de crescimento da sua organização.", href: "/pagina-empresas?servico=recrutamento" },
  { number: "02", title: "Banco de talentos", text: "Pesquise perfis disponíveis com filtros por competências, experiência, localização e idiomas.", href: "/empresa/talentos" },
  { number: "03", title: "Avaliação de competências", text: "Testes psicotécnicos, técnicos, idiomáticos e de raciocínio para decisões mais seguras.", href: "/pagina-empresas?servico=avaliacao" },
  { number: "04", title: "Okuti Career AI", text: "Inteligência artificial para ler CVs, destacar competências e aproximar pessoas de oportunidades.", href: "/revisao-cv" },
];

const fallbackOpportunities = [
  { company: "OFConsultores", title: "Directores e Técnicos — Sector Financeiro", place: "Luanda · Híbrido", tag: "Tempo inteiro", area: "Finanças", slug: "directores-tecnicos-sector-financeiro" },
  { company: "Embalvidro", title: "Técnico de Contabilidade — Contas a Pagar", place: "Luanda · Presencial", tag: "Tempo inteiro", area: "Contabilidade", slug: "tecnico-contabilidade-contas-a-pagar-junior" },
  { company: "Associação Desportiva", title: "Delegados de Jogos — Futebol", place: "Luanda · Presencial", tag: "Part-time", area: "Desporto", slug: "delegados-de-jogos-futebol" },
];

const partners = ["Pregestor", "Basel Angola", "Manguinvestimentos", "Gestgráfica", "Logpalanca", "Fisioprevine"];

type SupabaseJob = { id: string; company_id: string; slug: string; title: string; description: string; requirements: string | null; country: string | null; province: string | null; city: string | null; work_mode: string | null; contract_type: string | null };
type PublicCompany = { id: string; name: string };

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  let opportunities = fallbackOpportunities;
  if (supabase) {
    const { data: rows } = await supabase.from("jobs").select("id,company_id,slug,title,description,requirements,country,province,city,work_mode,contract_type").eq("status", "published").order("published_at", { ascending: false }).limit(6);
    const jobs = (rows ?? []) as SupabaseJob[];
    const companyIds = Array.from(new Set(jobs.map((job) => job.company_id)));
    const { data: companies } = companyIds.length ? await supabase.from("public_company_profiles").select("id,name").in("id", companyIds) : { data: [] as PublicCompany[] };
    const companyMap = new Map(((companies ?? []) as PublicCompany[]).map((company) => [company.id, company.name]));
    if (jobs.length) opportunities = jobs.map((job) => ({ company: companyMap.get(job.company_id) || "Empresa verificada", title: job.title, place: [job.city, job.province, job.country].filter(Boolean).join(" · "), tag: job.contract_type || "Oportunidade", area: job.requirements?.toLowerCase().includes("contabilidade") ? "Contabilidade" : job.title.toLowerCase().includes("finance") ? "Finanças" : "Oportunidades", slug: job.slug }));
  }

  return <main>
    <SiteHeader signedIn={Boolean(data.user)} />
    <section className="hero-section"><div className="hero-copy"><p className="eyebrow">Talento angolano. Oportunidades sem fronteiras.</p><h1>O próximo passo da sua carreira <em>começa aqui.</em></h1><p className="hero-lede">Ligamos pessoas ambiciosas a organizações que querem crescer melhor — com tecnologia, contexto e acompanhamento humano.</p><div className="hero-actions"><a className="button button-orange" href="#vagas">Explorar oportunidades <span>↗</span></a><a className="text-link" href="#empresas">Sou uma empresa <span>→</span></a></div><div className="hero-proof"><div className="avatar-stack"><i>LM</i><i>AS</i><i>JC</i><b>+</b></div><span>Profissionais a construir o próximo capítulo.</span></div></div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div><div className="art-disc"><span>O</span></div><div className="art-note note-top">Competência<br /><strong>encontra</strong><br />oportunidade.</div><div className="art-note note-bottom">AI-powered<br /><strong>matching</strong></div><div className="art-spark">✦</div></div></section>
    <section className="search-strip" id="vagas"><div><p className="eyebrow">Encontre o seu lugar</p><h2>Uma oportunidade pode mudar tudo.</h2></div><HomeSearch opportunities={opportunities} /></section>
    <section className="opportunities-section" id="opportunity-results"><div className="section-heading"><div><p className="eyebrow">Oportunidades em destaque</p><h2>Talento em movimento.</h2><p className="section-live-note">{opportunities === fallbackOpportunities ? "Exemplos para explorar a plataforma." : "Vagas publicadas recentemente."}</p></div><a className="text-link" href="/vagas">Ver todas as vagas <span>↗</span></a></div><div className="opportunity-grid">{opportunities.slice(0, 3).map((job) => <article className="opportunity-card" key={job.title}><div className="card-top"><span className="mini-icon">↗</span><span className="job-tag">{job.tag}</span></div><p className="card-company">{job.company}</p><h3>{job.title}</h3><p className="card-place">◌ &nbsp;{job.place}</p><a href={`/vagas/${job.slug}`} className="card-link" aria-label={`Ver detalhes de ${job.title}`}>Ver oportunidade <span>→</span></a></article>)}</div></section>
    <section className="services-section" id="servicos"><div className="section-heading"><div><p className="eyebrow">Soluções OkutiJobs</p><h2>Mais do que contratar.<br /><em>Construir futuro.</em></h2></div><p className="section-intro">Da primeira conversa ao crescimento da equipa, criamos experiências de talento mais simples, humanas e inteligentes.</p></div><div className="service-grid">{services.map((service) => <article className="service-card" key={service.number}><span className="service-number">{service.number}</span><h3>{service.title}</h3><p>{service.text}</p><a href={service.href} aria-label={`Saber mais sobre ${service.title}`}>Saber mais <span>↗</span></a></article>)}</div></section>
    <section className="split-section" id="empresas"><div className="split-panel split-dark"><p className="eyebrow light">Para organizações</p><h2>Equipas mais fortes começam com <em>decisões melhores.</em></h2><p>Publique vagas, pesquise o Banco de Talentos e use dados para encontrar as pessoas certas para cada desafio.</p><a className="button button-orange" href="/pagina-empresas">Solicitar uma proposta <span>↗</span></a></div><div className="split-panel split-cloud"><p className="eyebrow">Para profissionais</p><h2>O seu talento merece ser <em>visto.</em></h2><p>Crie o seu perfil, carregue o CV e descubra oportunidades que combinam com as suas competências e ambições.</p><a className="button button-dark" href="/profile">Criar o meu perfil <span>↗</span></a><div className="metric-row"><strong>4<span>×</span></strong><span>idiomas para<br />ir mais longe</span></div></div></section>
    <section className="partners-section" id="sobre"><div className="section-heading"><div><p className="eyebrow">Relações que criam impacto</p><h2>Empresas que confiam<br />no talento certo.</h2></div><p className="section-intro">Apoiamos organizações de referência no mercado angolano a encontrar, desenvolver e reter as suas melhores pessoas.</p></div><div className="partner-marquee" aria-label="Empresas parceiras">{partners.map((partner) => <span key={partner}>{partner}</span>)}</div></section>
    <section className="final-cta"><div><p className="eyebrow light">Está pronto?</p><h2>Vamos encontrar o<br /><em>próximo movimento.</em></h2></div><a className="button button-orange" href="/candidato">Começar agora <span>↗</span></a></section>
    <footer className="site-footer"><div className="footer-brand"><a href="/" className="brand"><span className="brand-lockup"><span className="brand-symbol"><img src="https://wmkxeqghopmbsfwptpzq.supabase.co/storage/v1/object/public/brand-assets/okutijobs-new-mark.png" alt="" /></span><span className="brand-word">Okuti<span>Jobs</span></span></span></a><p>Talento local.<br />Impacto global.</p></div><div className="footer-col"><strong>Explorar</strong><a href="#vagas">Vagas</a><a href="#servicos">Soluções</a><a href="/profile">Perfil candidato</a></div><div className="footer-col"><strong>Para empresas</strong><a href="#empresas">Recrutamento</a><a href="#servicos">Avaliação</a><a href="/pagina-empresas">Solicitar proposta</a></div><div className="footer-col footer-contact"><strong>Fale connosco</strong><a href="mailto:info@okutijobs.com">info@okutijobs.com</a><a href="tel:+244936161636">+244 936 161 636</a><span>Centralidade do Kilamba,<br />Luanda, Angola</span></div><div className="footer-bottom"><span>© 2026 OkutiJobs. Todos os direitos reservados.</span><span>Feito para o próximo capítulo.</span></div></footer>
    <div className="sr-only" aria-live="polite">{configured ? "Supabase configurado" : ""}</div>
  </main>;
}
