import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const commercialEmail = "comercial@okutijobs.com";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeHtml = (value: string) => value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character] || character);

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API_TOKEN;
  if (!apiKey) return NextResponse.json({ error: "O serviço de email não está configurado neste deployment. Adicione RESEND_API_KEY em Production e faça um novo deployment.", code: "EMAIL_PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  if (!/^re_[A-Za-z0-9_]+$/.test(apiKey)) return NextResponse.json({ error: "A chave do Resend configurada neste deployment não tem um formato válido. Gere uma nova chave e publique novamente.", code: "EMAIL_PROVIDER_KEY_INVALID" }, { status: 503 });
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
  if (!response.ok) {
    const providerBody = await response.text().catch(() => "");
    let providerError: unknown = providerBody.slice(0, 1200);
    try {
      const parsed = JSON.parse(providerBody) as Record<string, unknown>;
      providerError = { name: parsed.name, message: parsed.message, statusCode: parsed.statusCode };
    } catch { /* resposta não JSON */ }
    console.error("Recruitment proposal email failed", { status: response.status, providerError, from });
    if (response.status === 401 || response.status === 403) return NextResponse.json({ error: "A chave RESEND_API_KEY foi rejeitada pelo Resend. Gere uma nova chave, substitua-a em Production e faça um novo deployment.", code: "EMAIL_PROVIDER_AUTH_INVALID" }, { status: 503 });
    return NextResponse.json({ error: "Não foi possível enviar o pedido. Tente novamente.", provider: providerError }, { status: 502 });
  }
  const crm = createSupabaseAdminClient();
  if (crm) {
    const { data: crmCompany } = await crm.from("crm_companies").insert({ name: company, source: "proposal_request", status: "lead", country: "Angola" }).select("id").maybeSingle();
    if (crmCompany) {
      const { data: crmContact } = await crm.from("crm_contacts").insert({ crm_company_id: crmCompany.id, full_name: company, email: contact, phone, is_primary: true }).select("id").maybeSingle();
      const { data: stage } = await crm.from("crm_pipeline_stages").select("id").eq("position", 1).maybeSingle();
      if (stage) await crm.from("crm_deals").insert({ crm_company_id: crmCompany.id, stage_id: stage.id, title: `Pedido de proposta — ${company}`, source: "proposal_request", description, estimated_value: 0 });
      if (crmContact) await crm.from("crm_activities").insert({ crm_company_id: crmCompany.id, activity_type: "proposal", subject: "Novo pedido de proposta", body: description || "Pedido recebido através da plataforma." });
    }
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
