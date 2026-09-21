import Link from "next/link";
import { AdminLoginForm } from "@/components/AdminLoginForm";

type AdminLoginPageProps = { searchParams: Promise<{ error?: string }> };

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const initialMessage = params.error === "admin-required" ? "A conta entrou correctamente, mas não está autorizada como membro da equipa administrativa." : params.error === "configuration" ? "O serviço de autenticação está temporariamente indisponível." : null;
  return <main className="admin-login-page"><section className="admin-login-card"><Link className="admin-login-brand" href="/">Okuti<span>Jobs</span><small>Super Admin</small></Link><div className="admin-login-icon">⌘</div><p className="eyebrow">Área reservada à equipa</p><h1>Entrar no Super Admin.</h1><p className="admin-login-lede">Faça a gestão de candidatos, empresas, vagas, candidaturas, documentos, créditos e operações da plataforma.</p>{initialMessage ? <p className="admin-login-error" role="alert">{initialMessage}</p> : null}<AdminLoginForm /><Link className="admin-login-back" href="/">← Voltar ao site público</Link></section></main>;
}
