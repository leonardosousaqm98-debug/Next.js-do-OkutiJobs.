"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isOkutiCrmEmail } from "@/lib/supabase/crm-access";

export function CrmMagicLinkForm({ initialError = "" }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
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
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/crm");
    const result = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
    });
    setBusy(false);
    if (result.error) {
      setError("Não foi possível enviar o link agora. Aguarde um momento e tente novamente.");
      return;
    }
    setMessage("Enviámos um link de acesso de uso único. Abra-o no mesmo navegador para confirmar este endereço e entrar.");
  }

  return <form className="admin-login-form" onSubmit={submit}>
    <label>
      <span>Email profissional</span>
      <input type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@okutijobs.com" required />
    </label>
    {error ? <p className="admin-login-error" role="alert">{error}</p> : null}
    {message ? <p className="admin-login-success" role="status">{message}</p> : null}
    <button className="button button-dark admin-login-submit" type="submit" disabled={busy}>
      {busy ? "A enviar…" : "Enviar link seguro de acesso"}
    </button>
    <p className="crm-privacy">Sem palavra-passe e sem MFA: cada entrada depende da confirmação individual por email.</p>
  </form>;
}
