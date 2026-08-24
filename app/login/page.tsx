import { EmailAuthForm } from "@/components/EmailAuthForm";

type LoginPageProps = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : undefined;
  return <main className="shell"><section className="hero auth-card"><p className="eyebrow">Acesso OkutiJobs</p><h1>O próximo passo começa consigo.</h1><p className="lede">Entre na sua conta ou crie o seu perfil profissional para explorar oportunidades com mais contexto.</p><EmailAuthForm nextPath={nextPath} /><p className="auth-note">O acesso social está temporariamente suspenso e será reactivado após a publicação do site.</p></section></main>;
}
