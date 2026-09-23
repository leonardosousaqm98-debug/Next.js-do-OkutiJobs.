"use client";

import { FormEvent, useState } from "react";

type ProfileDraft = { role: string; seniority: string; experience: string; education: string; responsibilities: string; skills: string; salary: string };
type Props = { open: boolean; onClose: () => void };

const emptyProfile: ProfileDraft = { role: "", seniority: "", experience: "", education: "", responsibilities: "", skills: "", salary: "" };

export function RecruitmentProposalModal({ open, onClose }: Props) {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [vacancies, setVacancies] = useState("1");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState("");
  const [profile, setProfile] = useState<ProfileDraft>(emptyProfile);
  const [status, setStatus] = useState<"idle" | "analysing" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!open) return null;

  const readFile = (selected: File | undefined) => {
    if (!selected) return;
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(selected.type) || selected.size > 8 * 1024 * 1024) { setMessage("Anexe apenas PDF, DOC ou DOCX até 8 MB."); return; }
    setFile(selected); setMessage("");
    const reader = new FileReader(); reader.onload = () => setFileData(typeof reader.result === "string" ? reader.result : ""); reader.readAsDataURL(selected);
  };

  const analyse = async () => {
    if (!description.trim() && !fileData) { setMessage("Escreva a descrição do perfil ou anexe uma JD antes de usar o Gemini."); return; }
    setStatus("analysing"); setMessage("");
    try {
      const response = await fetch("/api/recruitment-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description, fileName: file?.name || "", fileData }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível analisar o perfil.");
      setProfile({ ...emptyProfile, ...data.profile }); setDescription(data.sourceText || description); setMessage("Perfil estruturado pelo Gemini. Pode rever e editar antes de enviar."); setStatus("idle");
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Não foi possível usar o Gemini agora."); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (company.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(contact) || Number(vacancies) < 1 || (!description.trim() && !fileData && !profile.role.trim())) { setStatus("error"); setMessage("Preencha a empresa, email, quantidade de vagas e o perfil pretendido."); return; }
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/recruitment-proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, contact, phone, vacancies: Number(vacancies), location, description, profile, fileName: file?.name || "", fileData }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar o pedido.");
      setStatus("success"); setMessage("Pedido enviado. A equipa OkutiJobs entrará em contacto para preparar a proposta.");
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Não foi possível enviar o pedido."); }
  };

  return <div className="modal-backdrop recruitment-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recruitment-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="recruitment-modal">
    <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
    {status === "success" ? <div className="recruitment-success"><span className="success-mark">✓</span><p className="eyebrow">Solicitação recebida</p><h2 id="recruitment-title">Vamos desenhar a equipa certa.</h2><p>{message}</p><button type="button" className="button button-orange" onClick={onClose}>Concluir</button></div> : <>
      <p className="eyebrow">Recrutamento especializado</p><h2 id="recruitment-title">Conte-nos de que talento precisa.</h2><p className="recruitment-lede">Envie o briefing da sua empresa. Se ainda não tiver uma descrição pronta, o Gemini ajuda a transformar a sua ideia num perfil claro para recrutamento.</p>
      <form onSubmit={submit} className="recruitment-form">
        <div className="recruitment-form-grid"><label>Nome da empresa<input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex.: Empresa, Lda." required /></label><label>Email de contacto<input type="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="rh@empresa.co.ao" required /></label><label>Telefone / WhatsApp<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+244 ..." /></label><label>Quantidade de vagas<input type="number" min="1" max="500" value={vacancies} onChange={(e) => setVacancies(e.target.value)} required /></label><label className="wide-field">Localização das vagas<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Luanda, Angola ou remoto" /></label></div>
        <div className="recruitment-source"><div className="recruitment-source-heading"><div><span className="form-label-title">Descrição dos perfis</span><p>Escolha uma das opções ou use as duas.</p></div><button type="button" className="button button-outline recruitment-ai-button" onClick={analyse} disabled={status === "analysing"}>{status === "analysing" ? "A analisar…" : "✦ Preencher com Gemini"}</button></div><label className="upload-drop">{file ? <><strong>{file.name}</strong><span>Documento pronto para análise</span></> : <><strong>Anexar JD</strong><span>PDF, DOC ou DOCX · máximo 8 MB</span></>}<input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => readFile(e.target.files?.[0])} /></label><label className="wide-field">Ou escreva a descrição dos perfis<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Procuramos um Director Financeiro com 8 anos de experiência..." rows={5} /></label></div>
        <fieldset className="recruitment-profile-fields"><legend>Perfil estruturado {profile.role && <span>· editável</span>}</legend><div className="recruitment-form-grid"><label>Cargo / função<input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} placeholder="Será preenchido pelo Gemini" /></label><label>Nível de senioridade<input value={profile.seniority} onChange={(e) => setProfile({ ...profile, seniority: e.target.value })} placeholder="Júnior, Pleno, Sénior..." /></label><label>Experiência<input value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} placeholder="Anos e contexto" /></label><label>Formação<input value={profile.education} onChange={(e) => setProfile({ ...profile, education: e.target.value })} placeholder="Licenciatura, curso técnico..." /></label><label className="wide-field">Responsabilidades<textarea value={profile.responsibilities} onChange={(e) => setProfile({ ...profile, responsibilities: e.target.value })} rows={3} /></label><label className="wide-field">Competências essenciais<textarea value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} rows={2} /></label><label>Faixa salarial<input value={profile.salary} onChange={(e) => setProfile({ ...profile, salary: e.target.value })} placeholder="Opcional" /></label></div></fieldset>
        {message && <p className={`form-message ${status === "error" ? "error" : "success"}`} role="status">{message}</p>}<div className="recruitment-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancelar</button><button type="submit" className="button button-orange" disabled={status === "sending"}>{status === "sending" ? "A enviar…" : "Solicitar proposta ↗"}</button></div>
      </form>
    </>}
  </section></div>;
}
