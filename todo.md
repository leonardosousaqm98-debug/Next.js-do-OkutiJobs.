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
- [x] Importar exclusivamente `/home/ubuntu/okutijobs-next` na Vercel através do repositório `leonardosousaqm98-debug/Next.js-do-OkutiJobs.` na branch `main`.
- [x] Configurar na Vercel as variáveis Supabase/Auth e `NEXT_PUBLIC_APP_URL` nos ambientes Preview/Production; redirects finais do Supabase Auth continuam a exigir o domínio definitivo.
- [ ] Confirmar rotação final da `service_role` sem expor o segredo em documentação ou repositório.
- [ ] Executar homologação cross-account com uma empresa e um candidato separados.
- [x] Rever links internos e trocar as âncoras do catálogo principal por `next/link`; restantes âncoras secundárias ficam identificadas para uma ronda futura.
- [ ] Decidir se os dados de demonstração permanecem apenas no ambiente de teste ou são removidos antes de produção.
- [x] Rever SEO final base: sitemap.xml, robots.txt, metadados e domínio configurável; versões por idioma e domínio definitivo continuam dependentes da publicação/configuração final.
- [ ] Adicionar expiração automática de vagas em produção após deploy; o endpoint já está implementado, mas o agendamento depende do site publicado.
- [x] Adiar LinkedIn SSO para a fase pós-publicação, conforme decisão registada.

## Registo desta auditoria

- [x] 39 testes Vitest aprovados na validação actual.
- [x] TypeScript sem erros.
- [x] Build Next.js de produção concluído com 30 rotas.
- [x] Lint ESLint não-interactivo concluído.
- [x] Preview validada após reinício limpo.

## Fase Vercel — sessão actual

- [x] Confirmar importação exclusiva do projecto Next.js `/home/ubuntu/okutijobs-next` na Vercel através do repositório `leonardosousaqm98-debug/Next.js-do-OkutiJobs.` na branch `main`.
- [x] Configurar e validar as variáveis Preview/Production e `NEXT_PUBLIC_APP_URL` no domínio Vercel; redirects finais do Supabase Auth dependem do domínio definitivo.
- [x] Executar smoke test do deployment Vercel: homepage e login carregaram sem tela preta/500; login real ainda requer teste com conta autenticada.

## Bug reportado nesta sessão

- [x] Diagnosticar a tela preta: a preview Next.js actual responde 200, CSS 200 e carregou visualmente; a tela preta não é reproduzível no servidor e é compatível com sessão/chunks antigos ou com o ecrã de autenticação Vercel.

## Prioridade MVP para lançamento

- [x] Fechar o escopo MVP: homepage, vagas, detalhe, candidatura, autenticação email/palavra-passe, CV privado, portal empresarial básico, Backoffice mínimo e privacidade.
- [x] Adiar para pós-lançamento: IA avançada, LinkedIn SSO, traduções humanas completas, pagamentos/créditos reais, testes online completos, relatórios PDF e matching avançado.
- [x] Validar o fluxo mínimo no domínio Vercel: homepage e login carregam sem tela preta/500; autenticação real continua a precisar de teste com conta do utilizador.

## Configuração Vercel — execução actual

- [x] Confirmar que o projecto Vercel `okutijobs` usa o repositório Next.js `leonardosousaqm98-debug/Next.js-do-OkutiJobs.` na branch `main`.
- [x] Configurar as variáveis Supabase e `NEXT_PUBLIC_APP_URL` nos ambientes Preview/Production, mantendo a service role exclusivamente server-side.
- [x] Validar deployment Vercel e rotas públicas: homepage e login carregaram sem tela preta/500; autenticação real continua a precisar de teste com conta do utilizador.

## Bloqueador Vercel encontrado

- [x] Corrigir o projecto Vercel configurado com output directory `public`; framework Next.js e output directory automático aplicados.
- [x] Tornar o middleware Supabase tolerante a URL ausente ou malformada e adicionar teste de regressão; 31 testes, typecheck e build aprovados.

## Homologação final de autenticação

- [ ] Testar login real no domínio `https://okutijobs.vercel.app` sem partilhar credenciais na conversa.
- [ ] Confirmar callback/redirect do Supabase Auth para o domínio Vercel e a rota `/auth/callback`.
- [ ] Activar MFA TOTP para a conta administrativa e validar o primeiro código localmente no navegador.

## Bug de autenticação reportado

- [ ] Diagnosticar e corrigir o login em que a palavra-passe criada no registo não é reconhecida no domínio Vercel/Supabase.

## Recuperação dos fluxos essenciais do candidato

- [ ] Tornar visível e funcional o formulário de criação de conta de candidato no MVP.
- [ ] Tornar visível e funcional o painel autenticado do candidato.
- [ ] Recuperar gestão de vagas favoritas, candidaturas e conclusão de perfil/CV.
- [ ] Melhorar a apresentação pública e a navegação para não parecer uma versão incompleta do site.

## Navegação orientada a candidatos

