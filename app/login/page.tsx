import { EmailAuthForm } from "@/components/EmailAuthForm";
import { LampLoginVisual } from "@/components/LampLoginVisual";

type LoginPageProps = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : undefined;
  const accessMessage = params.error === "admin-required"
    ? "Esta conta ainda não tem acesso ao painel administrativo."
    : params.error === "configuration"
      ? "O serviço de autenticação está temporariamente indisponível."
      : null;

  return (
    <main className="lamp-auth-page">
      <div className="lamp-auth-grid-glow" aria-hidden="true" />
      <header className="lamp-auth-heading">
        <a className="lamp-auth-back" href="/" aria-label="Voltar ao site">‹</a>
        <h1>Animated <span>Lamp Login</span></h1>
        <p>Acenda novas oportunidades para a sua carreira.</p>
      </header>

      <section className="lamp-auth-frame" aria-label="Autenticação OkutiJobs">
        <div className="lamp-auth-stage">
          <div className="lamp-window-dots" aria-hidden="true"><i /><i /><i /></div>
          <LampLoginVisual />
          <div className="lamp-stage-caption"><span>OkutiJobs</span><strong>O seu próximo passo começa aqui.</strong></div>
        </div>
        <div className="lamp-auth-panel">
          <div className="lamp-auth-panel-inner">
            <div className="lamp-auth-welcome">
              <p className="lamp-kicker">Acesso à plataforma</p>
              <h2>Welcome Back</h2>
              <p>Entre nos seus detalhes para aceder à sua conta.</p>
            </div>
            {accessMessage ? <p className="auth-access-message" role="alert">{accessMessage}</p> : null}
            <EmailAuthForm nextPath={nextPath} />
          </div>
        </div>
      </section>

      <div className="lamp-code-row" aria-hidden="true">
        <div className="lamp-code-window"><div className="lamp-window-dots"><i /><i /><i /></div><code><em>.lamp-side</em> &#123;<br />&nbsp;&nbsp;display: flex;<br />&nbsp;&nbsp;align-items: center;<br />&nbsp;&nbsp;justify-content: center;<br />&#125;</code></div>
        <div className="lamp-code-window lamp-code-window-small"><div className="lamp-window-dots"><i /><i /><i /></div><code><em>.room.on</em><br />&nbsp;&nbsp;.desk-surface &#123;<br />&nbsp;&nbsp;&nbsp;&nbsp;opacity: 1;<br />&nbsp;&nbsp;&#125;</code></div>
      </div>
      <p className="lamp-auth-footer">Acesso simples, seguro e feito para o seu próximo capítulo.</p>
    </main>
  );
}
