# OkutiJobs — Estado geral e roadmap de lançamento

**Revisão:** 24 de Agosto de 2026  
**Projecto:** OkutiJobs  
**Stack principal:** Next.js 15, App Router, React 19, Tailwind 4, Supabase Auth, Database e Storage.  
**Preview:** `https://3100-iimi20u3fovrfejf3g9v5-9285947e.us4.manus.computer`

## Resumo executivo

O OkutiJobs já possui uma base funcional de marketplace de recrutamento, com percursos públicos, contas de candidatos e empresas, candidaturas, armazenamento privado de CVs, internacionalização, dados de demonstração e um Backoffice administrativo. A aplicação Next.js compila em produção e a última validação registou **26 testes Vitest aprovados**, TypeScript sem erros, build concluído com **27 rotas** e recursos CSS da preview a responder correctamente.

O site ainda não deve ser considerado publicado em produção. Os principais passos restantes são a activação interactiva do MFA do administrador, o import do repositório Next.js correcto na Vercel, a configuração dos secrets e redirects de produção e uma homologação manual final com contas separadas.

## 1. Funcionalidades concluídas

| Domínio | Estado actual |
|---|---|
| Marca e design | Logo horizontal azul/laranja, wordmark OkutiJobs, favicon, paleta, escala/zoom e versão móvel implementados. |
| Homepage | Hero, modal de escolha candidato/empresa, CTAs, pesquisa, vagas em destaque, parceiros, formações, serviços e contactos. |
| Vagas públicas | Listagem, detalhe dinâmico, pesquisa e filtros por salário, área, experiência, categoria e localização. |
| Candidatura | Modal, autenticação de candidato, prevenção de duplicados, envio de candidatura e acompanhamento de estado. |
| Perfil candidato | Dados profissionais, competências, formação, experiência, preferências, favoritos, notificações, CV e portefólios. |
| Career AI | Revisão de CV, competências, compatibilidade com vagas, recomendações, feedback e exportação de perfil em PDF. |
| Perfil empresarial | Dados organizacionais, NIF, completude, pré-visualização, logo, vagas e apresentação pública. |
| Portal empresarial | Gestão de vagas, candidaturas recebidas, candidatos guardados, mensagens, entrevistas, notas, etiquetas e sugestões de matching. |
| Dashboard empresarial | KPIs, candidaturas por vaga, evolução diária, filtros de ofertas, gráficos e acções de recrutamento. |
| Formação corporativa | Catálogo de formações, apresentação compacta, pedidos personalizados e formulário B2B condicionado. |
| Propostas B2B | Formulário multi-etapas, posições, quantidade, localização, regime, faixa salarial, JD, testes, formação e anexos. |
| Internacionalização | PT principal, EN, FR e AR com RTL; preferência de idioma, URLs localizadas, canonical, hreflang e sitemaps. |
| Privacidade | Política pública, consentimentos por email/SMS/WhatsApp, FAQ, exportação e eliminação de conta com confirmação. |
| Supabase | Schema de recrutamento, Auth, RLS, bucket privado, candidaturas, mensagens, notificações e favoritos persistentes. |
| Dados demo | Empresa demo, 10 vagas publicadas e 3 candidatos por vaga, identificados como demonstração. |
| Backoffice | `/admin` protegido por sessão, membro admin activo, MFA TOTP, KPIs, empresas, candidatos, vagas, candidaturas, propostas, auditoria e indicadores operacionais. |
| Operações admin | Alteração de estados com auditoria, créditos/pagamentos, expiração controlada de vagas e notificações às empresas. |
| Relatórios admin | Pesquisa por texto, filtro por módulo/estado e exportação CSV de empresas, candidatos, vagas e candidaturas. |
| Organização Manus | Projecto identificado como OkutiJobs e preview guardada nos links persistentes da área Projetos. |

## 2. Segurança implementada

O acesso administrativo exige sessão Supabase válida e membro activo em `admin_members`. A política de hardening bloqueia a auto-elevação de utilizadores comuns. As operações globais passam por guard server-side, requerem MFA/AAL2 e geram auditoria. A service role permanece no servidor e os CVs são servidos através de URLs assinados após validação de autorização.

Os smoke tests RLS confirmam que dados privados do workflow não são expostos anonimamente e os endpoints protegidos rejeitam pedidos sem sessão. A validação completa entre duas empresas distintas ainda deve ser repetida manualmente antes do lançamento.

