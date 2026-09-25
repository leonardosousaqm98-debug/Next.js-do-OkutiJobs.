import Link from "next/link";
import { ErrorIllustration } from "@/components/ErrorIllustration";

export default function NotFound() {
  return (
    <main className="error-page" role="main">
      <div className="error-topline">
        <Link className="error-brand" href="/" aria-label="Voltar à página inicial OkutiJobs">
          <span>O</span> OkutiJobs
        </Link>
        <span className="error-topcode">ERRO DE NAVEGAÇÃO / 404</span>
      </div>
      <section className="error-content" aria-labelledby="not-found-title">
        <div className="error-copy">
          <p className="error-eyebrow">Parece que se perdeu</p>
          <h1 id="not-found-title"><span>404</span> Página não encontrada.</h1>
          <p className="error-lede">O endereço que procura não está disponível ou foi movido. Mas ainda há muitos caminhos para encontrar a próxima oportunidade.</p>
          <div className="error-actions">
            <Link className="button button-orange" href="/">Voltar ao início <span>↗</span></Link>
            <Link className="error-secondary-link" href="/vagas">Explorar vagas <span>→</span></Link>
          </div>
        </div>
        <ErrorIllustration />
      </section>
      <div className="error-code-card" aria-hidden="true">
        <span className="code-dot dot-red" /><span className="code-dot dot-yellow" /><span className="code-dot dot-green" />
        <code><i>.page_404</i> &#123;<br />&nbsp;&nbsp;color: <b>var(--sun)</b>;<br />&nbsp;&nbsp;path: <b>not_found</b>;<br />&#125;</code>
      </div>
    </main>
  );
}
