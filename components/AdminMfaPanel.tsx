"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminMfaPanel() {
  const [factor, setFactor] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enroll() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("A autenticação Supabase não está configurada.");
    setBusy(true); setError(null);
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "OkutiJobs Backoffice" });
    setBusy(false);
    if (enrollError || !data?.id || !data.totp) return setError("Não foi possível iniciar a configuração MFA. Tente novamente.");
    setFactor({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setMessage("Leia o QR code numa aplicação autenticadora e introduza o código de seis dígitos.");
  }

  async function verify() {
    if (!factor || !/^\d{6}$/.test(code)) return setError("Introduza o código MFA de seis dígitos.");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("A autenticação Supabase não está configurada.");
    setBusy(true); setError(null);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError || !challenge) { setBusy(false); return setError("Não foi possível iniciar a verificação MFA."); }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code });
    if (verifyError) { setBusy(false); return setError("Código MFA inválido ou expirado."); }
    const response = await fetch("/api/admin/mfa", { method: "POST" });
    setBusy(false);
    if (!response.ok) return setError("O código foi validado, mas não foi possível activar o estado administrativo. Contacte o suporte interno.");
    setMessage("MFA activado. O Backoffice está protegido por autenticação multifactor.");
    setFactor(null); setCode("");
  }

  return <div className="mfa-panel"><div className="mfa-copy"><p className="eyebrow">Protecção obrigatória</p><h2>Active o MFA do Backoffice.</h2><p>Use Google Authenticator, Microsoft Authenticator ou outra aplicação TOTP. A equipa OkutiJobs deve concluir esta etapa antes de gerir dados da plataforma.</p><button className="button button-orange" type="button" onClick={enroll} disabled={busy || Boolean(factor)}>{busy ? "A preparar…" : factor ? "Configuração iniciada" : "Configurar MFA"}<span>↗</span></button></div>{factor ? <div className="mfa-verify"><p className="eyebrow">Passo 2 de 2</p>{factor.qr ? <img className="mfa-qr" src={factor.qr} alt="QR code para configurar o MFA" /> : null}<p>Se não conseguir ler o QR code, use esta chave manual:</p><code>{factor.secret}</code><label>Código da aplicação<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label><button className="button button-dark" type="button" onClick={verify} disabled={busy}>{busy ? "A validar…" : "Confirmar MFA"}</button></div> : null}{error ? <p className="auth-error" role="alert">{error}</p> : null}{message ? <p className="success-message" role="status">{message}</p> : null}</div>;
}
