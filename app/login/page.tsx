import { EmailAuthForm } from "@/components/EmailAuthForm";

type LoginPageProps = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : undefined;
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-card">
          <aside className="auth-visual" aria-label="Benefícios da OkutiJobs">
            <div className="visual-brand"><span>O</span> OkutiJobs</div>
            <div className="visual-copy"><p className="eyebrow">O seu próximo passo</p><h1>Talento que encontra o seu lugar.</h1><p>Crie o seu espaço profissional, descubra oportunidades e avance com mais confiança.</p></div>
            <div className="visual-orbit" aria-hidden="true" />
            <div className="visual-stat"><strong>+ oportunidades</strong><span>num só lugar</span></div>
          </aside>
          <div className="auth-form-panel">
            <div>
              <p className="eyebrow">Acesso seguro</p>
              <h2 className="auth-title">Bem-vindo de volta.</h2>
              <p className="auth-lede">Entre na sua conta ou crie o seu perfil profissional.</p>
              <EmailAuthForm nextPath={nextPath} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
