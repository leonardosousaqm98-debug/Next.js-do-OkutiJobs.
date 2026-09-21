"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { const supabase = createSupabaseBrowserClient(); if (!supabase) { setError("O serviço de autenticação está temporariamente indisponível."); return; } supabase.auth.getSession().then(({ data }) => { setReady(Boolean(data.session)); if (!data.session) setError("Este link expirou ou já foi utilizado. Solicite um novo link de recuperação."); }); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setMessage(""); if (password.length < 8) return setError("A palavra-passe deve ter pelo menos 8 caracteres."); if (password !== confirmation) return setError("As palavras-passe não coincidem."); const supabase = createSupabaseBrowserClient(); if (!supabase) return setError("O serviço de autenticação está temporariamente indisponível."); setBusy(true); const result = await supabase.auth.updateUser({ password }); setBusy(false); if (result.error) return setError("Não foi possível actualizar a palavra-passe. Solicite um novo link."); setMessage("A palavra-passe foi actualizada. Já pode entrar no Super Admin."); }
  return <main className="admin-login-page"><section className="admin-login-card"><Link className="admin-login-brand" href="/admin/login">Okuti<span>Jobs</span><small>Super Admin</small></Link><div className="admin-login-icon">✓</div><p className="eyebrow">Recuperação de acesso</p><h1>Definir nova palavra-passe.</h1><p className="admin-login-lede">Escolha uma palavra-passe nova para voltar a gerir a plataforma.</p>{ready && !message ? <form className="admin-login-form" onSubmit={submit}><label><span>Nova palavra-passe</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></label><label><span>Confirmar palavra-passe</span><input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} /></label>{error ? <p className="admin-login-error" role="alert">{error}</p> : null}<button className="button button-dark admin-login-submit" disabled={busy}>{busy ? "A guardar…" : "Guardar nova palavra-passe"}</button></form> : null}{message ? <p className="admin-login-success" role="status">{message}</p> : null}{error && !ready ? <p className="admin-login-error" role="alert">{error}</p> : null}<Link className="admin-login-back" href="/admin/login">← Voltar ao login administrativo</Link></section></main>;
}
