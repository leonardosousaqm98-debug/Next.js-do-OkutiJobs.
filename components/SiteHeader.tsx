import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeProvider";

type SiteHeaderProps = { signedIn?: boolean; accountHref?: string };

function NavIcon({ children }: { children: React.ReactNode }) { return <span className="nav-action-icon" aria-hidden="true">{children}</span>; }

export function SiteHeader({ signedIn = false, accountHref = "/dashboard" }: SiteHeaderProps) {
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="OkutiJobs — início"><span className="brand-lockup"><span className="brand-symbol"><img src="/icon.png" alt="" width="34" height="34" /></span><span className="brand-word">Okuti<span>Jobs</span></span></span></Link>
    <nav className="desktop-nav" aria-label="Navegação principal">
      <Link className="nav-action nav-action-jobs" href="/vagas"><NavIcon>⌕</NavIcon><span>Encontrar vagas</span></Link>
      <Link className="nav-action nav-action-support" href="/pagina-candidatos#consultoria-candidatos"><NavIcon>✦</NavIcon><span>Consultoria para candidatos</span></Link>
      <Link className="nav-action nav-action-services" href="/formacoes"><NavIcon>◈</NavIcon><span>Formações</span></Link>
    </nav>
    <details className="mobile-nav-dropdown"><summary aria-label="Abrir menu">Menu</summary><div className="nav-dropdown-menu" role="menu"><Link href="/vagas" role="menuitem">Encontrar vagas</Link><Link href="/pagina-candidatos#consultoria-candidatos" role="menuitem">Consultoria para candidatos</Link><Link href="/formacoes" role="menuitem">Formações</Link></div></details>
    <div className="header-actions"><ThemeSwitcher /><Link className="header-login" href={signedIn ? accountHref : "/login"}><span className="login-dot" aria-hidden="true" />{signedIn ? "Área pessoal" : "Iniciar sessão"}</Link><Link className="button button-dark header-cta" href={signedIn ? "/profile" : "/login"}>{signedIn ? "Abrir perfil" : "Criar conta"} <span>↗</span></Link></div>
  </header>;
}
