"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CandidateProfile = {
  fullName: string;
  preferredLanguage: string;
  headline: string;
  bio: string;
  country: string;
  province: string;
  municipality: string;
  city: string;
  preferredWorkMode: string;
  contractType: string;
  academicLevel: string;
  studyField: string;
  currentTitle: string;
  salaryMinKz: string;
  salaryMaxKz: string;
  availability: string;
  willingToRelocate: boolean;
  willingToTravel: boolean;
  openToWork: boolean;
  visibility: string;
  certifications: string;
  languages: string;
  experience: string;
  education: string;
  skills: string;
  portfolioUrl: string;
};

const emptyProfile: CandidateProfile = { fullName: "", preferredLanguage: "pt", headline: "", bio: "", country: "Angola", province: "", municipality: "", city: "", preferredWorkMode: "", contractType: "", academicLevel: "", studyField: "", currentTitle: "", salaryMinKz: "", salaryMaxKz: "", availability: "", willingToRelocate: false, willingToTravel: false, openToWork: true, visibility: "private", certifications: "", languages: "", experience: "", education: "", skills: "", portfolioUrl: "" };

function listToText(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join(", ") : "";
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile>(emptyProfile);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/profile").then(async (response) => {
      if (!response.ok) throw new Error("Não foi possível carregar o perfil.");
      return response.json() as Promise<{ profile?: { fullName?: string; preferredLanguage?: string }; candidate?: Record<string, unknown>; documents?: Array<{ original_name?: string }> }>;
    }).then((data) => {
      if (!active) return;
      const candidate = data.candidate ?? {};
      setProfile({ ...emptyProfile, fullName: data.profile?.fullName ?? "", preferredLanguage: data.profile?.preferredLanguage ?? "pt", headline: String(candidate.headline ?? ""), bio: String(candidate.bio ?? ""), country: String(candidate.country ?? "Angola"), province: String(candidate.province ?? ""), municipality: String(candidate.municipality ?? ""), city: String(candidate.city ?? ""), preferredWorkMode: String(candidate.preferred_work_mode ?? ""), contractType: String(candidate.contract_type ?? ""), academicLevel: String(candidate.academic_level ?? ""), studyField: String(candidate.study_field ?? ""), currentTitle: String(candidate.current_title ?? ""), salaryMinKz: String(candidate.salary_min_kz ?? ""), salaryMaxKz: String(candidate.salary_max_kz ?? ""), availability: String(candidate.availability ?? ""), willingToRelocate: Boolean(candidate.willing_to_relocate), willingToTravel: Boolean(candidate.willing_to_travel), openToWork: candidate.open_to_work !== false, visibility: String(candidate.visibility ?? "private"), certifications: listToText(candidate.certifications), languages: listToText(candidate.languages), experience: listToText(candidate.experience), education: listToText(candidate.education), skills: listToText(candidate.skills), portfolioUrl: String(candidate.portfolio_url ?? "") });
      setDocumentName(data.documents?.[0]?.original_name ?? null);
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar o perfil."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const completeness = useMemo(() => {
    const fields = [profile.fullName, profile.headline, profile.bio, profile.country, profile.province, profile.city, profile.currentTitle, profile.academicLevel, profile.studyField, profile.preferredWorkMode, profile.contractType, profile.availability, profile.certifications, profile.languages, profile.experience, profile.education, profile.skills];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [profile]);

  function update(name: keyof CandidateProfile, value: string | boolean) {
    setProfile((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null); setError(null);
    const payload = { ...profile, certifications: profile.certifications.split(",").map((item) => item.trim()).filter(Boolean), languages: profile.languages.split(",").map((item) => item.trim()).filter(Boolean), experience: profile.experience.split("\n").map((item) => item.trim()).filter(Boolean), education: profile.education.split("\n").map((item) => item.trim()).filter(Boolean), skills: profile.skills.split(",").map((item) => item.trim()).filter(Boolean) };
    const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = (await response.json()) as { error?: string; completeness?: number };
    if (!response.ok) setError(result.error ?? "Não foi possível guardar o perfil."); else setMessage(`Perfil guardado com sucesso — ${result.completeness ?? completeness}% completo.`);
    setSaving(false);
  }

  async function uploadCv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setUploading(true); setMessage(null); setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/candidate/cv", { method: "POST", body: form });
    const result = (await response.json()) as { error?: string; fileName?: string };
    if (!response.ok) setError(result.error ?? "Não foi possível carregar o CV."); else { setDocumentName(result.fileName ?? "CV carregado"); setMessage(`CV carregado: ${result.fileName}`); }
    setUploading(false);
  }

  async function extractCv() {
    setExtracting(true); setMessage(null); setError(null);
    const response = await fetch("/api/profile/extract", { method: "POST" });
    const result = (await response.json()) as { error?: string; extracted?: Record<string, unknown> };
    if (!response.ok || !result.extracted) setError(result.error ?? "Não foi possível analisar o CV.");
    else {
      const data = result.extracted;
      setProfile((current) => ({ ...current, fullName: String(data.fullName || current.fullName), headline: String(data.headline || current.headline), bio: String(data.bio || current.bio), currentTitle: String(data.currentTitle || current.currentTitle), country: String(data.country || current.country), province: String(data.province || current.province), city: String(data.city || current.city), academicLevel: String(data.academicLevel || current.academicLevel), studyField: String(data.studyField || current.studyField), certifications: Array.isArray(data.certifications) ? data.certifications.join(", ") : current.certifications, languages: Array.isArray(data.languages) ? data.languages.join(", ") : current.languages, experience: Array.isArray(data.experience) ? data.experience.join("\n") : current.experience, education: Array.isArray(data.education) ? data.education.join("\n") : current.education, skills: Array.isArray(data.skills) ? data.skills.join(", ") : current.skills, portfolioUrl: String(data.portfolioUrl || current.portfolioUrl) }));
      setMessage("Dados extraídos do CV. Reveja os campos e guarde o perfil para confirmar.");
    }
    setExtracting(false);
  }

  async function signOut() { const supabase = createSupabaseBrowserClient(); if (supabase) await supabase.auth.signOut(); window.location.assign("/login"); }

  if (loading) return <main className="shell"><section className="hero profile-card"><p className="eyebrow">Perfil profissional</p><h1>A preparar o seu CV.</h1><p className="lede">Estamos a carregar os seus dados com segurança.</p></section></main>;

  return <main className="shell"><section className="hero profile-card profile-editor"><div className="profile-header"><div><p className="eyebrow">CV internacional</p><h1>O seu perfil profissional.</h1><p className="lede">Preencha o seu perfil uma vez e apresente uma candidatura mais forte, clara e preparada para oportunidades internacionais.</p></div><div className="profile-score"><strong>{completeness}%</strong><span>completo</span><div className="progress-track"><span style={{ width: `${completeness}%` }} /></div></div></div>
    <form onSubmit={saveProfile}>
      <fieldset><legend>Identidade e posicionamento</legend><div className="form-grid"><label>Nome completo<input value={profile.fullName} onChange={(event) => update("fullName", event.target.value)} required minLength={2} maxLength={120} placeholder="Ex.: Leonardo Miguel" /></label><label>Título profissional<input value={profile.currentTitle} onChange={(event) => update("currentTitle", event.target.value)} maxLength={120} placeholder="Ex.: Técnico de contabilidade" /></label><label className="wide-field">Headline profissional<input value={profile.headline} onChange={(event) => update("headline", event.target.value)} maxLength={160} placeholder="Ex.: Especialista financeiro com experiência em ERP e análise" /></label><label className="wide-field">Resumo profissional<textarea value={profile.bio} onChange={(event) => update("bio", event.target.value)} maxLength={2000} rows={5} placeholder="Apresente em poucas linhas a sua experiência, especialização e proposta de valor." /></label></div></fieldset>
      <fieldset><legend>Localização e disponibilidade</legend><div className="form-grid"><label>País<input value={profile.country} onChange={(event) => update("country", event.target.value)} maxLength={80} /></label><label>Província<input value={profile.province} onChange={(event) => update("province", event.target.value)} maxLength={80} placeholder="Luanda" /></label><label>Município<input value={profile.municipality} onChange={(event) => update("municipality", event.target.value)} maxLength={100} placeholder="Kilamba" /></label><label>Cidade<input value={profile.city} onChange={(event) => update("city", event.target.value)} maxLength={80} placeholder="Luanda" /></label><label>Disponibilidade<select value={profile.availability} onChange={(event) => update("availability", event.target.value)}><option value="">Seleccione</option><option>Imediata</option><option>Em 30 dias</option><option>Em 60 dias</option><option>Disponível para consulta</option></select></label><label>Regime preferido<select value={profile.preferredWorkMode} onChange={(event) => update("preferredWorkMode", event.target.value)}><option value="">Seleccione</option><option>Presencial</option><option>Híbrido</option><option>Remoto</option><option>Flexível</option></select></label><label>Tipo de contrato<select value={profile.contractType} onChange={(event) => update("contractType", event.target.value)}><option value="">Seleccione</option><option>Tempo inteiro</option><option>Tempo parcial</option><option>Contrato</option><option>Freelance</option><option>Estágio</option></select></label><label>Nível salarial mínimo (Kz)<input type="number" min="0" value={profile.salaryMinKz} onChange={(event) => update("salaryMinKz", event.target.value)} placeholder="Ex.: 250000" /></label><label>Nível salarial máximo (Kz)<input type="number" min="0" value={profile.salaryMaxKz} onChange={(event) => update("salaryMaxKz", event.target.value)} placeholder="Ex.: 500000" /></label><label className="check-row"><input type="checkbox" checked={profile.openToWork} onChange={(event) => update("openToWork", event.target.checked)} /> Disponível para novas oportunidades</label><label className="check-row"><input type="checkbox" checked={profile.willingToRelocate} onChange={(event) => update("willingToRelocate", event.target.checked)} /> Disponível para relocalização</label><label className="check-row"><input type="checkbox" checked={profile.willingToTravel} onChange={(event) => update("willingToTravel", event.target.checked)} /> Disponível para viajar</label></div></fieldset>
      <fieldset><legend>Formação, competências e idiomas</legend><div className="form-grid"><label>Nível académico<select value={profile.academicLevel} onChange={(event) => update("academicLevel", event.target.value)}><option value="">Seleccione</option><option>Ensino médio</option><option>Curso técnico</option><option>Licenciatura</option><option>Pós-graduação</option><option>Mestrado</option><option>Doutoramento</option></select></label><label>Área de formação<input value={profile.studyField} onChange={(event) => update("studyField", event.target.value)} maxLength={120} placeholder="Ex.: Contabilidade e auditoria" /></label><label className="wide-field">Experiência profissional<textarea value={profile.experience} onChange={(event) => update("experience", event.target.value)} rows={4} placeholder="Uma experiência por linha: Cargo — Empresa — período — principais resultados" /></label><label className="wide-field">Formação académica detalhada<textarea value={profile.education} onChange={(event) => update("education", event.target.value)} rows={3} placeholder="Uma formação por linha: curso — instituição — ano" /></label><label className="wide-field">Competências<input value={profile.skills} onChange={(event) => update("skills", event.target.value)} placeholder="Separe por vírgulas: análise, liderança, Excel" /></label><label className="wide-field">Competências e certificações<input value={profile.certifications} onChange={(event) => update("certifications", event.target.value)} placeholder="Separe por vírgulas: Excel, Primavera, IFRS" /></label><label className="wide-field">Idiomas e nível<input value={profile.languages} onChange={(event) => update("languages", event.target.value)} placeholder="Separe por vírgulas: Português nativo, Inglês B2" /></label><label>Visibilidade do perfil<select value={profile.visibility} onChange={(event) => update("visibility", event.target.value)}><option value="private">Privado — apenas em candidaturas</option><option value="public">Público — visível no Banco de Talentos</option></select></label><label className="wide-field">Idioma preferido<select value={profile.preferredLanguage} onChange={(event) => update("preferredLanguage", event.target.value)}><option value="pt">Português</option><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select></label><label className="wide-field">Portfólio ou LinkedIn (opcional)<input type="url" value={profile.portfolioUrl} onChange={(event) => update("portfolioUrl", event.target.value)} placeholder="https://..." /></label></div></fieldset>
      <button className="primary-button" disabled={saving}>{saving ? "A guardar…" : "Guardar perfil profissional"}</button>
    </form>
    <div className="profile-preview"><p className="eyebrow">Pré-visualização</p><h2>{profile.fullName || "O seu nome"}</h2><p className="preview-headline">{profile.headline || profile.currentTitle || "Título profissional"}</p><p>{profile.bio || "O seu resumo profissional aparecerá aqui depois de preencher os dados."}</p><div className="preview-tags">{profile.certifications.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6).map((item) => <span key={item}>{item}</span>)}</div></div>
    <form className="upload-box" onSubmit={uploadCv}><label>Currículo PDF<input name="file" type="file" accept="application/pdf" required onChange={(event) => setDocumentName(event.target.files?.[0]?.name ?? documentName)} /></label><button className="secondary-button" disabled={uploading}>{uploading ? "A carregar…" : documentName ? "Substituir CV privado" : "Carregar CV privado"}</button><p>{documentName ? `Documento actual: ${documentName}` : "Máximo 10 MB. O ficheiro fica no bucket privado e o acesso é temporário."}</p></form><button type="button" className="secondary-button" onClick={extractCv} disabled={extracting || !documentName}>{extracting ? "A analisar o CV…" : "Preencher a partir do CV"}</button>
    {message ? <p role="status" className="success-message">{message}</p> : null}{error ? <p role="alert" className="auth-error">{error}</p> : null}<button type="button" className="text-button" onClick={signOut}>Terminar sessão</button>
  </section></main>;
}
