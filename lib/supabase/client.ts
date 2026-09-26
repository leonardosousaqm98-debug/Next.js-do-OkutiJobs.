import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient(persistSession = true) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey, { auth: { persistSession, autoRefreshToken: true, detectSessionInUrl: true } });
}
