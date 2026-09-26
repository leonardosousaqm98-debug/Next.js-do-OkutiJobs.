"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createSupabaseBrowserClient()?.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("A autenticação está temporariamente indisponível."); setBusy(false); return; }
    if (hasSession) {
      if (password.length < 8) { setError("A palavra-passe deve ter pelo menos 8 caracteres."); setBusy(false); return; }
      if (password !== confirmation) { setError("As palavras-passe não coincidem."); setBusy(false); return; }
      const result = await supabase.auth.updateUser({ password });
      setBusy(false);
      if (result.error) return setError("Não foi possível actualizar a palavra-passe. Solicite um novo link.");
      setMessage("Palavra-passe actualizada. Já pode iniciar sessão.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Introduza um email válido."); setBusy(false); return; }
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/recuperar")}`;
    const result = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    setBusy(false);
    if (result.error) return setError("Não foi possível enviar o link. Verifique o email e tente novamente.");
    setMessage("Enviámos um link de recuperação. Verifique também a pasta de spam.");
  }

  return <main className="lamp-auth-page recovery-page"><div className="lamp-auth-grid-glow" aria-hidden="true" /><section className="recovery-card" aria-labelledby="recovery-title"><a className="recovery-back" href="/login">← Voltar ao login</a><p className="lamp-kicker">Acesso à plataforma</p><h1 id="recovery-title">{hasSession ? "Criar nova palavra-passe" : "Recuperar acesso"}</h1><p>{hasSession ? "Escolha uma palavra-passe nova e segura para a sua conta." : "Introduza o seu email e enviaremos um link seguro para recuperar a sua conta."}</p><form onSubmit={submit} className="recovery-form">{!hasSession ? <label><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label> : <><label><span>Nova palavra-passe</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label><label><span>Confirmar palavra-passe</span><input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required /></label></>}<button className="auth-submit modern-submit" type="submit" disabled={busy}>{busy ? "A processar…" : hasSession ? "Actualizar palavra-passe" : "Enviar link de recuperação"}</button>{error ? <p className="auth-error" role="alert">{error}</p> : null}{message ? <p className="success-message" role="status">{message}</p> : null}</form></section></main>;
}
