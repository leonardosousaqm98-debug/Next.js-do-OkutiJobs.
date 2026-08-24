import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const { data, error } = await supabase.from("notifications").select("id,kind,title,body,href,read_at,created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível carregar as notificações." }, { status: 500 });
  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; all?: boolean } | null;
  const query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", auth.user.id);
  const result = body?.all ? await query : body?.id ? await query.eq("id", body.id) : { error: { message: "Identificador em falta" } };
  if (result.error) return NextResponse.json({ error: "Não foi possível actualizar a notificação." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const { error } = await supabase.from("notifications").delete().eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: "Não foi possível limpar as notificações." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
