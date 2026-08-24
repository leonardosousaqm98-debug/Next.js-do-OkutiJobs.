# OkutiJobs — TODO de acompanhamento

## Base técnica e dados

- [x] Aplicação paralela Next.js 15 com App Router criada em `/home/ubuntu/okutijobs-next`.
- [x] Integração Supabase Auth, PostgreSQL, RLS e Storage privado configurada.
- [x] Schema base de perfis, candidatos, empresas, vagas, candidaturas e documentos aplicado.
- [x] Mensagens, notificações e favoritos ligados a tabelas reais do Supabase.
- [x] Seed idempotente de demonstração executado com 10 vagas e 30 candidaturas.
- [x] CVs privados servidos através de URLs assinados e verificação de propriedade.

## Experiência pública e portais

- [x] Homepage com pesquisa por texto, localização e categoria.
- [x] Listagem de vagas com filtros por salário, área e experiência.
- [x] Detalhes de vaga com requisitos e CTA de candidatura.
- [x] Fluxo de candidatura autenticado validado.
- [x] Portal de candidato e portal de empresa protegidos por sessão.
- [x] Dashboard empresarial com KPIs e candidaturas por vaga.
- [x] Backoffice global em `/admin` com guard server-side e MFA TOTP.

## Operação e segurança

- [x] RLS hardened contra exposição anónima e auto-elevação para admin.
- [x] Auditoria administrativa e alterações de estado com logs.
- [x] Endpoint controlado para expiração de vagas e alertas operacionais.
- [x] Filtros administrativos por texto, módulo e estado.
- [x] Exportação CSV no Backoffice para entidades operacionais.
- [x] URL temporária de preview configurada e documentada.
- [x] Scripts de testes, typecheck e build de produção executáveis.
- [x] Lint tornado não-interactivo com ESLint flat config.
- [x] Preview limpa e reiniciada após build, com rotas públicas a responder 200 e `/admin` a redireccionar sem sessão.

## Pendências antes de publicação

- [ ] Activar e testar MFA TOTP interactivamente com a conta administrativa.
- [ ] Importar exclusivamente `/home/ubuntu/okutijobs-next` na Vercel.
- [ ] Configurar na Vercel as variáveis Supabase/Auth e redirects de produção.
- [ ] Confirmar rotação final da `service_role` sem expor o segredo em documentação ou repositório.
- [ ] Executar homologação cross-account com uma empresa e um candidato separados.
- [x] Rever links internos e trocar as âncoras do catálogo principal por `next/link`; restantes âncoras secundárias ficam identificadas para uma ronda futura.
- [ ] Decidir se os dados de demonstração permanecem apenas no ambiente de teste ou são removidos antes de produção.
- [x] Rever SEO final base: sitemap.xml, robots.txt, metadados e domínio configurável; versões por idioma e domínio definitivo continuam dependentes da publicação/configuração final.
- [ ] Adicionar expiração automática de vagas em produção após deploy; o endpoint já está implementado, mas o agendamento depende do site publicado.
- [x] Adiar LinkedIn SSO para a fase pós-publicação, conforme decisão registada.

## Registo desta auditoria

- [x] 26 testes Vitest aprovados.
- [x] TypeScript sem erros.
- [x] Build Next.js de produção concluído com 27 rotas.
- [x] Lint ESLint não-interactivo concluído.
- [x] Preview validada após reinício limpo.

## Fase Vercel — sessão actual

- [ ] Confirmar importação exclusiva do projecto Next.js `/home/ubuntu/okutijobs-next` na Vercel.
- [ ] Configurar e validar as variáveis Preview/Production e os redirects Supabase no domínio Vercel.
- [ ] Executar smoke test do deployment Vercel e confirmar que a aplicação não apresenta tela preta.

## Bug reportado nesta sessão

- [x] Diagnosticar a tela preta: a preview Next.js actual responde 200, CSS 200 e carregou visualmente; a tela preta não é reproduzível no servidor e é compatível com sessão/chunks antigos ou com o ecrã de autenticação Vercel.

## Prioridade MVP para lançamento

- [x] Fechar o escopo MVP: homepage, vagas, detalhe, candidatura, autenticação email/palavra-passe, CV privado, portal empresarial básico, Backoffice mínimo e privacidade.
- [x] Adiar para pós-lançamento: IA avançada, LinkedIn SSO, traduções humanas completas, pagamentos/créditos reais, testes online completos, relatórios PDF e matching avançado.
- [ ] Validar o fluxo mínimo no domínio Vercel antes da publicação definitiva.

## Configuração Vercel — execução actual

- [ ] Confirmar que o projecto Vercel `okutijobs` usa o repositório Next.js `leonardosousaqm98-debug/Next.js-do-OkutiJobs.` na branch `main`.
- [ ] Configurar as variáveis Supabase e `NEXT_PUBLIC_APP_URL` no ambiente Preview, mantendo a service role exclusivamente server-side.
- [ ] Validar o deployment Preview, as rotas públicas e o carregamento de CSS/chunks.

## Bloqueador Vercel encontrado

- [ ] Corrigir o projecto Vercel que está configurado com output directory `public`; usar framework Next.js e deixar o output directory vazio/automático.
- [ ] Tornar o middleware Supabase tolerante a URL ausente ou malformada e adicionar teste de regressão para evitar 500 na homepage.
