"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CandidateProfilePage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage(null); setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: form.get("fullName"), headline: form.get("headline"), preferredLanguage: form.get("preferredLanguage"), province: form.get("province"), city: form.get("city"), openToWork: form.get("openToWork") === "on" }) });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) setError(payload.error ?? "Não foi possível guardar o perfil."); else setMessage("Perfil guardado com sucesso.");
    setSaving(false);
  }

  async function uploadCv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true); setMessage(null); setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/candidate/cv", { method: "POST", body: form });
    const payload = (await response.json()) as { error?: string; fileName?: string };
    if (!response.ok) setError(payload.error ?? "Não foi possível carregar o CV."); else setMessage(`CV carregado: ${payload.fileName}`);
    setUploading(false);
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return <main className="shell"><section className="hero profile-card"><p className="eyebrow">Primeiro módulo migrado</p><h1>O seu perfil profissional.</h1><p className="lede">Guarde os dados essenciais e o CV na nova camada Supabase. O perfil só fica público quando essa opção for activada.</p><form className="form-grid" onSubmit={saveProfile}><label>Nome completo<input name="fullName" required minLength={2} maxLength={120} placeholder="Ex.: Leonardo Miguel" /></label><label>Headline profissional<input name="headline" maxLength={160} placeholder="Ex.: Técnico de contabilidade" /></label><label>Província<input name="province" maxLength={80} placeholder="Luanda" /></label><label>Cidade<input name="city" maxLength={80} placeholder="Kilamba" /></label><label>Idioma preferido<select name="preferredLanguage" defaultValue="pt"><option value="pt">Português</option><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select></label><label className="check-row"><input type="checkbox" name="openToWork" defaultChecked /> Disponível para novas oportunidades</label><button className="primary-button" disabled={saving}>{saving ? "A guardar…" : "Guardar perfil"}</button></form><form className="upload-box" onSubmit={uploadCv}><label>Currículo em PDF<input name="file" type="file" accept="application/pdf" required /></label><button className="secondary-button" disabled={uploading}>{uploading ? "A carregar…" : "Carregar CV privado"}</button><p>Máximo 10 MB. O ficheiro fica no bucket privado e o acesso é temporário.</p></form>{message ? <p role="status" className="success-message">{message}</p> : null}{error ? <p role="alert" className="auth-error">{error}</p> : null}<button type="button" className="text-button" onClick={signOut}>Terminar sessão</button></section></main>;
}
