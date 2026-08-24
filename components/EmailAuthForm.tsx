"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";
type AccountType = "candidate" | "company";

export function EmailAuthForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [accountType, setAccountType] = useState<AccountType>("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage(null);
    setError(null);
  }

  async function resendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setError("Introduza primeiro o email usado no registo.");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("A autenticação Supabase ainda não está configurada.");
    setResending(true);
    setError(null);
    const result = await supabase.auth.resend({ type: "signup", email: normalizedEmail });
    setResending(false);
    if (result.error) return setError("Não foi possível reenviar agora. Confirme se o email está correcto e tente novamente.");
    setMessage("Enviámos uma nova mensagem de confirmação. Verifique também a pasta de spam.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setError("Introduza um email válido.");
    if (password.length < 8) return setError("A palavra-passe deve ter pelo menos 8 caracteres.");
    if (mode === "signup" && password !== confirmation) return setError("As palavras-passe não coincidem.");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("A autenticação Supabase ainda não está configurada.");
    setBusy(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { data: { preferred_language: "pt", account_type: accountType } },
        });
    setBusy(false);
    if (result.error) {
      const authMessage = result.error.message.toLowerCase();
      if (authMessage.includes("email not confirmed")) return setError("O email ainda não foi confirmado. Abra a mensagem recebida ou reenvie a confirmação abaixo.");
      return setError(mode === "login" ? "Email ou palavra-passe incorrectos." : "Não foi possível criar a conta. Verifique os dados e tente novamente.");
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Conta criada. Confirme o seu email antes de iniciar sessão.");
      return;
    }
    const fallbackPath = mode === "signup" ? (accountType === "company" ? "/empresa" : "/candidato") : "/dashboard";
    router.push(nextPath || fallbackPath);
    router.refresh();
  }

  return (
    <div className="email-auth">
      <div className="auth-tabs" role="tablist" aria-label="Tipo de acesso">
        <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "auth-tab active" : "auth-tab"} onClick={() => switchMode("login")}>
          Iniciar sessão
        </button>
        <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => switchMode("signup")}>
          Criar conta
        </button>
      </div>
      <form className="email-form" onSubmit={submit} noValidate>
        {mode === "signup" ? (
          <label>
            Tipo de conta
            <select value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}>
              <option value="candidate">Candidato — procurar oportunidades</option>
              <option value="company">Empresa — publicar vagas</option>
            </select>
          </label>
        ) : null}
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@empresa.com" required />
        </label>
        <label>
          Palavra-passe
          <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" minLength={8} required />
        </label>
        {mode === "signup" ? (
          <label>
            Confirmar palavra-passe
            <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repita a palavra-passe" minLength={8} required />
          </label>
        ) : null}
        <button className="button button-orange auth-submit" type="submit" disabled={busy}>
          {busy ? "A processar…" : mode === "login" ? "Entrar na conta" : "Criar a minha conta"}<span>↗</span>
        </button>
        {mode === "login" ? (
          <button type="button" className="text-button auth-resend" onClick={resendConfirmation} disabled={resending}>
            {resending ? "A reenviar…" : "Não recebeu o email de confirmação? Reenviar"}
          </button>
        ) : null}
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        {message ? <p className="success-message" role="status">{message}</p> : null}
      </form>
      <p className="auth-note">Ao continuar, aceita os Termos de Utilização e a Política de Privacidade da OkutiJobs.</p>
    </div>
  );
}
