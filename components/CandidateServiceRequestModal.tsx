"use client";

import { useState } from "react";

export type CandidateConsultingService = { title: string; text: string; price: string; action: string };

export function CandidateServiceRequestModal({ service, onClose }: { service: CandidateConsultingService; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "" });
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("loading"); setMessage("");
    const response = await fetch("/api/candidate-service-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ service: service.title, price: service.price, ...form }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setState("error"); setMessage(body.error || "Não foi possível enviar a solicitação."); return; }
    setState("success"); setMessage("A sua solicitação foi enviada. A equipa comercial entrará em contacto consigo.");
  }
  return <div className="modal-backdrop service-request-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && state !== "loading") onClose(); }}><section className="service-request-modal" role="dialog" aria-modal="true" aria-labelledby="service-request-title"><button type="button" className="modal-close" onClick={onClose} aria-label="Fechar formulário">×</button>{state === "success" ? <div className="modal-success"><span className="success-mark">✓</span><p className="eyebrow">Solicitação enviada</p><h2 id="service-request-title">Recebemos os seus dados.</h2><p>{message}</p><button type="button" className="button button-orange" onClick={onClose}>Concluir</button></div> : <><p className="eyebrow">Consultoria OkutiJobs</p><h2 id="service-request-title">{service.title}</h2><p className="service-request-intro">Preencha os seus dados. A equipa responderá pelo contacto indicado para combinar os próximos passos.</p><div className="service-request-summary"><span>Serviço seleccionado</span><strong>{service.price}</strong><p>{service.text}</p></div><form onSubmit={submit} className="service-request-form"><label>Nome completo<input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Como te devemos chamar?" /></label><div className="service-request-two-columns"><label>Contacto / WhatsApp<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+244 9XX XXX XXX" /></label><label>E-mail<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="nome@exemplo.com" /></label></div><label>Observação<textarea required minLength={10} value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="Conta-nos brevemente o que precisas ou o teu objectivo profissional." rows={5} /></label>{message && <p className="form-message" role="alert">{message}</p>}<button className="button button-orange service-request-submit" disabled={state === "loading"} type="submit">{state === "loading" ? "A enviar…" : "Solicitar o serviço"}<span>→</span></button></form></>}</section></div>;
}
