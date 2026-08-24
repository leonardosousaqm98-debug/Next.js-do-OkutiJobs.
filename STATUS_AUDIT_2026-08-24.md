# Auditoria de estado — OkutiJobs

**Data:** 24 de Agosto de 2026  
**Arquitectura auditada:** Next.js 15.5.23, App Router, React 19, Supabase Auth/Postgres/Storage  
**Âmbito:** funcionalidades, segurança, testes, produção, migração e organização na Manus

## Resumo executivo

A base Next.js do OkutiJobs está funcional para demonstração e testes controlados: as principais páginas públicas existem, a ligação ao Supabase está activa, o fluxo de candidatura já foi exercitado com uma conta candidata, o armazenamento de CV usa bucket privado e as APIs privadas rejeitam pedidos sem sessão. A bateria actual tem **16 testes Vitest aprovados**, e o TypeScript não apresenta erros.

O projecto **ainda não está pronto para publicação imediata**. O bloqueador técnico principal é o `pnpm run build`: a compilação termina, mas a prerenderização da rota 404 falha com `<Html> should not be imported outside of pages/_document`. Não foi encontrada importação explícita no código fonte, pelo que é necessária uma investigação adicional do bundle/configuração antes do deployment Vercel. Além disso, ainda falta a homologação autenticada completa da conta empresarial e a configuração do projecto na área **Projetos** da Manus.

## O que está concluído

| Área | Estado | Evidência actual |
|---|---|---|
| Interface pública | Concluída para a fase actual | Homepage, vagas, formações, serviços, parceiros, privacidade e informação institucional existem. |
| Identidade visual | Concluída | Logo OkutiJobs, wordmark, favicon, paleta e controlos de escala visual integrados. |
| Vagas | Funcional | Listagem com pesquisa/filtros, detalhe por slug e candidatura modal. Quatro vagas publicadas foram confirmadas no Supabase. |
| Candidaturas | Funcional em teste controlado | API protegida, prevenção de duplicados, histórico e leitura no painel empresarial já implementados. |
| CVs | Estrutura segura implementada | Bucket `candidate-documents` privado, validação de PDF, ownership e URLs assinados de curta duração. |
| Dados Supabase | Migrações aplicadas | Migrações 0001, 0002 e 0003 presentes; tabelas de candidaturas, eventos, mensagens, notificações e `talent_favorites` previstas no fluxo actual. |
| Segurança básica | Smoke test aprovado | Sem sessão, APIs privadas devolvem 401 e as tabelas privadas não expõem linhas através da chave pública. |
| Responsividade | Verificada parcialmente | Foram feitas verificações visuais anteriores em desktop/mobile e o layout mobile actual está enquadrado. |
| Preparação documental | Parcialmente concluída | `PRODUCTION_SUPABASE_CHECKLIST.md` e `VERCEL_IMPORT.md` existem. |

## O que ainda falta antes da publicação

