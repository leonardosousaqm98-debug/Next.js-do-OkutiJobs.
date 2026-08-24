import type { MetadataRoute } from "next";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/vagas", "/formacoes", "/pagina-candidatos", "/pagina-empresas", "/parceiros", "/privacidade", "/sobre-nos", "/revisao-cv"],
      disallow: ["/api/", "/admin", "/dashboard", "/empresa", "/candidato", "/profile", "/login", "/auth/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

