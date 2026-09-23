import { NextResponse } from "next/server";

const commercialEmail = "comercial@okutijobs.com";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeHtml = (value: string) => value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character] || character);

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "O serviço de email está temporariamente indisponível." }, { status: 503 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const company = text(body?.company, 160); const contact = text(body?.contact, 160).toLowerCase(); const phone = text(body?.phone, 60); const location = text(body?.location, 160); const description = text(body?.description, 12000); const fileName = text(body?.fileName, 160); const fileData = text(body?.fileData, 11_500_000); const vacancies = Number(body?.vacancies);
  const rawProfile = body?.profile && typeof body.profile === "object" ? body.profile as Record<string, unknown> : {};
  const profile = Object.fromEntries(Object.entries(rawProfile).map(([key, value]) => [key, text(value, 3000)]));
  if (company.length < 2 || !emailPattern.test(contact) || !Number.isInteger(vacancies) || vacancies < 1 || vacancies > 500 || (!description && !fileData && !profile.role)) return NextResponse.json({ error: "Preencha os dados obrigatórios e indique pelo menos um perfil." }, { status: 400 });
  const profileRows = Object.entries(profile).filter(([, value]) => value).map(([key, value]) => `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(value)).replace(/\n/g, "<br>")}</p>`).join("");
  const from = process.env.EMAIL_FROM || "noreply@okutijobs.com";
  const attachments = fileData && fileName ? [{ filename: fileName, content: fileData.split(",")[1] || fileData }] : undefined;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#123b4a"><h2>Novo pedido de proposta — Recrutamento especializado</h2><p><strong>Empresa:</strong> ${escapeHtml(company)}</p><p><strong>Email:</strong> ${escapeHtml(contact)}</p><p><strong>Telefone:</strong> ${escapeHtml(phone || "Não indicado")}</p><p><strong>Vagas em aberto:</strong> ${vacancies}</p><p><strong>Localização:</strong> ${escapeHtml(location || "Não indicada")}</p><hr><h3>Perfil estruturado</h3>${profileRows || "<p>O cliente enviou apenas a descrição abaixo.</p>"}<h3>Briefing original</h3><p>${escapeHtml(description || "Ver anexo JD.").replace(/\n/g, "<br>")}</p>${fileName ? `<p><strong>Anexo:</strong> ${escapeHtml(fileName)}</p>` : ""}</div>`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [commercialEmail], reply_to: contact, subject: `Pedido de recrutamento: ${company} — ${vacancies} vaga(s)`, html, ...(attachments ? { attachments } : {}) }) });
  if (!response.ok) { console.error("Recruitment proposal email failed", response.status); return NextResponse.json({ error: "Não foi possível enviar o pedido. Tente novamente." }, { status: 502 }); }
  return NextResponse.json({ ok: true }, { status: 201 });
}
