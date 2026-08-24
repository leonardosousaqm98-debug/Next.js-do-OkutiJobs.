import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!email || !password || !url || !anonKey) throw new Error("Uso: verify-admin.mjs email password com ambiente Supabase configurado");
const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError || !auth.user) throw authError || new Error("Autenticação falhou");
const { data: member, error: memberError } = await supabase.from("admin_members").select("status,mfa_enrolled").eq("user_id", auth.user.id).maybeSingle();
if (memberError) throw memberError;
if (!member || member.status !== "active") throw new Error("A conta autenticada não tem membro admin activo");
console.log(JSON.stringify({ authenticated: true, adminActive: true, mfaEnrolled: Boolean(member.mfa_enrolled) }));
await supabase.auth.signOut();
