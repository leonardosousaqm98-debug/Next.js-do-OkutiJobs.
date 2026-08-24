# Auditoria de paridade OkutiJobs

## Conclusão executiva

O novo Next.js não perdeu a base essencial do OkutiJobs, mas ainda não reproduz toda a experiência avançada que existia no protótipo React/Vite. Para o lançamento inicial, a diferença mais importante não é visual: são alguns fluxos de gestão e persistência que devem ser confirmados antes de divulgar o site. As funcionalidades avançadas de IA, internacionalização editorial, talent pool avançado e SSO podem continuar adiadas sem bloquear o MVP.

## Matriz de paridade

| Área | Site anterior | Next.js actual | Prioridade | Recomendação |
|---|---|---|---|---|
| Homepage, marca, contactos e pesquisa | Implementados | Implementados e publicados | P0 | Manter |
| Vagas, filtros, detalhe e candidatura | Implementados | Implementados com APIs Supabase | P0 | Homologar com uma conta candidata |
| Registo com escolha Candidato/Empresa | Implementado | Recuperado no formulário actual | P0 | Testar confirmação de email |
| Login email/palavra-passe | Implementado | Funcional no domínio Vercel | P0 | Confirmar recuperação de palavra-passe |
| Perfil e CV privado do candidato | Implementados | Perfil e upload preparados; URLs assinados | P0 | Confirmar upload e leitura de CV em produção |
| Dashboard de candidato | Implementado | Rota `/candidato` e candidaturas existem | P0 | Confirmar que a conta vê perfil, candidaturas e vagas |
| Dashboard empresarial | Implementado | Rota `/empresa` e candidaturas existem | P0 | Homologar isolamento entre empresas |
| Backoffice administrativo | Implementado | `/admin`, RLS, auditoria e MFA implementados | P0 | Activar MFA manualmente antes da produção definitiva |
| Privacidade e consentimento | Implementados | `/privacidade` publicada | P0 | Rever texto final com responsável legal da empresa |
| Propostas B2B | Implementadas no legado | Página empresarial existe; fluxo completo deve ser revalidado | P1 | Confirmar formulário e recepção antes de anunciar o serviço |
| Mensagens, notificações e favoritos | Tabelas/API no legado | APIs Supabase existem; UI completa não está igualmente exposta | P1 | Expor apenas o essencial no portal após homologação |
| Formações e catálogo corporativo | Implementados | `/formacoes` publicada | P1 | Confirmar conteúdo e links de inscrição |
| Revisão de CV por IA | Implementada no legado | Página de revisão existe, mas fluxo completo de IA não é P0 | P2 | Adiar até a operação base estar estável |
| Matching e estatísticas de compatibilidade | Implementados no legado | Estrutura inicial e dados existem, mas experiência avançada não está completa | P2 | Adiar para uma fase de produto posterior |
| Talent Pool empresarial avançado | Implementado no legado | Favoritos/API e candidaturas existem; pesquisa, notas, tags, exportação e convites não estão completos | P2 | Adiar, excepto consulta básica de candidaturas |
| Traduções e URLs localizadas | Implementadas no legado | Páginas públicas base existem; internacionalização editorial completa não está mesclada | P2 | Adiar, começando depois por inglês e francês |
| SSO Google/LinkedIn | Implementado/testado no legado | Decisão actual é adiar SSO | P2 | Não mesclar antes da publicação |
| Testes online e avaliação empresarial | Implementados no legado | Página empresarial descreve serviços, mas execução completa não é MVP | P2 | Adiar até haver operação e relatórios definidos |
| Pagamentos e créditos | Previstos no legado | Stripe/créditos reais não activos | P2 | Adiar; não cobrar no MVP sem integração financeira concluída |
| Automações e expiração de vagas | Endpoint preparado | Expiração controlada existe; agendamento depende do ambiente publicado | P1 | Activar após confirmar domínio definitivo |
| Sitemap, robots e metadados | Implementados no legado | Sitemap/robots e metadados base publicados | P1 | Rever versões por idioma depois da internacionalização |

## O que deve ser mesclado antes do lançamento

O conjunto mínimo que ainda merece uma homologação funcional é o percurso completo de candidato: criar conta, confirmar email, iniciar sessão, completar perfil, carregar CV privado, consultar vagas, candidatar-se e consultar o histórico. Em paralelo, deve ser validado o percurso empresarial básico: iniciar sessão, completar o perfil, publicar ou consultar uma vaga e visualizar candidaturas recebidas sem aceder a dados de outra empresa.

Também é importante confirmar no domínio Vercel a recuperação de palavra-passe, os redirects do Supabase Auth, o MFA do administrador, o isolamento RLS entre contas e a recepção de pedidos de serviço. Estes pontos são de lançamento porque afectam confiança, segurança e operação, mesmo que a interface avançada fique para depois.

## O que não deve ser mesclado agora

A revisão de CV por IA, matching avançado, talent pool com notas e tags, exportações PDF, testes online, SSO LinkedIn, traduções humanas completas e pagamentos por créditos não devem voltar a entrar no caminho crítico. O código legado demonstra que foram concebidos, mas a sua migração sem uma homologação completa aumentaria o risco de regressões e atrasaria a publicação.

## Critério de pronto para o MVP

O MVP pode ser considerado pronto quando os fluxos P0 acima funcionarem no domínio Vercel com duas contas separadas, quando o candidato conseguir gerir o próprio perfil e candidaturas, quando a empresa conseguir ver apenas as suas candidaturas e quando o administrador conseguir operar com MFA. Os módulos P1 podem ser activados progressivamente; os P2 ficam registados como roadmap de evolução.