- [x] Substituir no cabeçalho os links “Para candidatos” e “Para empresas” por “Comprar CV” e “Apoio à candidatura”.
- [x] Criar a entrada “Serviços” com acesso a todos os serviços destinados a candidatos.
- [x] Aplicar a navegação actualizada no cabeçalho público, no catálogo e no portal autenticado.
- [x] Garantir que Comprar CV, Apoio à candidatura e Serviços também ficam acessíveis no cabeçalho mobile sem overflow horizontal através do menu Menu.

## Auditoria de paridade React/Vite → Next.js

- [x] Inventariar as funcionalidades do site React/Vite anterior e comparar com as rotas públicas e portais actuais.
- [x] Classificar as lacunas como bloqueadoras P0, importantes P1 ou evolução P2 pós-lançamento.
- [x] Identificar funcionalidades antigas que não devem ser mescladas antes do lançamento por dependerem de integrações ou dados ainda não preparados.

## Perfil profissional internacional do candidato

- [x] Transformar “Meu perfil” num perfil/CV completo com dados pessoais, resumo, experiência, formação, competências, idiomas, certificações e preferências profissionais.
- [x] Persistir os campos do perfil no Supabase com acesso apenas ao próprio candidato e às candidaturas autorizadas, usando as colunas existentes e RLS.
- [x] Integrar upload privado do CV e extracção assistida de PDF através de endpoint server-side, com revisão do candidato antes de guardar os dados.
- [x] Adicionar pré-visualização de CV internacional, barra de completude e validação de preenchimento.
- [x] Aplicar manualmente no Supabase a migração aditiva `0002_candidate_cv_structured_fields.sql` para experiência, educação, competências e portfólio; validação local concluída com teste específico, TypeScript e build de produção.

## Nova proposta — perfil modular, talento e ATS

- [x] Reorganizar `/profile` em etapas: identidade/localização, preferências e remuneração, skills e histórico.
- [x] Adicionar pretensão salarial com moeda AOA/USD e periodicidade; a conversão cambial automática fica fora desta fase para evitar valores desactualizados.
- [x] Parametrizar cargo, província/região, senioridade e tags exactas de competências para pesquisa da Barra de Talentos.
- [x] Criar validação server-side equivalente a schema e indicador dinâmico de Força do Perfil.
- [x] Implementar filtros parametrizados por URL na Barra de Talentos, com acesso protegido para empresas autenticadas e perfis públicos.
- [x] Implementar Match Score ATS explicável por competências, senioridade, localização, formação e orçamento salarial quando informado.
- [x] Mostrar triagem de candidaturas com compatibilidade, pré-requisitos e alertas de orçamento, sem decisões automáticas finais.
- [x] Criar testes unitários do perfil e cálculo de compatibilidade; a verificação de RLS existente continua aprovada.
- [x] Executar no Supabase a migração `0003_candidate_matching_fields.sql` para activar os novos campos de cargo, senioridade, áreas funcionais e remuneração AOA/USD; API REST respondeu HTTP 200 na verificação.

## Homepage da nova versão Next.js

- [x] Auditar a homepage publicada da nova aplicação; o domínio Vercel apresenta a interface Next.js correcta com navegação, pesquisa, vagas, soluções e área pessoal.
- [x] Refinar a hierarquia da homepage: proposta de valor, pesquisa de vagas, serviços, formações, parceiros e CTA.
- [x] Corrigir links e CTAs da homepage para conduzirem a páginas reais da nova aplicação, incluindo detalhes de vagas, perfil, revisão de CV, Banco de Talentos e propostas empresariais.
- [x] Melhorar responsividade, escala visual e consistência do header/footer da homepage; breakpoints desktop/mobile e controlos de escala existentes foram verificados.
- [x] Validar a homepage nova com testes, typecheck, build e revisão visual desktop/mobile; 41 testes, TypeScript sem erros e build com 30 rotas.

## Escolha inicial de utilizador na homepage

- [x] Mostrar no primeiro acesso um modal de escolha entre Candidato e Empresa na nova homepage.
- [x] Persistir a escolha localmente e manter a opção de explorar sem seleccionar um perfil; o fecho/limpeza do armazenamento permite reabrir a escolha.
- [x] Ligar cada escolha aos percursos correctos de candidato e empresa, com foco de teclado, semântica de diálogo e layout responsivo.
- [x] Validar a alteração com 41 testes, TypeScript e build de 30 rotas; sincronização na branch `main` pendente neste passo.

## Redesign da página de candidatos

- [x] Reformular o hero com copy mais inspiradora e três CTAs rápidos: Encontrar vagas, Formações e Plano de carreira.
- [x] Apresentar serviços para candidatos em blocos visuais mais dinâmicos e divertidos.
- [x] Substituir a grelha extensa de cursos por categorias de formação e botão “Ver catálogo completo”.
- [x] Validar responsividade, links, testes e build da página de candidatos; 43 testes aprovados, TypeScript sem erros e build de 30 rotas.
