# OkutiJobs Next.js — Base paralela

Esta pasta contém a nova camada Next.js da OkutiJobs. A aplicação actual em `/home/ubuntu/talentbridge` permanece intacta e continua a ser a versão operacional durante a migração.

## Arquitectura prevista

| Camada | Implementação | Estado |
|---|---|---|
| Interface pública e painéis | Next.js App Router + React + TypeScript | Base criada |
| Autenticação | Supabase Auth, com Google OAuth | Cliente preparado; aguarda credenciais |
| Dados | Supabase PostgreSQL + RLS | A preparar após configuração da instância |
| Documentos | Supabase Storage em bucket privado | A preparar após definição do bucket e políticas |
| Aplicação actual | React/Vite + Express/tRPC + Drizzle/MySQL | Mantida online durante a transição |

## Variáveis necessárias

Criar um `.env.local` apenas no ambiente de desenvolvimento e configurar as mesmas variáveis nos Environment Variables da Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

A `SUPABASE_SERVICE_ROLE_KEY` nunca pode ser usada em componentes Client, código partilhado ou variáveis `NEXT_PUBLIC_*`. Antes da migração de produção serão adicionadas políticas RLS, bucket privado `candidate-documents` e rotas de download através de URLs assinados.

## Migração progressiva

A primeira etapa é migrar autenticação e leitura de perfis. Em seguida serão migrados vagas e candidaturas, depois uploads de CV e documentos empresariais, e por fim os módulos de IA, notificações, traduções e dashboards. Cada módulo deve possuir testes e validação de paridade antes de mudar o tráfego.

Não executar migrações destrutivas nem desligar a aplicação React/Vite enquanto não existir exportação de dados, plano de rollback e validação ponta a ponta na nova aplicação.
