# Sessão Vercel — 24 de Agosto de 2026

O repositório correcto é `leonardosousaqm98-debug/Next.js-do-OkutiJobs.` na branch `main`.

A conta Vercel apresenta dois projectos ligados ao mesmo repositório: `okutijobs` (ID `prj_8rRHxkneZVz6h6mlxYJmYoGvAD6l`) e `okutijobs-portal` (ID `prj_FHgdDZDHorMBX5WnTUWPTrR00CzC`). Não foi feita qualquer eliminação.

A integração Vercel está activa, mas a consulta de deployments devolveu 403. O navegador foi encaminhado para `https://vercel.com/leonardosousaqm98-3877s-projects/okutijobs/settings/environment-variables` e apresentou a página de login da Vercel. É necessária autenticação manual do proprietário para configurar variáveis e validar o deployment.

A preview pública Next.js continua saudável: `/`, `/login`, `/vagas`, `/formacoes`, `/sitemap.xml` e `/robots.txt` respondem 200; `/admin` redirecciona sem sessão.

## Validação de configuração e deployment

- Projecto Vercel: https://vercel.com/leonardosousaqm98-3877s-projects/okutijobs
- Repositório ligado: https://github.com/leonardosousaqm98-debug/Next.js-do-OkutiJobs./tree/main
- Domínio principal atribuído: https://okutijobs.vercel.app
- Primeiro deployment Preview: Ready no build, mas respondeu 500 `MIDDLEWARE_INVOCATION_FAILED`; log externo: `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.`
- Causa operacional identificada: `NEXT_PUBLIC_SUPABASE_URL` estava inválida na Vercel.
- Correcção aplicada no painel Vercel: Framework Preset `Next.js`, Output Directory `Next.js default`, `NEXT_PUBLIC_SUPABASE_URL` actualizada para a Project URL HTTPS válida, e variáveis `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_APP_URL` presentes em Preview/Production.
- Novo deployment Preview criado após a correcção: `https://okutijobs-d48bz322e-leonardosousaqm98-3877s-projects.vercel.app` (deployment `97x5E9QRqKDty5CHgoYPbsoE9NJx`; aguarda validação).

- Validação final concluída no domínio principal `https://okutijobs.vercel.app`: homepage carregada com título OkutiJobs, navegação, pesquisa, vagas em destaque, CTA de login/criação de conta, contactos e escala visual; middleware sem erro 500.
- Login público `https://okutijobs.vercel.app/login` carregou correctamente com campos de email/palavra-passe e validação; login real com credenciais continua por testar manualmente.
