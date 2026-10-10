import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isOkutiCrmEmail } from "@/lib/supabase/crm-access";
import {
  createCrmPasswordSessionToken,
  CRM_PASSWORD_COOKIE_NAME,
  verifyCrmSharedPassword,
} from "@/lib/supabase/crm-password-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "configuration" }, { status: 500, headers: noStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  if (!user.email_confirmed_at || !isOkutiCrmEmail(user.email)) {
    return NextResponse.json({ error: "crm_email_required" }, { status: 403, headers: noStore });
  }

  const configuredPassword = process.env.CRM_SHARED_ACCESS_PASSWORD;
  if (!configuredPassword) return NextResponse.json({ error: "configuration" }, { status: 500, headers: noStore });

  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  if (typeof body?.password !== "string" || body.password.length > 512 || !verifyCrmSharedPassword(body.password, configuredPassword)) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401, headers: noStore });
  }

  const session = createCrmPasswordSessionToken(user.id, configuredPassword);
  if (!session) return NextResponse.json({ error: "configuration" }, { status: 500, headers: noStore });

  const response = NextResponse.json({ ok: true }, { headers: noStore });
  response.cookies.set(CRM_PASSWORD_COOKIE_NAME, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  return response;
}
