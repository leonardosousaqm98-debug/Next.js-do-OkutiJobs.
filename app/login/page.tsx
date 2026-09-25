import { EmailAuthForm } from "@/components/EmailAuthForm";
import { LampLoginVisual } from "@/components/LampLoginVisual";

type LoginPageProps = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : undefined;
  const accessMessage = params.error === "admin-required" ? "Esta conta ainda não tem acesso ao painel administrativo. Entre com o email de um membro activo da equipa OkutiJobs." : params.error === "configuration" ? "O serviço de autenticação está temporariamente indisponível. Tente novamente dentro de instantes." : null;
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-card">
          <aside className="auth-visual" aria-label="O próximo passo profissional começa aqui">
            <div className="visual-brand"><span>O</span> OkutiJobs</div>
            <LampLoginVisual />
            <div className="visual-copy"><p className="eyebrow">O seu próximo passo</p><h1>Talento que encontra o seu lugar.</h1><p>Entre na sua conta e acenda novas oportunidades para a sua carreira.</p></div>
            <div className="visual-stat"><strong>+ oportunidades</strong><span>num só lugar</span></div>
          </aside>
          <div className="auth-form-panel">
            <div>
              <p className="eyebrow">Acesso seguro</p>
              <h2 className="auth-title">Bem-vindo de volta.</h2>
              <p className="auth-lede">Entre na sua conta ou crie o seu perfil profissional.</p>
              {accessMessage ? <p className="auth-access-message" role="alert">{accessMessage}</p> : null}
              <EmailAuthForm nextPath={nextPath} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
