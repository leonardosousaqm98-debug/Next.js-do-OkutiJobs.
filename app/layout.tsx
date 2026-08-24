import type { Metadata } from "next";
import "./globals.css";
import { ZoomControls } from "@/components/ZoomControls";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: {
    default: "OkutiJobs — Talento que aproxima oportunidades",
    template: "%s | OkutiJobs",
  },
  description: "Encontre oportunidades, publique vagas e desenvolva talento com a OkutiJobs — plataforma angolana de recrutamento e formação profissional.",
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt" suppressHydrationWarning><body><BackButton />{children}<ZoomControls /></body></html>;
}
