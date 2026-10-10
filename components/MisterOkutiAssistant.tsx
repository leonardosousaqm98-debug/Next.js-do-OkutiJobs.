"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Role = "candidate" | "company";
type Opportunity = { id: string; slug: string; title: string; company: string; location: string; workMode: string; contractType: string; publishedAt: string; matchTerms: string[] };
type Talent = { id: string; headline: string; currentTitle: string; desiredJobTitle: string; seniority: string; studyField: string; location: string; skills: string[]; matchTerms: string[] };
type JobDraft = Record<string, unknown> & { title: string; description: string; requirements?: string };
type Turn = { id: number; role: "user" | "assistant"; text: string; opportunities?: Opportunity[]; talents?: Talent[]; jobDraft?: JobDraft | null };

const suggestions: Record<Role, string[]> = {
  candidate: ["Que vagas combinam com o meu perfil?", "Procuro oportunidades de contabilidade em Luanda.", "Que informação devo completar no meu perfil?"],
  company: ["Procuro candidatos com Excel e contabilidade em Luanda.", "Ajuda-me a redigir uma vaga de Técnico de Contabilidade.", "Como posso pesquisar talentos por competências?"],
};

function greeting(role: Role) {
  return role === "candidate"
    ? "Olá! Sou o Mister Okuti. Posso esclarecer dúvidas sobre vagas publicadas e ajudar a encontrar oportunidades relacionadas com o teu perfil. O que procuras?"
    : "Olá! Sou o Mister Okuti. Posso ajudar a redigir uma vaga editável ou a pesquisar perfis públicos por competências. Os resultados apoiam a análise da equipa; a decisão final é sempre humana.";
}

