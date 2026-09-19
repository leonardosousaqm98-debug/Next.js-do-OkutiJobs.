import { NextResponse, type NextRequest } from "next/server";
import { createTemporaryAdminToken, isValidTemporaryAdminToken } from "@/lib/admin-temp-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || undefined;
  if (!isValidTemporaryAdminToken(token)) return NextResponse.json({ error: "Este link temporário expirou ou não é válido." }, { status: 410 });
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Serviço de autenticação indisponível." }, { status: 503 });
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = users.users.find((item) => item.email?.toLowerCase() === "leonardosousaqm98@gmail.com");
  if (!user) return NextResponse.json({ error: "Conta administrativa não encontrada." }, { status: 404 });
  await admin.from("admin_members").upsert({ user_id: user.id, display_name: "Leonardo Sousa", status: "active", mfa_enrolled: false }, { onConflict: "user_id" });
  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set("okutijobs_temp_admin", createTemporaryAdminToken(), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 900 });
  return response;
}
