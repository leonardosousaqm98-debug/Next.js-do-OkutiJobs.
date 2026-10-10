import Link from "next/link";
import { CrmEmailOtpForm } from "@/components/CrmEmailOtpForm";

type CrmLoginPageProps = { searchParams: Promise<{ error?: string }> };

export default async function CrmLoginPage({ searchParams }: CrmLoginPageProps) {
  const params = await searchParams;
  const initialError = params.error === "domain"
    ? "O CRM só aceita endereços confirmados @okutijobs.com."
    : params.error === "configuration"
      ? "O serviço de autenticação está temporariamente indisponível."
      : params.error === "password"
        ? "A sessão do CRM expirou. Confirme novamente o código e a senha comum."
        : "";

  return <main className="admin-login-page">
    <section className="admin-login-card">
      <Link className="admin-login-brand" href="/">Okuti<span>Jobs</span><small>CRM</small></Link>
      <div className="admin-login-icon" aria-hidden="true">@</div>
      <p className="eyebrow">Área interna · acesso em dois passos</p>
      <h1>Entrar no CRM.</h1>
      <p className="admin-login-lede">Confirme o seu email individual @okutijobs.com com um código OTP de oito dígitos e, em seguida, introduza a senha comum interna para abrir o pipeline comercial.</p>
      <CrmEmailOtpForm initialError={initialError} />
      <Link className="admin-login-back" href="https://okutijobs.com">← Voltar ao site OkutiJobs</Link>
    </section>
  </main>;
}
