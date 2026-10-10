import Link from "next/link";
import { CrmMagicLinkForm } from "@/components/CrmMagicLinkForm";

type CrmLoginPageProps = { searchParams: Promise<{ error?: string }> };

export default async function CrmLoginPage({ searchParams }: CrmLoginPageProps) {
  const params = await searchParams;
  const initialError = params.error === "domain"
    ? "O CRM só aceita endereços confirmados @okutijobs.com."
    : params.error === "configuration"
      ? "O serviço de autenticação está temporariamente indisponível."
      : "";

  return <main className="admin-login-page">
    <section className="admin-login-card">
      <Link className="admin-login-brand" href="/">Okuti<span>Jobs</span><small>CRM</small></Link>
      <div className="admin-login-icon" aria-hidden="true">@</div>
      <p className="eyebrow">Área interna · acesso por email</p>
      <h1>Entrar no CRM.</h1>
      <p className="admin-login-lede">Introduza o seu email individual @okutijobs.com. Enviaremos um link de uso único para confirmar a sua identidade e abrir o pipeline comercial.</p>
      <CrmMagicLinkForm initialError={initialError} />
      <Link className="admin-login-back" href="https://okutijobs.com">← Voltar ao site OkutiJobs</Link>
    </section>
  </main>;
}
