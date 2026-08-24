# OkutiJobs — checklist de produção

## Supabase

1. Executar `supabase/migrations/0003_recruitment_workflow.sql` no SQL Editor do projecto correcto.
2. Confirmar que as tabelas `application_events`, `messages`, `notifications` e `talent_favorites` existem.
3. Confirmar as políticas RLS de participantes, empresa proprietária e candidato autenticado.
4. Testar que um candidato só lê os seus dados e que uma empresa só lê candidaturas das suas próprias vagas.
5. Confirmar que o bucket `candidate-documents` permanece privado e que os links de CV expiram.

## Vercel / Next.js

Configurar estas variáveis nos ambientes Preview e Production, usando os valores do projecto Supabase correcto:

- `NEXT_PUBLIC_SUPABASE_URL`: URL pública do projecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública usada pelo browser e pelo cliente SSR.
- `SUPABASE_SERVICE_ROLE_KEY`: chave privada usada exclusivamente no servidor para URLs assinados e tarefas administrativas.
- `NEXT_PUBLIC_APP_URL`: domínio final da aplicação, sem barra final.

Nunca expor `SUPABASE_SERVICE_ROLE_KEY` em componentes client, variáveis `NEXT_PUBLIC_*`, logs ou repositórios.

## Autenticação

Adicionar no Supabase Auth os redirects de Preview e Production para `/auth/callback`. Manter Google/LinkedIn suspensos na interface enquanto não forem activados no lançamento.

## Antes da publicação

Executar `pnpm test`, `pnpm exec tsc --noEmit` e `pnpm build`. Validar candidatura, mudança de estado, notificação, mensagem, favorito e acesso a CV com duas contas diferentes. Remover ou identificar claramente os dados de demonstração antes de tornar o site público.

## Estado desta validação

A migração 0003 foi executada e as quatro tabelas respondem correctamente pela API. A conta candidata de demonstração consegue ler a sua candidatura, enquanto favoritos empresariais não ficam visíveis ao candidato. A verificação autenticada da conta empresarial não foi concluída porque a palavra-passe fornecida não foi aceite pelo Supabase; deve ser redefinida pelo fluxo de recuperação antes do teste interactivo final do painel.
