"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("O serviço de autenticação está temporariamente indisponível."); return; }
    setBusy(true);
    const result = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (result.error) { setError("Email ou palavra-passe incorrectos, ou conta sem acesso administrativo."); return; }
    router.push("/admin"); router.refresh();
  }

  async function requestRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("O serviço de autenticação está temporariamente indisponível."); return; }
    setBusy(true);
    const redirectTo = `${window.location.origin}/admin/reset-password`;
    const result = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    setBusy(false);
    if (result.error) { setError("Não foi possível enviar o email agora. Confirme o endereço e tente novamente."); return; }
    setMessage("Se existir uma conta administrativa associada a este email, receberá um link para redefinir a palavra-passe.");
  }

  if (recovery) return <form className="admin-login-form" onSubmit={requestRecovery}><label><span>Email profissional</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@okutijobs.com" required /></label>{error ? <p className="admin-login-error" role="alert">{error}</p> : null}{message ? <p className="admin-login-success" role="status">{message}</p> : null}<button className="button button-dark admin-login-submit" type="submit" disabled={busy}>{busy ? "A enviar…" : "Enviar link de recuperação"}</button><button className="admin-login-secondary" type="button" onClick={() => { setRecovery(false); setError(""); setMessage(""); }}>← Voltar ao login</button></form>;

  return <form className="admin-login-form" onSubmit={submit}><label><span>Email profissional</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@okutijobs.com" required /></label><label><span>Palavra-passe</span><div className="admin-password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Introduza a sua palavra-passe" required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Ocultar" : "Mostrar"}</button></div></label>{error ? <p className="admin-login-error" role="alert">{error}</p> : null}<button className="button button-dark admin-login-submit" type="submit" disabled={busy}>{busy ? "A verificar…" : "Entrar no Super Admin ↗"}</button><button className="admin-login-forgot" type="button" onClick={() => { setRecovery(true); setError(""); setMessage(""); }}>Esqueci-me da palavra-passe</button></form>;
}