## 3. Estado dos pontos críticos

| Prioridade | Item | Estado | Próxima acção |
|---|---|---|---|
| P0 | MFA TOTP do primeiro administrador | **Pendente e adiado** | Entrar no `/admin`, configurar autenticador, confirmar código e validar AAL2. |
| P0 | Importação Vercel | **Preparada, não executada** | Importar o repositório/directório Next.js, nunca o projecto React/Vite antigo. |
| P0 | Variáveis Vercel | **Documentadas, falta configurar** | Definir Supabase URL, anon key, service role server-side e `NEXT_PUBLIC_APP_URL` em Preview/Production. |
| P0 | Redirects Supabase | **Pendente do domínio final** | Adicionar origem final e `/auth/callback` no Supabase Auth. |
| P0 | Homologação manual | **Parcial** | Testar candidato, empresa e admin com contas separadas. |
| P0 | Dados demo em produção | **Decisão necessária** | Remover, separar por ambiente ou manter com identificação explícita antes de publicar. |
| P1 | Operação diária do Backoffice | **Núcleo pronto** | Definir responsáveis, estados, prazos de resposta e procedimento interno. |
| P1 | Email transaccional | **A confirmar** | Configurar remetente, SPF, DKIM, DMARC, templates e recuperação de conta. |
| P1 | Monitorização | **Pendente** | Definir logs, alertas, uptime, erros e retenção de auditoria. |
| P1 | Backups e recuperação | **A confirmar** | Testar backup Supabase e procedimento de restauração. |
| P1 | Relatórios PDF | **CSV pronto** | Acrescentar PDF e filtros de período caso sejam necessários para a equipa. |
| P2 | LinkedIn OAuth | **Adiado por decisão** | Activar após publicação e testar callback definitivo. |
| P2 | Pagamentos/créditos reais | **Modelo base pronto** | Definir gateway, recibos, estornos, limites e reconciliação. |
| P2 | IA avançada | **Base disponível** | Rever explicabilidade, consentimento, revisão humana e custos. |
| P2 | Testes online | **Estrutura parcial** | Completar aplicação, resultados, permissões e relatórios. |

## 4. Validações realizadas

Foram executados TypeScript, Vitest, build de produção, smoke tests RLS, respostas HTTP da preview, rotas públicas, endpoints protegidos, detalhe de vagas, candidatura demo, pesquisa, filtros e recursos CSS. A build termina sem erros e gera as rotas públicas, protegidas e administrativas.

A tela preta da preview foi diagnosticada como uma condição de chunks Next.js antigos após a limpeza provocada pelo build. A preview foi reiniciada, os chunks foram regenerados e `/login`, `/`, `/vagas` e o CSS passaram a responder com `200`. Se o navegador continuar a mostrar a versão antiga, deve ser aberta a URL com um parâmetro novo ou feita uma actualização forçada.

## 5. Ordem recomendada para o lançamento

### Fase A — Segurança e homologação

Activar o MFA do administrador, testar o login e recuperação de conta, verificar isolamento entre empresas, confirmar acesso privado a CVs e validar auditoria das operações administrativas.

### Fase B — Vercel e produção

Importar o projecto Next.js correcto, configurar as variáveis nos ambientes Preview e Production, executar o build Vercel, definir o domínio final, actualizar os redirects do Supabase e repetir os smoke tests no deployment.

### Fase C — Conteúdo e operação

Rever textos legais com aconselhamento jurídico, confirmar consentimentos de comunicações, rever dados de demonstração, definir equipa responsável pelo Backoffice, validar emails transaccionais e documentar o suporte ao utilizador.

### Fase D — Crescimento pós-lançamento

Activar LinkedIn OAuth, concluir pagamentos/créditos, expandir testes online, finalizar traduções humanas completas, melhorar relatórios PDF e evoluir o matching/IA com revisão humana e explicabilidade.

## Critério de pronto para publicação

O OkutiJobs estará pronto para publicação quando o **MFA estiver activo**, o projecto Next.js estiver importado na Vercel, os secrets e redirects estiverem configurados, a homologação cross-account estiver aprovada, os dados demo tiverem uma decisão de ambiente e os testes críticos de candidatura, CV, notificações, mensagens, favoritos e Backoffice passarem no domínio final.
