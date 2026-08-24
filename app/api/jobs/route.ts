import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 9;

function list(value: string | null) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ jobs: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page") || 1));
  const q = params.get("q")?.trim();
  const provinces = list(params.get("localizacao")).filter((item) => item.toLowerCase() !== "remoto");
  const models = list(params.get("modelo"));
  const contracts = list(params.get("contrato"));
  const sort = params.get("sort") || "recent";

  let query = supabase.from("jobs").select("id,company_id,slug,title,description,requirements,country,province,city,work_mode,contract_type,created_at,published_at", { count: "exact" }).eq("status", "published");
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,requirements.ilike.%${q}%`);
  if (provinces.length) query = query.in("province", provinces);
  if (models.length) query = query.in("work_mode", models);
  if (contracts.length) query = query.in("contract_type", contracts);
  if (sort === "popular") query = query.order("created_at", { ascending: false });
  else query = query.order("published_at", { ascending: false });
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) return NextResponse.json({ error: "Não foi possível pesquisar vagas." }, { status: 500 });
  return NextResponse.json({ jobs: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE });
}
