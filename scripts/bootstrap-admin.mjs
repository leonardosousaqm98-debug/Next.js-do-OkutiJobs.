import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Uso: node scripts/bootstrap-admin.mjs email-da-equipa@dominio.com");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente server-side.");
  process.exit(1);
}
const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
let page = 1;
let target = null;
while (!target) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  target = data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
  if (data.users.length < 1000) break;
  page += 1;
}
if (!target) {
  console.error(`Não foi encontrada uma conta Supabase confirmada para ${email}.`);
  process.exit(1);
}
const { error } = await supabase.from("admin_members").upsert({ user_id: target.id, display_name: target.user_metadata?.full_name || target.email || email, status: "active", mfa_enrolled: false }, { onConflict: "user_id" });
if (error) throw error;
console.log(`Admin criado/actualizado para ${email}. MFA deve ser concluído antes do acesso operacional.`);
