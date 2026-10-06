import type { Metadata } from "next";
import "./globals.css";
import { ZoomControls } from "@/components/ZoomControls";
import { BackButton } from "@/components/BackButton";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://okutijobs.com"),
  title: {
    default: "OkutiJobs — Talento que aproxima oportunidades",
    template: "%s | OkutiJobs",
  },
  description: "Encontre oportunidades, publique vagas e desenvolva talento com a OkutiJobs — plataforma angolana de recrutamento e formação profissional.",
  keywords: ["vagas de emprego em Angola", "oportunidades de emprego", "formação profissional em Angola", "recrutamento em Angola", "agência de emprego Angola", "Banco de Talentos"],
  alternates: { canonical: "https://okutijobs.com/" },
  openGraph: { type: "website", url: "https://okutijobs.com/", siteName: "OkutiJobs", locale: "pt_AO", title: "OkutiJobs — Vagas, formação e recrutamento em Angola", description: "Encontre vagas, desenvolva competências e ligue talento a oportunidades em Angola." },
  twitter: { card: "summary_large_image", title: "OkutiJobs — Oportunidades em Angola", description: "Vagas, formação profissional e recrutamento em Angola." },
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt" suppressHydrationWarning><body><ThemeProvider><BackButton />{children}<ZoomControls /></ThemeProvider></body></html>;
}
