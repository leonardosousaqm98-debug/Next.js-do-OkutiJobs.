import Link from "next/link";
import { BuyCvTrigger } from "@/components/CvOrderModal";

type SiteHeaderProps = { signedIn?: boolean; accountHref?: string };

const candidateServices = [
  { label: "Perfil profissional", href: "/profile" },
  { label: "Revisão de CV por IA", href: "/revisao-cv" },
  { label: "Oportunidades compatíveis", href: "/vagas" },
  { label: "Formações de carreira", href: "/formacoes" },
];

function NavIcon({ children }: { children: React.ReactNode }) { return <span className="nav-action-icon" aria-hidden="true">{children}</span>; }

export function SiteHeader({ signedIn = false, accountHref = "/dashboard" }: SiteHeaderProps) {
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="OkutiJobs — início"><span className="brand-lockup"><span className="brand-symbol"><img src="/icon.png" alt="" width="34" height="34" /></span><span className="brand-word">Okuti<span>Jobs</span></span></span></Link>
    <nav className="desktop-nav" aria-label="Navegação principal">
      <Link className="nav-action nav-action-jobs" href="/vagas"><NavIcon>⌕</NavIcon><span>Encontrar vagas</span></Link>
      <BuyCvTrigger className="header-service-trigger nav-action nav-action-cv" ariaLabel="Comprar CV"><NavIcon>✦</NavIcon><span>Comprar CV</span></BuyCvTrigger>
      <Link className="nav-action nav-action-support" href="/pagina-candidatos"><NavIcon>↗</NavIcon><span>Apoio à candidatura</span></Link>
      <details className="nav-dropdown"><summary className="nav-action nav-action-services"><NavIcon>◈</NavIcon><span>Serviços</span><b aria-hidden="true">⌄</b></summary><div className="nav-dropdown-menu" role="menu">{candidateServices.map((service) => <Link key={service.href} href={service.href} role="menuitem">{service.label}</Link>)}</div></details>
    </nav>
    <details className="mobile-nav-dropdown"><summary aria-label="Abrir menu">Menu</summary><div className="nav-dropdown-menu" role="menu"><Link href="/vagas" role="menuitem">Encontrar vagas</Link><BuyCvTrigger className="header-service-trigger" ariaLabel="Comprar CV" /><Link href="/pagina-candidatos" role="menuitem">Apoio à candidatura</Link>{candidateServices.map((service) => <Link key={`mobile-${service.href}`} href={service.href} role="menuitem">{service.label}</Link>)}</div></details>
    <div className="header-actions"><Link className="header-login" href={signedIn ? accountHref : "/login"}><span className="login-dot" aria-hidden="true" />{signedIn ? "Área pessoal" : "Iniciar sessão"}</Link><Link className="button button-dark header-cta" href={signedIn ? "/profile" : "/login"}>{signedIn ? "Abrir perfil" : "Criar conta"} <span>↗</span></Link></div>
  </header>;
}
