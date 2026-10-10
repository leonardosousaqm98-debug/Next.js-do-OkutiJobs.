import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getValidSupabaseUrl } from "./lib/supabase-url";

export async function middleware(request: NextRequest) {
  const hostname = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.hostname).split(",")[0].split(":")[0].trim().toLowerCase();
  const isAcademyHostRoot = hostname === "academy.okutijobs.com" && request.nextUrl.pathname === "/";
  if (isAcademyHostRoot) {
    const academyUrl = request.nextUrl.clone();
    academyUrl.pathname = "/academy";
    return NextResponse.redirect(academyUrl);
  }
  const isCrmHostRoot = request.nextUrl.hostname.toLowerCase() === "crm.okutijobs.com" && request.nextUrl.pathname === "/";
  const crmRewrite = isCrmHostRoot ? request.nextUrl.clone() : null;
  if (crmRewrite) crmRewrite.pathname = "/crm";
  let response = crmRewrite ? NextResponse.rewrite(crmRewrite, { request }) : NextResponse.next({ request });
  const url = getValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        response = crmRewrite ? NextResponse.rewrite(crmRewrite, { request }) : NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
