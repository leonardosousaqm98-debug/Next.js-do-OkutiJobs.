# Importação do OkutiJobs Next.js para a Vercel

## Repositório e directório

Importar o repositório que contém a aplicação Next.js em `/home/ubuntu/okutijobs-next`. Não seleccionar o projecto React/Vite antigo (`talentbridge`) para este deployment.

O framework deve ser detectado como **Next.js**. Não é necessário Dockerfile. O comando de instalação padrão com pnpm e o build `next build` devem ser mantidos.

## Variáveis de ambiente

Adicionar nos ambientes **Preview** e **Production**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — apenas server-side, nunca expor no browser
- `NEXT_PUBLIC_APP_URL`

Durante os testes actuais, `NEXT_PUBLIC_APP_URL` está configurado com a URL temporária da preview. Após o primeiro deployment, substituir pelo domínio Vercel e actualizar também os redirects do Supabase Auth.

## Redirects Supabase Auth

Adicionar os URLs `https://<dominio-vercel>/auth/callback` e a origem `https://<dominio-vercel>` em Authentication → URL Configuration. Manter a URL temporária apenas enquanto os testes estiverem activos.

## Checklist antes de publicar

Validação actual: `pnpm test` com 26 testes aprovados, `pnpm exec tsc --noEmit` sem erros e `pnpm run build` concluído com 27 rotas. Antes de publicar, testar manualmente login email/password, MFA TOTP do admin, candidatura, alteração de estado, notificação, mensagem, favorito e URL assinado de CV com contas separadas. A importação/publicação deve ser confirmada no painel Vercel pelo proprietário da conta; depois substituir a URL temporária pelo domínio final e actualizar os redirects do Supabase.
