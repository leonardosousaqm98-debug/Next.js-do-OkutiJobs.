import Link from "next/link";

type SiteHeaderProps = {
  signedIn?: boolean;
  accountHref?: string;
};

const candidateServices = [
  { label: "Perfil profissional", href: "/profile" },
  { label: "Revisão de CV por IA", href: "/revisao-cv" },
  { label: "Oportunidades compatíveis", href: "/vagas" },
  { label: "Formações de carreira", href: "/formacoes" },
];

export function SiteHeader({ signedIn = false, accountHref = "/dashboard" }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="OkutiJobs — início">
        <span className="brand-lockup">
          <span className="brand-symbol"><img src="https://wmkxeqghopmbsfwptpzq.supabase.co/storage/v1/object/public/brand-assets/okutijobs-new-mark.png" alt="" /></span>
          <span className="brand-word">Okuti<span>Jobs</span></span>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="Navegação principal">
        <Link href="/vagas">Encontrar vagas</Link>
        <Link href="/revisao-cv">Comprar CV</Link>
        <Link href="/pagina-candidatos">Apoio à candidatura</Link>
        <details className="nav-dropdown">
          <summary>Serviços</summary>
          <div className="nav-dropdown-menu" role="menu">
            {candidateServices.map((service) => <Link key={service.href} href={service.href} role="menuitem">{service.label}</Link>)}
          </div>
        </details>
      </nav>
      <div className="header-actions">
        <Link className="header-login" href={signedIn ? accountHref : "/login"}>{signedIn ? "Área pessoal" : "Iniciar sessão"}</Link>
        <Link className="button button-dark header-cta" href={signedIn ? "/profile" : "/login"}>{signedIn ? "Abrir perfil" : "Criar conta"} <span>↗</span></Link>
      </div>
    </header>
  );
}
