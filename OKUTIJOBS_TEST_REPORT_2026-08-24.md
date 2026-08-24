# OkutiJobs — Relatório de testes

**Data:** 24 de Agosto de 2026  
**Ambiente:** preview Next.js em `https://3100-iimi20u3fovrfejf3g9v5-9285947e.us4.manus.computer`

## Resultado geral

A ronda automática da aplicação passou nos principais percursos públicos e nos controlos anónimos de segurança. A build de produção foi concluída, TypeScript não apresentou erros e a suite ficou com **26 testes Vitest aprovados**. A preview respondeu correctamente depois da regeneração dos chunks, incluindo o CSS.

| Área testada | Resultado | Observação |
|---|---|---|
| Homepage | PASS | HTTP 200 e conteúdo OkutiJobs presente. |
| Login/registo | PASS | HTTP 200; formulário e reenvio de confirmação presentes. |
| Listagem de vagas | PASS | HTTP 200; pesquisa/filtros e dados demo disponíveis. |
| Detalhe de vaga | PASS | Vaga `demo-financas` responde 200, com requisitos e candidatura. |
| Formações | PASS | HTTP 200. |
| Página de candidatos | PASS | HTTP 200. |
| Página de empresas | PASS | HTTP 200. |
| Privacidade | PASS | HTTP 200 e conteúdo de privacidade presente. |
| Sobre Nós/parceiros | PASS | Rotas públicas respondem 200. |
| API de candidaturas | PASS | Sem sessão devolve 401. |
| API de mensagens | PASS | Sem sessão devolve 401. |
| API de notificações | PASS | Sem sessão devolve 401. |
| API de favoritos | PASS | Sem sessão devolve 401. |
| APIs admin | PASS | Sem sessão devolvem 401 em POST. |
| Página admin | PASS | Sem sessão redirecciona para login. |
| CSS da preview | PASS | `layout.css` responde 200; chunks regenerados. |
| TypeScript | PASS | `tsc --noEmit` sem erros. |
| Vitest | PASS | 26 testes em 12 ficheiros. |
| Build produção | PASS | Next.js gera 27 rotas sem erros. |
| Responsividade estrutural | PASS | 25 media queries, regras de movimento reduzido e tokens responsive detectados. |

## Observação sobre `/candidato/candidaturas`

A rota devolve 200 porque funciona como uma shell client-side. O conteúdo das candidaturas não é entregue pela página; é carregado pela API protegida, que devolve 401 sem sessão. Portanto, não foi identificada exposição anónima de candidaturas. Como melhoria futura, pode ser aplicado um redirect server-side para uniformizar o comportamento visual das áreas protegidas.

## Testes que ainda requerem operação manual

O ambiente automático não substitui a homologação manual com contas reais. Antes da publicação, é necessário testar no navegador a criação e confirmação de conta, login, recuperação de palavra-passe, logout, candidatura, alteração de estado empresarial, mensagens, notificações, favoritos, acesso assinado a CV e isolamento entre duas empresas distintas.

A activação do MFA TOTP do administrador continua adiada por decisão do utilizador. O painel e o endpoint AAL2 existem, mas o estado só deve ser considerado concluído depois de o administrador configurar o autenticador e confirmar um código no navegador.

## Bloqueadores de publicação

O site não deve ser publicado definitivamente até que o MFA esteja activo, o projecto Next.js correcto seja importado para a Vercel, os secrets sejam configurados em Preview e Production, os redirects finais do Supabase sejam actualizados, a homologação cross-account seja aprovada e os dados de demonstração tenham uma decisão de remoção ou separação por ambiente.

## Próximas acções recomendadas

1. Fazer a homologação manual com três contas separadas: administrador, empresa e candidato.
2. Importar `/home/ubuntu/okutijobs-next` na Vercel, configurar as variáveis e executar o primeiro deployment de Preview.
3. Repetir este relatório no domínio Vercel e fechar o MFA antes da publicação.
