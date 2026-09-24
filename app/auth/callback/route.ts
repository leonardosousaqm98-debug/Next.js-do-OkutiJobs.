import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function safePath(value: string | null) {
  const next = value || "";
  const safe = next.startsWith("/") && !next.startsWith("//");
  return safe ? next : "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = safePath(requestUrl.searchParams.get("next"));
  let destination = requestedNext;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const publicOrigin = requestUrl.origin.replace(/\/$/, "");
  const response = NextResponse.redirect(new URL(destination, publicOrigin));

  if (code && url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data: exchanged } = await supabase.auth.exchangeCodeForSession(code);
    const user = exchanged.user;
    if (user?.email?.toLowerCase() === "leonardosousaqm98@gmail.com") {
      destination = "/admin";
      const admin = createSupabaseAdminClient();
      await admin?.from("admin_members").upsert({
        user_id: user.id,
        display_name: user.user_metadata?.full_name || "Leonardo Sousa",
        status: "active",
        mfa_enrolled: false,
      }, { onConflict: "user_id" });
    }
  }

  response.headers.set("Location", new URL(destination, publicOrigin).toString());
  response.headers.set("Location", destination);
  return response;
}
