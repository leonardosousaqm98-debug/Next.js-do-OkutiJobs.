"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({ className = "header-login" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.assign("/");
  }
  return <button type="button" className={className} onClick={signOut} disabled={busy} aria-label="Sair da conta">{busy ? "A sair…" : "Sair"}</button>;
}
