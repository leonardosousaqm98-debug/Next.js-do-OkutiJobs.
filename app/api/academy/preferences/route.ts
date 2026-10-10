import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Serviço OkutiAcademy indisponível." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
  const body = await request.json().catch(() => null) as { leaderboardOptIn?: unknown; publicDisplayName?: unknown } | null;
  const optIn = body?.leaderboardOptIn === true;
  const displayName = typeof body?.publicDisplayName === "string" ? body.publicDisplayName.trim().slice(0, 32) : "";
  if (optIn && displayName.length < 2) return NextResponse.json({ error: "Escolha um nome público com pelo menos 2 caracteres para entrar no ranking." }, { status: 400 });
  const { data, error } = await supabase.from("academy_learner_settings").upsert({ user_id: auth.user.id, leaderboard_opt_in: optIn, public_display_name: optIn ? displayName : null, updated_at: new Date().toISOString() }).select("public_display_name,leaderboard_opt_in").single();
  if (error) return NextResponse.json({ error: "Não foi possível guardar a preferência de ranking." }, { status: 503 });
  return NextResponse.json({ preferences: data });
}
