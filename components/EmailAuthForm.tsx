"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

type Mode = "login" | "signup";
type AccountType = "candidate" | "company";
type Provider = "linkedin";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.3A10.7 10.7 0 0 1 12 5c5 0 8.5 4.4 9.5 6a14.7 14.7 0 0 1-3.1 3.2M6.1 6.1C3.7 7.7 2.1 10 1.5 11c1 1.6 4.5 6 10.5 6 1 0 2-.2 2.8-.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>;
}

function ProviderIcon({ provider }: { provider: Provider }) {
	  return <span className={`provider-icon provider-${provider}`} aria-hidden="true">in</span>;
}

export function EmailAuthForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [accountType, setAccountType] = useState<AccountType>("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordReady = password.length >= 8;
  const passwordsMatch = mode === "login" || (confirmation.length > 0 && password === confirmation);
  const passwordHint = useMemo(() => {
    if (!password) return "Mínimo de 8 caracteres";
    if (!passwordReady) return "Ainda faltam alguns caracteres";
    return "Palavra-passe segura";
  }, [password, passwordReady]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage(null);
    setError(null);
  }

  async function resendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!validEmail) return setError("Introduza primeiro o email usado no registo.");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("A autenticação Supabase ainda não está configurada.");
    setResending(true);
    setError(null);
    const result = await supabase.auth.resend({ type: "signup", email: normalizedEmail });
    setResending(false);
    if (result.error) return setError("Não foi possível reenviar agora. Tente novamente.");
    setMessage("Enviámos uma nova mensagem de confirmação. Verifique também a pasta de spam.");
  }

  function unavailable(provider: Provider) {
    setError(`${provider === "linkedin" ? "LinkedIn" : "GitHub/Apple"} estará disponível numa próxima etapa de integrações.`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!validEmail) return setError("Introduza um email válido.");
    if (!passwordReady) return setError("A palavra-passe deve ter pelo menos 8 caracteres.");
    if (!passwordsMatch) return setError("As palavras-passe não coincidem.");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("A autenticação Supabase ainda não está configurada.");
    setBusy(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : null;
    setBusy(false);
    if (mode === "signup") {
      const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail, password, accountType }) });
      const payload = await response.json().catch(() => null) as { error?: string; accountType?: AccountType } | null;
      if (!response.ok) return setError(payload?.error || "Não foi possível criar a conta. Verifique os dados e tente novamente.");
      const fallbackPath = payload?.accountType === "company" ? "/empresa" : "/candidato";
      router.push(nextPath || fallbackPath);
      router.refresh();
      return;
    }
    if (result?.error) {
      const authMessage = result.error.message.toLowerCase();
      if (authMessage.includes("email not confirmed")) return setError("O email ainda não foi confirmado. Abra a mensagem recebida ou reenvie a confirmação abaixo.");
      return setError(mode === "login" ? "Email ou palavra-passe incorrectos." : "Não foi possível criar a conta. Verifique os dados e tente novamente.");
    }
    const fallbackPath = "/dashboard";
    router.push(nextPath || fallbackPath);
    router.refresh();
  }

  return (
    <div className="modern-auth">
      <div className="auth-mode-switch" role="tablist" aria-label="Modo de autenticação">
        <motion.span className="auth-mode-pill" layout transition={{ type: "spring", stiffness: 420, damping: 32 }} style={{ left: mode === "login" ? "4px" : "50%" }} />
        <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Iniciar sessão</button>
        <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Criar conta</button>
      </div>

      <div className="auth-social-row lamp-social-row">
        <GoogleLoginButton nextPath={nextPath} />
        <button type="button" className="social-provider social-provider-pending" onClick={() => unavailable("linkedin")}><ProviderIcon provider="linkedin" /><span>LinkedIn <small>(brevemente)</small></span></button>
      </div>
      <div className="auth-divider"><span>ou continue com email</span></div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.form key={mode} className="modern-email-form" onSubmit={submit} noValidate initial={{ opacity: 0, x: mode === "login" ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: mode === "login" ? 10 : -10 }} transition={{ duration: 0.18 }}>
          {mode === "signup" ? <div className="account-choice"><p>Vou entrar como</p><div className="account-choice-grid"><button type="button" className={accountType === "candidate" ? "selected" : ""} onClick={() => setAccountType("candidate")}><span>◎</span><strong>Candidato</strong><small>Encontrar oportunidades</small></button><button type="button" className={accountType === "company" ? "selected" : ""} onClick={() => setAccountType("company")}><span>▣</span><strong>Empresa</strong><small>Publicar e gerir vagas</small></button></div></div> : null}
          <label className={`floating-field ${email ? "filled" : ""} ${email && !validEmail ? "invalid" : ""}`}><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><span>Email</span>{email ? <b aria-hidden="true">{validEmail ? "✓" : "!"}</b> : null}</label>
          <label className={`floating-field ${password ? "filled" : ""} ${password && !passwordReady ? "invalid" : ""}`}><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /><span>Palavra-passe</span><button type="button" className="password-toggle" aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"} onClick={() => setShowPassword((value) => !value)}><EyeIcon hidden={!showPassword} /></button></label>
          {mode === "signup" ? <label className={`floating-field ${confirmation ? "filled" : ""} ${confirmation && !passwordsMatch ? "invalid" : ""}`}><input type={showConfirmation ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required /><span>Confirmar palavra-passe</span><button type="button" className="password-toggle" aria-label={showConfirmation ? "Ocultar confirmação" : "Mostrar confirmação"} onClick={() => setShowConfirmation((value) => !value)}><EyeIcon hidden={!showConfirmation} /></button></label> : null}
          {mode === "signup" && password ? <div className="password-status"><span className={passwordReady ? "ready" : ""}>{passwordReady ? "✓" : "•"} {passwordHint}</span><span className={passwordsMatch && confirmation ? "ready" : ""}>{passwordsMatch && confirmation ? "✓ Palavras-passe coincidem" : "• Confirme a palavra-passe"}</span></div> : null}
          <button className="auth-submit modern-submit" type="submit" disabled={busy}>{busy ? <><span className="button-spinner" />A processar…</> : mode === "login" ? <>Entrar na conta <span>→</span></> : <>Criar a minha conta <span>→</span></>}</button>
          {mode === "login" ? <button type="button" className="resend-link" onClick={resendConfirmation} disabled={resending}>{resending ? "A reenviar…" : "Não recebeu o email de confirmação? Reenviar"}</button> : null}
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          {message ? <p className="success-message" role="status">{message}</p> : null}
        </motion.form>
      </AnimatePresence>
      <p className="modern-auth-terms">Ao continuar, aceita os <a href="/termos">Termos de Utilização</a> e a <a href="/privacidade">Política de Privacidade</a>.</p>
    </div>
  );
}
