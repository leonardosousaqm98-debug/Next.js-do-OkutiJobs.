"use client";

import { useEffect, useRef, useState } from "react";

type Intent = "job" | "training" | null;
type Step = "intent" | "job-title" | "job-location" | "job-profile" | "training-topic" | "training-audience" | "training-contact" | "done";

type VoiceEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type VoiceRecognition = { lang: string; interimResults: boolean; onresult: ((event: VoiceEvent) => void) | null; onerror: (() => void) | null; start: () => void; abort: () => void };
type Message = { from: "assistant" | "company"; text: string };

const initialMessage = "Olá. Sou o assistente premium OkutiJobs. O que precisa de preparar hoje?";

export function PremiumCompanyAssistant({ email }: { email: string }) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [intent, setIntent] = useState<Intent>(null);
  const [step, setStep] = useState<Step>("intent");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: "assistant", text: initialMessage }]);
  const [job, setJob] = useState({ title: "", location: "", profile: "" });
  const [training, setTraining] = useState({ topic: "", audience: "", contact: "" });
  const [error, setError] = useState("");
  const recognition = useRef<VoiceRecognition | null>(null);

  useEffect(() => () => recognition.current?.abort(), []);
  function speak(text: string) { if (mode === "voice" && "speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); }
  function say(text: string) { setMessages((current) => [...current, { from: "assistant", text }]); speak(text); }
  function reset() { setIntent(null); setStep("intent"); setInput(""); setJob({ title: "", location: "", profile: "" }); setTraining({ topic: "", audience: "", contact: "" }); setError(""); setMessages([{ from: "assistant", text: initialMessage }]); }
  function choose(next: Exclude<Intent, null>) { setIntent(next); setError(""); if (next === "job") { setStep("job-title"); say("Vamos preparar a vaga. Qual é o nome do cargo ou função?"); } else { setStep("training-topic"); say("Vamos preparar o pedido de formação. Que tema ou competência pretende desenvolver?"); } }
  function startVoice() {
    const Speech = (window as typeof window & { SpeechRecognition?: new () => VoiceRecognition; webkitSpeechRecognition?: new () => VoiceRecognition }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: new () => VoiceRecognition }).webkitSpeechRecognition;
    if (!Speech) return setError("O seu navegador não disponibiliza entrada de voz. Pode continuar pelo chat.");
    const instance = new Speech() as VoiceRecognition; instance.lang = "pt-PT"; instance.interimResults = false; instance.onresult = (event) => setInput(event.results[0][0].transcript); instance.onerror = () => setError("Não foi possível ouvir. Tente novamente ou escreva a resposta."); recognition.current = instance; instance.start();
  }
  async function submit(value = input) {
    const answer = value.trim(); if (!answer || busy) return;
    setMessages((current) => [...current, { from: "company", text: answer }]); setInput(""); setError("");
    if (step === "job-title") { setJob((current) => ({ ...current, title: answer })); setStep("job-location"); return say("Em que localização será a vaga e qual será o modelo de trabalho: presencial, híbrido ou remoto?"); }
    if (step === "job-location") { setJob((current) => ({ ...current, location: answer })); setStep("job-profile"); return say("Descreva a experiência, formação e competências que procura. Pode escrever livremente; eu organizo tudo para si."); }
    if (step === "job-profile") { const nextJob = { ...job, profile: answer }; setJob(nextJob); setBusy(true); try { const brief = `Cargo: ${nextJob.title}\nLocalização e modelo: ${nextJob.location}\nPerfil procurado: ${nextJob.profile}`; const response = await fetch("/api/jobs/ai-draft", { method: "POST", body: (() => { const form = new FormData(); form.append("brief", brief); return form; })() }); const body = await response.json().catch(() => ({})); if (!response.ok || !body.draft) throw new Error(body.error || "Não foi possível preparar a vaga."); window.localStorage.setItem("okutijobs-premium-job-draft", JSON.stringify(body.draft)); setStep("done"); say("O diagnóstico da vaga está concluído. Preparei um anúncio editável com os requisitos encontrados. Abra o formulário para rever e publicar quando estiver pronto."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível concluir o diagnóstico."); } finally { setBusy(false); } return; }
    if (step === "training-topic") { setTraining((current) => ({ ...current, topic: answer })); setStep("training-audience"); return say("Para quem é a formação e quantas pessoas pretende envolver?"); }
    if (step === "training-audience") { setTraining((current) => ({ ...current, audience: answer })); setStep("training-contact"); return say("Indique um telefone ou WhatsApp para a equipa comercial entrar em contacto consigo."); }
    if (step === "training-contact") { const nextTraining = { ...training, contact: answer }; setTraining(nextTraining); setBusy(true); try { const response = await fetch("/api/training-enrollments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ course: nextTraining.topic, enrolmentType: "corporativa", name: "Empresa OkutiJobs", email, phone: nextTraining.contact, organisation: "Conta empresarial OkutiJobs", participants: nextTraining.audience, note: "Pedido criado pelo Assistente Premium. Solicita diagnóstico comercial e proposta ajustada." }) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || "Não foi possível enviar o pedido."); setStep("done"); say("Pedido enviado à equipa comercial. Entraremos em contacto para confirmar objectivos, formato, duração e proposta."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível enviar o pedido."); } finally { setBusy(false); } }
  }
  return <section className={`premium-assistant ${open ? "is-open" : ""}`}><div className="premium-assistant-hero"><div><span className="premium-badge">PREMIUM</span><h2>Assistente de recrutamento</h2><p>Fale connosco por chat ou voz. Preparamos a sua vaga ou pedido de formação.</p></div><button type="button" className="button button-orange" onClick={() => setOpen((value) => !value)}>{open ? "Fechar assistente" : "Abrir modo premium ↗"}</button></div>{open ? <div className="premium-assistant-panel"><div className="premium-mode-switch"><span>Modo de atendimento</span><button type="button" className={mode === "chat" ? "active" : ""} onClick={() => setMode("chat")}>Chat</button><button type="button" className={mode === "voice" ? "active" : ""} onClick={() => setMode("voice")}>Voz</button><button type="button" className="assistant-reset" onClick={reset}>Recomeçar</button></div><div className="premium-chat" aria-live="polite">{messages.map((message, index) => <p className={`premium-message ${message.from}`} key={`${message.from}-${index}`}>{message.text}</p>)}</div>{step === "intent" ? <div className="premium-intents"><button type="button" onClick={() => choose("job")}><strong>Preciso de uma vaga</strong><small>Diagnóstico, descrição e publicação</small></button><button type="button" onClick={() => choose("training")}><strong>Preciso de formação</strong><small>Levantamento de necessidades e proposta</small></button></div> : step === "done" ? <div className="premium-complete">{intent === "job" ? <a className="button button-orange" href="/empresa/vagas/nova">Abrir vaga preparada ↗</a> : <a className="button button-orange" href="mailto:comercial@okutijobs.com">Falar com a equipa comercial ↗</a>}</div> : <div className="premium-input-row"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submit(); }} placeholder="Escreva a sua resposta…" disabled={busy} /><button type="button" className="button button-dark" onClick={mode === "voice" ? startVoice : () => void submit()} disabled={busy}>{mode === "voice" ? "Falar" : busy ? "A preparar…" : "Enviar"}</button></div>}{error ? <p className="form-error" role="alert">{error}</p> : null}</div> : null}</section>;
}
