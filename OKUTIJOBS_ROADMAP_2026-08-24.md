# OkutiJobs — Inventário e plano de evolução

**Data da revisão:** 24 de Agosto de 2026  
**Arquitectura principal:** Next.js 15, App Router, React 19, Tailwind 4 e Supabase Auth, Database e Storage.  
**Estado geral:** base funcional e avançada, mas ainda necessita de homologação final e configuração de produção antes do lançamento público.

## 1. O que já foi feito

| Área | Estado | Evidência/observação |
|---|---|---|
| Migração tecnológica | Concluída | Projecto paralelo Next.js criado em `/home/ubuntu/okutijobs-next`; versão React/Vite antiga mantida separadamente. |
| Identidade visual | Concluída | Logo horizontal OkutiJobs, símbolo azul/laranja, wordmark e favicon integrados; versão mobile verificada. |
| Homepage | Concluída | Hero, navegação, pesquisa, cartões de destaque, parceiros, serviços, formações e rodapé com contactos. |
| Vagas públicas | Concluída | Listagem com pesquisa e filtros por salário, área, experiência, categoria e localização. |
| Dados demo | Concluída | Empresa demo, 10 vagas publicadas e 3 candidatos por vaga; dados identificados como demonstração. |
| Detalhe de vaga | Concluída | Rota dinâmica, localização/regime, requisitos em lista e CTA de candidatura destacado. |
| Candidatura | Concluída | Modal de candidatura, autenticação, prevenção de duplicados, envio para API e histórico do candidato. |
| Conta candidato | Concluída | Portal protegido, candidaturas, perfil, CV, favoritos, notificações e serviços de carreira. |
| Conta empresarial | Concluída | Portal protegido, perfil, vagas, candidaturas recebidas, CVs assinados e estatísticas por vaga. |
| Dashboard empresarial | Concluída | KPIs e barras comparativas alimentadas por contagens reais do Supabase. |
| Backoffice OkutiJobs | Núcleo concluído | `/admin` protegido por sessão, membro admin activo e guard server-side. Inclui visão global, listas e indicadores operacionais. |
| Gestão administrativa | Núcleo concluído | Estados de empresas, candidatos, vagas e propostas com confirmação, auditoria e protecção MFA para alterações. |
| Segurança admin | Núcleo concluído | `admin_members`, hardening contra auto-elevação e auditoria administrativa implementados. |
| MFA | Implementação concluída; activação pendente | Painel TOTP e endpoint AAL2 existem, mas a activação interactiva no navegador foi adiada. |
| RLS e privacidade | Validada em smoke tests | Tabelas privadas não expostas anonimamente; endpoints protegidos devolvem 401 sem sessão; CVs usam acesso assinado. |
| Mensagens, notificações e favoritos | Persistência implementada | Tabelas reais e APIs protegidas integradas; devem ser novamente homologadas com duas contas separadas antes do lançamento. |
| Expiração de vagas | Implementada | Endpoint admin controlado, sem timer no processo, com notificação à empresa e auditoria. |
| Pesquisa e relatórios admin | Implementados | Filtros por texto, módulo e estado; exportação CSV dos registos administrativos visíveis. |
| Internacionalização | Base implementada | PT/EN/FR/AR em páginas e fluxos prioritários; RTL árabe preparado; traduções humanas e revisão têm estruturas próprias. |
| SSO social | Suspenso por decisão | Google/LinkedIn não são prioridade nesta fase; LinkedIn fica para depois da publicação. |
| Organização Manus | Concluída | Projecto identificado como OkutiJobs e preview adicionada aos links persistentes da área Projetos. |

## 2. Validações já realizadas

A aplicação foi submetida a verificações de TypeScript, Vitest, build de produção, rotas públicas, rotas protegidas, filtros, detalhe de vaga, candidatura demo, RLS anónimo e carregamento dos recursos CSS. O último ciclo registou **26 testes Vitest aprovados**, TypeScript sem erros e build Next.js concluído com **27 rotas**. A preview foi reiniciada com limpeza dos chunks e `/login`, `/` e `/vagas` responderam 200 com CSS válido.

A homologação automatizada da empresa demo confirmou login, perfil, 10 vagas, 30 candidaturas e isolamento básico de favoritos privados. Esta validação técnica não substitui o teste manual final no navegador com contas separadas e sem utilizar dados reais de outros utilizadores.

## 3. O que ainda falta para lançamento

