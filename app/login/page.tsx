import { EmailAuthForm } from "@/components/EmailAuthForm";

export default function LoginPage() {
  return <main className="shell"><section className="hero auth-card"><p className="eyebrow">Acesso OkutiJobs</p><h1>O próximo passo começa consigo.</h1><p className="lede">Entre na sua conta ou crie o seu perfil profissional para explorar oportunidades com mais contexto.</p><EmailAuthForm /><p className="auth-note">O acesso social está temporariamente suspenso e será reactivado após a publicação do site.</p></section></main>;
}