export function MisterOkutiAssistant({ role, returnTo }: { role: Role; returnTo: string }) {
  const [messages, setMessages] = useState<Turn[]>([{ id: 0, role: "assistant", text: greeting(role) }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const threadEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { threadEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  async function send(value = input) {
    const message = value.trim();
    if (!message || busy) return;
    const previous = messages.slice(-8).filter((turn) => turn.id !== 0).map((turn) => ({ role: turn.role, content: turn.text }));
    const userTurn: Turn = { id: Date.now(), role: "user", text: message };
    setMessages((current) => [...current, userTurn]);
    setInput("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/mister-okuti", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history: previous }),
      });
      const payload = await response.json().catch(() => ({})) as {
        error?: string; reply?: string; opportunities?: Opportunity[]; talents?: Talent[]; jobDraft?: JobDraft | null;
      };
      if (!response.ok || !payload.reply) throw new Error(payload.error || "Não foi possível obter uma resposta.");
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        role: "assistant",
        text: payload.reply || "",
        opportunities: payload.opportunities || [],
        talents: payload.talents || [],
        jobDraft: payload.jobDraft || null,
      }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível contactar o Mister Okuti.");
    } finally {
      setBusy(false);
    }
  }

  function openDraft(draft: JobDraft) {
    window.localStorage.setItem("okutijobs-premium-job-draft", JSON.stringify(draft));
    window.location.assign("/empresa/vagas/nova");
  }

  async function copyDraft(draft: JobDraft) {
    const content = [draft.title, String(draft.description || ""), draft.requirements ? `Requisitos:\n${draft.requirements}` : ""].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar o rascunho neste navegador. Pode abri-lo no formulário da vaga.");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send();
  }

  return <main className="mister-page">
    <header className="mister-topbar">
      <a className="mister-brand" href={returnTo} aria-label="Voltar ao painel OkutiJobs"><span className="brand-symbol"><img src="/icon.png" alt="" width="34" height="34" /></span><span>Okuti<span>Jobs</span></span></a>
      <div className="mister-top-actions"><a href="/vagas">Explorar vagas</a><a className="button button-dark" href={returnTo}>Voltar ao painel <span>↗</span></a></div>
    </header>

    <section className="mister-shell" aria-labelledby="mister-title">
      <div className="mister-intro">
        <div><p className="eyebrow">Assistente virtual OkutiJobs</p><h1 id="mister-title">Mister <em>Okuti.</em></h1><p className="mister-lede">Uma conversa para aproximar competências, oportunidades e decisões mais informadas.</p></div>
        <span className="mister-role-badge">{role === "candidate" ? "Área do candidato" : "Área da empresa"}</span>
      </div>

      <div className="mister-workspace">
        <aside className="mister-info-card">
          <span className="mister-orbit" aria-hidden="true">O</span>
          <p className="eyebrow">Como posso ajudar</p>
          {role === "candidate" ? <><h2>O próximo passo começa com uma boa pergunta.</h2><ul><li>Explicar requisitos e detalhes de vagas publicadas.</li><li>Relacionar oportunidades com os dados profissionais do teu perfil.</li><li>Indicar que informação pode melhorar uma pesquisa.</li></ul><a className="mister-side-link" href="/profile">Rever o meu perfil <span>↗</span></a></> : <><h2>Mais clareza para encontrar e atrair talento.</h2><ul><li>Preparar rascunhos de anúncios a partir do briefing fornecido.</li><li>Pesquisar competências em perfis públicos disponíveis.</li><li>Explorar correspondências sem automatizar decisões.</li></ul><a className="mister-side-link" href="/empresa/talentos">Abrir o Banco de Talentos <span>↗</span></a></>}
          <div className="mister-privacy-note"><strong>Privacidade e revisão humana</strong><span>{role === "candidate" ? "A pesquisa usa apenas o teu perfil autenticado e vagas publicadas. A candidatura continua sempre sob o teu controlo." : "A pesquisa usa apenas perfis públicos e disponíveis. Confirma toda a informação e revê cada anúncio antes de o utilizar."}</span></div>
        </aside>

        <section className="mister-chat-card" aria-label="Conversa com o Mister Okuti">
          <div className="mister-chat-heading"><div><span className="mister-status-dot" /><div><strong>Mister Okuti</strong><small>{role === "candidate" ? "Apoio a candidatos" : "Apoio a recrutadores"}</small></div></div><span className="mister-secure-label">Sessão protegida</span></div>
          <div className="mister-thread" aria-live="polite" aria-relevant="additions text">
            {messages.map((turn) => <article className={`mister-turn ${turn.role}`} key={turn.id}>
              <span className="mister-turn-avatar" aria-hidden="true">{turn.role === "assistant" ? "O" : "Tu"}</span>
              <div className="mister-turn-content">
                <div className="mister-bubble"><p>{turn.text}</p></div>
                {turn.opportunities?.length ? <div className="mister-results"><h3>Vagas publicadas relacionadas</h3>{turn.opportunities.map((job) => <article className="mister-result-card" key={job.id}><div><span className="job-tag">Vaga publicada</span><h4>{job.title}</h4><p>{job.company} · {job.location}</p><small>{[job.workMode, job.contractType].filter(Boolean).join(" · ")}</small>{job.matchTerms.length ? <div className="mister-match-terms">Termos relacionados: {job.matchTerms.slice(0, 5).join(", ")}</div> : null}</div><a className="button button-dark" href={`/vagas/${encodeURIComponent(job.slug)}`}>Ver vaga <span>↗</span></a></article>)}</div> : null}
                {turn.talents?.length ? <div className="mister-results"><h3>Perfis públicos relacionados</h3>{turn.talents.map((talent) => <article className="mister-result-card" key={talent.id}><div><span className="job-tag">Perfil público · disponível</span><h4>{talent.desiredJobTitle || talent.currentTitle || talent.headline || "Profissional"}</h4><p>{[talent.seniority, talent.location, talent.studyField].filter(Boolean).join(" · ") || "Detalhes profissionais no perfil"}</p>{talent.skills.length ? <div className="mister-skill-chips">{talent.skills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div> : null}{talent.matchTerms.length ? <div className="mister-match-terms">Competências/termos encontrados: {talent.matchTerms.slice(0, 5).join(", ")}</div> : null}</div><a className="button button-dark" href={`/empresa/talentos/${encodeURIComponent(talent.id)}`}>Rever perfil <span>↗</span></a></article>)}<p className="mister-human-note">A ordenação é uma ajuda de pesquisa, não uma avaliação nem uma decisão de contratação.</p></div> : null}
                {turn.jobDraft ? <div className="mister-draft-card"><div><p className="eyebrow">Rascunho editável</p><h3>{turn.jobDraft.title}</h3><p>{turn.jobDraft.description}</p>{turn.jobDraft.requirements ? <details><summary>Ver requisitos</summary><p>{turn.jobDraft.requirements}</p></details> : null}<small>O anúncio não foi guardado nem publicado. Reveja e complete os campos em falta no formulário.</small></div><div className="mister-draft-actions"><button type="button" className="button button-dark" onClick={() => openDraft(turn.jobDraft!)}>Preencher formulário <span>↗</span></button><button type="button" className="mister-copy-button" onClick={() => void copyDraft(turn.jobDraft!)}>{copied ? "Copiado" : "Copiar texto"}</button></div></div> : null}
              </div>
            </article>)}
            {busy ? <div className="mister-thinking" role="status"><span className="mister-turn-avatar" aria-hidden="true">O</span><span><i /> <i /> <i /> A preparar uma resposta…</span></div> : null}
            <div ref={threadEnd} />
          </div>
          {messages.length === 1 && <div className="mister-suggestions" aria-label="Sugestões de perguntas">{suggestions[role].map((suggestion) => <button key={suggestion} type="button" onClick={() => void send(suggestion)} disabled={busy}>{suggestion}</button>)}</div>}
          {error ? <p className="mister-error" role="alert">{error}</p> : null}
          <form className="mister-composer" onSubmit={submit}><label className="sr-only" htmlFor="mister-message">A sua mensagem</label><textarea id="mister-message" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={role === "candidate" ? "Pergunte sobre uma vaga ou descreva o que procura…" : "Descreva a vaga ou as competências que procura…"} maxLength={2000} rows={2} disabled={busy} /><div className="mister-composer-footer"><span>{input.length}/2000 · Enter para enviar, Shift+Enter para nova linha</span><button type="submit" className="button button-orange" disabled={busy || !input.trim()}>{busy ? "A responder…" : "Enviar mensagem"} <span>↗</span></button></div></form>
          <p className="mister-disclaimer">As mensagens e o contexto profissional limitado necessário são processados pelo fornecedor de IA configurado no servidor; a aplicação não guarda esta conversa. As respostas podem conter imprecisões: confirme os detalhes directamente na vaga ou no perfil.</p>
        </section>
      </div>
    </section>
  </main>;
}