| Prioridade | Tarefa | Estado | Critério de conclusão |
|---|---|---|---|
| P0 | Activar MFA TOTP do administrador | Pendente/adiada | Administrador entra no `/admin`, conclui AAL2 e o painel mostra “MFA activo”. |
| P0 | Importar o repositório Next.js para Vercel | Preparado, não importado | Projecto correcto importado, build Vercel verde e domínio de preview acessível. |
| P0 | Configurar secrets na Vercel | Preparado, falta execução | Variáveis Supabase e `NEXT_PUBLIC_APP_URL` definidas em Preview e Production, sem service role no browser. |
| P0 | Actualizar redirects Supabase | Pendente até existir domínio | Origem final e `/auth/callback` adicionados em Authentication → URL Configuration. |
| P0 | Homologação final de autenticação | Parcial | Testar criação, confirmação, login, recuperação e logout para candidato, empresa e admin. |
| P0 | Homologação final de segurança | Parcial | Confirmar que empresa A não vê dados de empresa B e que candidato não vê documentos ou favoritos privados de terceiros. |
| P0 | Política de dados de demonstração | Necessário antes de produção | Manter demo apenas em Preview ou etiquetar/remover antes de publicar dados reais. |
| P1 | Operação diária do Backoffice | Núcleo disponível | Definir responsáveis, estados, prazos de resposta, gestão de propostas, moderação e procedimento de auditoria. |
| P1 | Exportação de relatórios | Primeira versão pronta | Acrescentar PDF e filtros de período se a equipa precisar de relatórios formais. |
| P1 | Notificações de produção | Implementação base pronta | Configurar emails/SMS/WhatsApp através de fornecedor aprovado e testar consentimento, opt-out e entregabilidade. |
| P1 | Recuperação de conta e confirmação de email | Fluxo implementado | Confirmar templates, remetente, domínio SPF/DKIM/DMARC e comportamento em produção. |
| P1 | Monitorização | Pendente | Definir logs, alertas, uptime, erros de API e retenção de auditoria. |
| P1 | Backup e restauração | Guia existente, operação a confirmar | Confirmar backups Supabase, política de recuperação e exportação segura dos dados críticos. |
| P2 | LinkedIn OAuth | Adiado | Activar somente depois do lançamento e testar callback definitivo. |
| P2 | IA para CV e matching | Base conceptual existente | Rever limites, consentimento, explicabilidade, revisão humana e custos antes de abrir a todos. |
| P2 | Traduções humanas | Estrutura existente | Completar workflow de revisão, aprovação, devolução e notificações para todo o conteúdo publicado. |
| P2 | Marketplace de testes | Parcial | Implementar catálogo, aplicação, resultados, permissões e relatórios dos testes psicotécnicos/técnicos. |
| P2 | Créditos e cobrança | Modelo base existente | Definir preço, pagamento real, recibos, estornos, limites e reconciliação antes de cobrar os 50.000 Kz. |

## 4. Riscos importantes

O maior risco imediato é publicar sem MFA activado para o administrador e sem testar o isolamento entre duas empresas reais. O segundo é importar o projecto errado para a Vercel: deve ser utilizado o repositório/directório Next.js, nunca a aplicação React/Vite antiga. O terceiro é deixar dados de demonstração visíveis em produção sem uma política clara de identificação ou limpeza.

A `SUPABASE_SERVICE_ROLE_KEY` deve permanecer exclusivamente server-side. A equipa deve evitar inserir credenciais ou códigos MFA na conversa. A operação de expiração deve ser chamada por um mecanismo agendado externo ou por execução manual autorizada; não deve depender de timers dentro do processo Next.js.

## 5. Ordem recomendada de execução

**Fase A — Segurança:** activar MFA, testar duas contas empresariais e uma conta candidata, validar RLS, CV assinado e auditoria.  
**Fase B — Produção:** importar o Next.js correcto na Vercel, configurar secrets, redirects e domínio, executar build e smoke tests no deployment.  
**Fase C — Conteúdo e operação:** rever textos legais, consentimentos de email/SMS/WhatsApp, contactos, dados demo, estados de moderação e responsabilidades da equipa.  
**Fase D — Crescimento:** LinkedIn OAuth, IA avançada, traduções humanas completas, pagamentos/créditos, testes online e relatórios PDF.

## 6. Estado de acompanhamento

O OkutiJobs pode avançar para a preparação de produção, mas **não deve ser considerado lançado publicamente** enquanto os itens P0 não estiverem fechados. O próximo marco operacional é: **MFA activo + Vercel importada + redirects Supabase actualizados + homologação cross-account aprovada**.
