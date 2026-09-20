"use client";

import { FormEvent, useState } from "react";
import type { TrainingCourse } from "@/lib/training";

export function TrainingEnrollmentForm({ course }: { course: TrainingCourse }) {
  const [type, setType] = useState<"pessoal" | "corporativa">("pessoal");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading"); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/training-enrollments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, course: course.title, enrolmentType: type }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setStatus("error"); setMessage(body.error || "Não foi possível enviar a inscrição."); return; }
    setStatus("success"); setMessage("O seu pedido foi enviado. A equipa OkutiJobs entrará em contacto para confirmar a turma e os próximos passos.");
    event.currentTarget.reset();
  }

  return <section className="training-enrolment-card" id="inscricao"><div className="training-form-heading"><p className="eyebrow">Inscrição</p><h2>Reserve o seu lugar.</h2><p>Escolha uma inscrição pessoal ou solicite uma proposta para a sua empresa.</p></div><div className="enrolment-type-toggle" role="tablist" aria-label="Tipo de inscrição"><button type="button" className={type === "pessoal" ? "active" : ""} onClick={() => setType("pessoal")}>Inscrição pessoal</button><button type="button" className={type === "corporativa" ? "active" : ""} onClick={() => setType("corporativa")}>Inscrição corporativa</button></div><form onSubmit={submit} className="training-enrolment-form"><input type="hidden" name="enrolmentType" value={type} /><label>Nome completo<input name="name" required minLength={2} placeholder="Como te devemos chamar?" /></label><div className="form-two-columns"><label>Email<input type="email" name="email" required placeholder="nome@exemplo.com" /></label><label>Telefone / WhatsApp<input name="phone" required minLength={7} placeholder="936 161 636" /></label></div>{type === "corporativa" ? <div className="form-two-columns"><label>Empresa / organização<input name="organisation" required placeholder="Nome da organização" /></label><label>Número de participantes<input name="participants" type="number" min="1" placeholder="Ex.: 10" /></label></div> : null}<label>Observação<textarea name="note" rows={4} placeholder={type === "corporativa" ? "Indique o objectivo da formação e necessidades da equipa." : "Indique alguma preferência ou questão sobre esta formação."} /></label>{message ? <p className={`form-message ${status === "success" ? "success" : ""}`} role="status">{message}</p> : null}<button className="button button-orange" type="submit" disabled={status === "loading"}>{status === "loading" ? "A enviar…" : "Enviar pedido de inscrição ↗"}</button></form></section>;
}