| Prioridade | Pendência | Porque é necessária | Resultado esperado |
|---|---|---|---|
| P0 | Corrigir o `pnpm run build` | A Vercel não deve receber uma build que falha na prerenderização da 404. | Build de produção concluído sem erro. |
| P0 | Testar autenticação empresarial com conta separada | A conta empresarial principal teve problema de palavra-passe; sem sessão válida não se confirmou ponta a ponta o isolamento de empresa, mensagens, notificações, favoritos e leitura de CV. | Login empresarial, leitura apenas das próprias candidaturas e alteração de estados confirmados manualmente. |
| P0 | Confirmar configuração final do Supabase Auth | A URL de preview ainda não é o domínio de produção. | Redirects `/auth/callback` de Preview e Production configurados; política de confirmação de email decidida. |
| P0 | Rever e rotacionar a `SUPABASE_SERVICE_ROLE_KEY` | O histórico regista que a chave apresentada anteriormente aparentava coincidir com uma chave anterior. | Chave efectivamente rotacionada, guardada apenas nos secrets server-side e nunca exposta ao cliente. |
| P0 | Decidir sobre dados de demonstração | Existem dados de teste e vagas de demonstração no ambiente. | Dados removidos, marcados como demonstração ou separados de forma explícita antes da abertura pública. |
| P1 | Importar o projecto para a área **Projetos** da Manus | A sessão actual está identificada como `non_project`; o site permanece associado ao contexto de tarefa. | Projecto próprio chamado **OkutiJobs**, localizável na secção Projetos. Esta associação depende da interface de gestão da Manus. |
| P1 | Configurar variáveis na Vercel | O `.env.local` não é uma configuração de produção. | Quatro variáveis definidas em Preview e Production, com `NEXT_PUBLIC_APP_URL` diferente por ambiente quando necessário. |
| P1 | Corrigir ou substituir o lint | `next lint` é deprecated e abre um assistente interactivo porque não existe configuração ESLint final. | ESLint CLI configurado e execução não interactiva no CI/deployment. |
| P1 | Confirmar build com ambiente limpo | O build foi testado, mas falhou na fase 404; a limpeza de `.next` não resolveu. | `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm run lint` e `pnpm run build` passam de forma reproduzível. |
| P2 | Testar fluxos de mensagens, notificações e favoritos autenticados | O smoke test confirma não exposição anónima, não substitui a utilização real entre candidato e empresa. | Criar, listar, marcar como lida, limpar/filtrar e abrir a entidade relacionada com duas contas. |
| P2 | Rever Google OAuth e manter LinkedIn suspenso | Google está activo no provider Supabase, mas o produto decidiu suspender SSO até à publicação; LinkedIn foi adiado. | Uma decisão única documentada e redirects coerentes com essa decisão. |
| P2 | Migrar/reconciliar dados antigos | O estado da migração indica que os dados da aplicação React/Vite antiga não foram copiados automaticamente. | Exportação, mapeamento, reconciliação e plano de rollback aprovados, caso os dados antigos sejam necessários. |

## Bloqueador técnico encontrado na auditoria

O comando `pnpm run build` compilou o código e verificou tipos, mas falhou na prerenderização de `/404` com a mensagem de que `<Html>` só pode ser importado em `pages/_document`. A pesquisa do código fonte não encontrou `next/document`, `<Html>`, `_document` ou um directório `pages` residual. A hipótese actual é uma referência indirecta no bundle, uma configuração antiga ou um artefacto associado à migração.

Este ponto deve ser resolvido antes de qualquer import para a Vercel. A sequência recomendada é inspeccionar o bundle da rota `_not-found`, testar temporariamente o layout sem componentes client-only, confirmar configuração e aliases Next.js e voltar a executar o build a partir de um ambiente limpo.

## Estado dos testes executados

| Verificação | Resultado |
|---|---|
| Vitest completo | **16 testes aprovados** em 6 ficheiros |
| TypeScript | **Sem erros** com `tsc --noEmit` |
| URL temporária da preview | Respondeu correctamente num teste HTTP |
| Rotas públicas principais | Homepage, vagas, formações, serviços e privacidade responderam 200 |
| Detalhes de vagas | Os quatro slugs publicados responderam 200 |
| APIs privadas sem sessão | Candidaturas, mensagens, notificações e favoritos responderam 401 |
| Smoke test RLS anónimo | Sem linhas expostas em `applications`, `messages`, `notifications`, `talent_favorites` e `candidate_documents` |
| Build de produção | **Falhou na prerenderização de 404** |
| Lint | Não concluído; `next lint` abriu configuração interactiva e está deprecated |
| Homologação empresarial autenticada | **Ainda não concluída** |

## Ordem recomendada para concluir

Primeiro, corrigir o bloqueador de build e criar um comando de lint não interactivo. Depois, redefinir a palavra-passe da conta empresarial e executar a homologação com duas contas: candidato e empresa. Em seguida, confirmar a rotação da service role, limpar ou identificar os dados de demonstração e configurar os redirects e secrets na Vercel. Finalmente, criar/associar o projecto **OkutiJobs** na secção Projetos da Manus, importar o repositório Next.js e executar uma última validação no domínio Vercel antes de publicar.

## Conclusão

O OkutiJobs está numa fase avançada de pré-produção, mas não deve ser considerado pronto para lançamento enquanto o build de produção falhar e os testes autenticados empresariais não forem concluídos. A maior parte da fundação funcional e de segurança está implementada; os próximos trabalhos são sobretudo de estabilização, validação operacional, configuração de produção e organização do projecto.
