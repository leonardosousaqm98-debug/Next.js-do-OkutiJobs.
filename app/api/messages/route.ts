import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const { data, error } = await supabase.from("messages").select("id,sender_id,recipient_id,application_id,body,read_at,created_at").or(`sender_id.eq.${auth.user.id},recipient_id.eq.${auth.user.id}`).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível carregar as mensagens." }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  const body = await request.json().catch(() => null) as { recipientId?: string; applicationId?: string; body?: string } | null;
  if (!body?.recipientId || !body.body?.trim()) return NextResponse.json({ error: "Destinatário e mensagem são obrigatórios." }, { status: 400 });
  const { data, error } = await supabase.from("messages").insert({ sender_id: auth.user.id, recipient_id: body.recipientId, application_id: body.applicationId || null, body: body.body.trim() }).select("id,sender_id,recipient_id,application_id,body,created_at").single();
  if (error) return NextResponse.json({ error: "Não foi possível enviar a mensagem." }, { status: 500 });
  return NextResponse.json({ message: data }, { status: 201 });
}
