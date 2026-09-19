import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const commercialEmail = "comercial@okutijobs.com";
function text(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function escapeHtml(value: string) { return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character] || character); }

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "O serviço de email está temporariamente indisponível." }, { status: 503 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = text(body?.name, 120);
  const phone = text(body?.phone, 60);
  const email = text(body?.email, 160).toLowerCase();
  const service = text(body?.service, 120);
  const price = text(body?.price, 60);
  const note = text(body?.note, 2000);
  if (name.length < 2 || phone.length < 7 || !emailPattern.test(email) || service.length < 2 || note.length < 10) return NextResponse.json({ error: "Preencha todos os campos do formulário com dados válidos." }, { status: 400 });
  const from = process.env.EMAIL_FROM || "noreply@okutijobs.com";
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#123b4a"><h2>Nova solicitação de serviço</h2><p><strong>Serviço:</strong> ${escapeHtml(service)}</p><p><strong>Preço:</strong> ${escapeHtml(price)}</p><hr><p><strong>Nome:</strong> ${escapeHtml(name)}</p><p><strong>Contacto / WhatsApp:</strong> ${escapeHtml(phone)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Observação:</strong><br>${escapeHtml(note).replace(/\n/g, "<br>")}</p></div>`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [commercialEmail], reply_to: email, subject: `Solicitação: ${service} — ${name}`, html }) });
  if (!response.ok) return NextResponse.json({ error: "Não foi possível enviar a solicitação. Tente novamente." }, { status: 502 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
