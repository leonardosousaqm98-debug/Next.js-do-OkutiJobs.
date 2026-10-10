"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isOkutiCrmEmail } from "@/lib/supabase/crm-access";

type Step = "email" | "code" | "password";

export function CrmEmailOtpForm({ initialError = "" }: { initialError?: string }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError);

  async function requestCode(rawEmail: string) {
    setError("");
    setMessage("");
    const normalizedEmail = rawEmail.trim().toLowerCase();
    if (!isOkutiCrmEmail(normalizedEmail)) {
      setError("Use um endereço individual @okutijobs.com.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("O serviço de autenticação está temporariamente indisponível.");
      return;
    }

    setBusy(true);
    try {
      const { error: requestError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true },
      });
      if (requestError) {
        setError("Não foi possível enviar o código agora. Aguarde um momento e tente novamente.");
        return;
      }
      setEmail(normalizedEmail);
      setCode("");
      setStep("code");
      setMessage(`Enviámos um código de seis dígitos para ${normalizedEmail}.`);
    } catch {
      setError("Não foi possível enviar o código agora. Aguarde um momento e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    setError("");
    setMessage("");
    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);
    if (normalizedCode.length !== 6) {
      setError("Introduza o código de seis dígitos recebido por email.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("O serviço de autenticação está temporariamente indisponível.");
      return;
    }

    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: normalizedCode,
        type: "email",
      });
      if (verifyError) {
        setError("O código é inválido ou expirou. Pode pedir um novo código.");
        return;
      }
      setStep("password");
      setMessage("Email confirmado. Introduza agora a senha comum do CRM.");
    } catch {
      setError("Não foi possível validar o código. Pode pedir um novo código.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyPassword() {
    setError("");
    setMessage("");
    if (!password) {
      setError("Introduza a senha comum do CRM.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/crm/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        if (result?.error === "invalid_password") {
          setError("A senha comum está incorrecta.");
        } else if (result?.error === "unauthorized") {
          setError("A confirmação do email expirou. Volte a validar o código OTP.");
        } else if (result?.error === "crm_email_required") {
          setError("O CRM só aceita endereços confirmados @okutijobs.com.");
        } else {
          setError("Não foi possível validar o acesso. Tente novamente dentro de momentos.");
        }
        return;
      }
      setPassword("");
      window.location.assign("/crm");
    } catch {
      setError("Não foi possível validar o acesso. Verifique a ligação e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (step === "email") await requestCode(email);
    else if (step === "code") await confirmCode();
    else await verifyPassword();
  }

  return <form className="admin-login-form" onSubmit={submit}>
    {step === "email" ? <label>
      <span>Email profissional</span>
      <input type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@okutijobs.com" required />
    </label> : null}

    {step === "code" ? <>
      <label>
        <span>Código OTP de seis dígitos</span>
        <input type="text" name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required />
      </label>
      <button className="admin-login-secondary" type="button" onClick={() => void requestCode(email)} disabled={busy}>Reenviar código</button>
      <button className="admin-login-secondary" type="button" onClick={() => { setStep("email"); setCode(""); setError(""); setMessage(""); }} disabled={busy}>Alterar endereço de email</button>
    </> : null}

    {step === "password" ? <>
      <label>
        <span>Senha comum do CRM</span>
        <input type="password" name="crm-password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      <button className="admin-login-secondary" type="button" onClick={() => { setStep("code"); setPassword(""); setError(""); setMessage(""); }} disabled={busy}>Voltar ao código OTP</button>
    </> : null}

    {error ? <p className="admin-login-error" role="alert">{error}</p> : null}
    {message ? <p className="admin-login-success" role="status">{message}</p> : null}
    <button className="button button-dark admin-login-submit" type="submit" disabled={busy}>
      {busy ? "A validar…" : step === "email" ? "Enviar código OTP" : step === "code" ? "Confirmar código" : "Validar senha comum"}
    </button>
    <p className="crm-privacy">Acesso em dois passos: confirmação do email @okutijobs.com por OTP e validação da senha comum interna.</p>
  </form>;
}
