import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const commercialEmail = "comercial@okutijobs.com";
function text(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function escapeHtml(value: string) { return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character] || character); }

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "O serviço de email está temporariamente indisponível." }, { status: 503 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const course = text(body?.course, 160);
  const enrolmentType = text(body?.enrolmentType, 30);
  const name = text(body?.name, 120);
  const email = text(body?.email, 160).toLowerCase();
  const phone = text(body?.phone, 60);
  const organisation = text(body?.organisation, 160);
  const participants = text(body?.participants, 20);
  const note = text(body?.note, 2000);
  if (course.length < 2 || !["pessoal", "corporativa"].includes(enrolmentType) || name.length < 2 || !emailPattern.test(email) || phone.length < 7 || (enrolmentType === "corporativa" && organisation.length < 2)) return NextResponse.json({ error: "Preencha os campos obrigatórios com dados válidos." }, { status: 400 });
  const from = process.env.EMAIL_FROM || "noreply@okutijobs.com";
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#123b4a"><h2>Nova inscrição em formação</h2><p><strong>Formação:</strong> ${escapeHtml(course)}</p><p><strong>Tipo:</strong> ${enrolmentType === "corporativa" ? "Corporativa" : "Pessoal"}</p><hr><p><strong>Nome:</strong> ${escapeHtml(name)}</p><p><strong>Telefone:</strong> ${escapeHtml(phone)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p>${organisation ? `<p><strong>Organização:</strong> ${escapeHtml(organisation)}</p>` : ""}${participants ? `<p><strong>Participantes:</strong> ${escapeHtml(participants)}</p>` : ""}<p><strong>Observação:</strong><br>${escapeHtml(note || "Sem observações").replace(/\n/g, "<br>")}</p></div>`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [commercialEmail], reply_to: email, subject: `Inscrição em formação: ${course} — ${name}`, html }) });
  if (!response.ok) return NextResponse.json({ error: "Não foi possível enviar a inscrição. Tente novamente." }, { status: 502 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
