import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const publicPaths = [
  "/",
  "/vagas",
  "/formacoes",
  "/pagina-candidatos",
  "/pagina-empresas",
  "/parceiros",
  "/privacidade",
  "/sobre-nos",
  "/revisao-cv",
];

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const entries: MetadataRoute.Sitemap = publicPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === "/vagas" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/vagas" ? 0.95 : 0.7,
  }));

  const supabase = await createSupabaseServerClient();
  if (!supabase) return entries;

  const { data } = await supabase
    .from("jobs")
    .select("slug,updated_at,published_at")
    .eq("status", "published");

  for (const job of data ?? []) {
    if (!job.slug) continue;
    entries.push({
      url: `${baseUrl}/vagas/${encodeURIComponent(job.slug)}`,
      lastModified: job.updated_at || job.published_at || undefined,
      changeFrequency: "weekly",
      priority: 0.85,
    });
  }

  return entries;
}

