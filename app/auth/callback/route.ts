import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const publicOrigin = (process.env.NEXT_PUBLIC_APP_URL?.trim() || requestUrl.origin).replace(/\/$/, "");
  const response = NextResponse.redirect(new URL(safeNext, publicOrigin));
  response.headers.set("Location", safeNext);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (code && url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data: exchanged } = await supabase.auth.exchangeCodeForSession(code);
    const user = exchanged.user;
    if (user?.email?.toLowerCase() === "leonardosousaqm98@gmail.com") {
      const admin = createSupabaseAdminClient();
      await admin?.from("admin_members").upsert({
        user_id: user.id,
        display_name: user.user_metadata?.full_name || "Leonardo Sousa",
        status: "active",
        mfa_enrolled: false,
      }, { onConflict: "user_id" });
    }
  }

  return response;
}
