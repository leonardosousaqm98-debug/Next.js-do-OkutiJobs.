"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DarkModeToggle } from "@/components/ThemeProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignOutButton } from "@/components/SignOutButton";

type SiteHeaderProps = { signedIn?: boolean; accountHref?: string };
type Copy = { jobs: string; consulting: string; training: string; login: string; signup: string; profile: string };
const copy: Record<string, Copy> = {
  pt: { jobs: "Encontrar vagas", consulting: "Consultoria para candidatos", training: "Formações", login: "Iniciar sessão", signup: "Criar conta", profile: "Abrir perfil" },
  en: { jobs: "Find jobs", consulting: "Candidate consulting", training: "Training", login: "Sign in", signup: "Create account", profile: "Open profile" },
  es: { jobs: "Buscar empleos", consulting: "Consultoría para candidatos", training: "Formación", login: "Iniciar sesión", signup: "Crear cuenta", profile: "Abrir perfil" },
  fr: { jobs: "Trouver un emploi", consulting: "Conseil aux candidats", training: "Formations", login: "Se connecter", signup: "Créer un compte", profile: "Ouvrir le profil" },
  hi: { jobs: "नौकरियां खोजें", consulting: "उम्मीदवार परामर्श", training: "प्रशिक्षण", login: "साइन इन", signup: "खाता बनाएं", profile: "प्रोफ़ाइल खोलें" },
  zh: { jobs: "寻找工作", consulting: "候选人咨询", training: "培训", login: "登录", signup: "创建账户", profile: "打开个人资料" },
};

function NavIcon({ children }: { children: React.ReactNode }) { return <span className="nav-action-icon" aria-hidden="true">{children}</span>; }

export function SiteHeader({ signedIn = false, accountHref = "/dashboard" }: SiteHeaderProps) {
  const [language, setLanguage] = useState("pt");
  useEffect(() => { const update = () => setLanguage(window.localStorage.getItem("okutijobs-language") || "pt"); update(); window.addEventListener("okutijobs-language-change", update); return () => window.removeEventListener("okutijobs-language-change", update); }, []);
  const t = copy[language] || copy.pt;
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="OkutiJobs — início"><span className="brand-lockup"><span className="brand-symbol"><img src="/icon.png" alt="" width="34" height="34" /></span><span className="brand-word">Okuti<span>Jobs</span></span></span></Link>
    <nav className="desktop-nav" aria-label="Navegação principal"><Link className="nav-action nav-action-jobs" href="/vagas"><NavIcon>⌕</NavIcon><span>{t.jobs}</span></Link><Link className="nav-action nav-action-support" href="/pagina-candidatos#consultoria-candidatos"><NavIcon>✦</NavIcon><span>{t.consulting}</span></Link><Link className="nav-action nav-action-services" href="/formacoes"><NavIcon>◈</NavIcon><span>{t.training}</span></Link></nav>
    <details className="mobile-nav-dropdown"><summary aria-label="Abrir menu">Menu</summary><div className="nav-dropdown-menu" role="menu"><Link href="/vagas" role="menuitem">{t.jobs}</Link><Link href="/pagina-candidatos#consultoria-candidatos" role="menuitem">{t.consulting}</Link><Link href="/formacoes" role="menuitem">{t.training}</Link></div></details>
    <div className="header-actions"><LanguageSwitcher /><DarkModeToggle />{signedIn ? <SignOutButton /> : <Link className="header-login" href="/login"><span className="login-dot" aria-hidden="true" />{t.login}</Link>}<Link className="button button-dark header-cta" href={signedIn ? "/profile" : "/login"}>{signedIn ? t.profile : t.signup} <span>↗</span></Link></div>
  </header>;
}
