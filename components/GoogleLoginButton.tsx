"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getOAuthRedirectUrl } from "@/lib/supabase/oauth";

export function GoogleLoginButton({ nextPath }: { nextPath?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("A autenticação Supabase ainda não está configurada.");
      setLoading(false);
      return;
    }
    const callback = getOAuthRedirectUrl(window.location.origin);
    const redirectTo = nextPath ? `${callback}?next=${encodeURIComponent(nextPath)}` : callback;
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (authError) {
      setError("Não foi possível iniciar o acesso com Google. Tente novamente.");
      setLoading(false);
    }
  }

  return <div><button type="button" onClick={signIn} disabled={loading} className="oauth-button">{loading ? "A ligar…" : "Continuar com Google"}</button>{error ? <p role="alert" className="auth-error">{error}</p> : null}</div>;
}
