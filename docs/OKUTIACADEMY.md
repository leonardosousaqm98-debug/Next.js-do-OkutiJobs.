# OkutiAcademy — implementação e activação

Este módulo acrescenta micro-learning, inscrições/turmas, progresso, badges, ranking opcional e certificados com QR Code e validação pública por hash.

## Rotas e funcionalidades

- `/academy`: área autenticada do candidato, catálogo, recomendações, aulas texto/áudio/vídeo, progresso, XP, badges, ranking com adesão voluntária e certificados.
- `/academy/instructor`: área autenticada para instrutores aprovados, criação de turmas, alunos inscritos, progresso e links de validação.
- `/certificados/[code]`: página pública de verificação do certificado. O código é aleatório (128 bits) e o hash SHA-256 cobre os campos essenciais da emissão.
- `POST /api/academy/enrollments`: inscrição atómica numa aprendizagem autónoma ou turma aberta.
- `POST /api/academy/progress`: início e conclusão de aula registados por funções transaccionais PostgreSQL, com intervalo mínimo de leitura/reprodução, XP, badges e emissão automática do certificado no fecho do curso.
- A migration cria regras que recomendam cursos de IVA ou Primavera após reprovação numa validação de competência correspondente.

## Supabase

`supabase/migrations/0014_okutiacademy.sql` é **aditiva** e cria as tabelas `academy_courses`, `academy_lessons`, `academy_cohorts`, `academy_enrollments`, `academy_lesson_progress`, `academy_certificates`, `academy_recommendations`, `academy_skill_course_rules`, `academy_badges`, `academy_learner_badges`, `academy_learner_settings` e `academy_instructors`, bem como as funções transaccionais e as políticas RLS. A migration `0015_okutiacademy_rpc_permissions.sql` restringe as RPC internas para que não possam ser chamadas por `anon`.

As migrations 0014 e 0015 já foram aplicadas e verificadas no projecto Supabase partilhado por Staging e Produção (`wmkxeqghopmbsfwptpzq`). **Não as volte a executar** nesse projecto. O ficheiro 0015 foi recuperado do histórico de migrations da base para manter a fonte versionada alinhada com o estado aplicado.

### Conceder acesso a um instrutor

O acesso é deliberadamente atribuído por um operador autorizado; utilizadores não podem promover a própria conta. Depois de confirmar a identidade e o UUID do utilizador em `auth.users`, um administrador autorizado pode activar o instrutor em staging:

```sql
insert into public.academy_instructors (user_id, display_title, active, approved_by, approved_at)
values ('<UUID_DO_UTILIZADOR>', 'Instrutor OkutiAcademy', true, '<UUID_DO_APROVADOR>', now())
on conflict (user_id) do update
set display_title = excluded.display_title,
    active = true,
    approved_by = excluded.approved_by,
    approved_at = now();
```

Não substituir os UUIDs de exemplo sem validar a identidade e o ambiente. Desactivar acesso mudando `active` para `false`.

## Conteúdo de baixo consumo de dados

O catálogo de demonstração inclui cursos curtos de IVA e Primavera com aulas de texto e duração declarada entre 3 e 5 minutos. O schema suporta `text`, `audio` e `video`, URLs alternativas comprimidas (`low_bandwidth_url`), transcrição e tamanho do ficheiro. Os exemplos não incluem gravações: antes do lançamento, a equipa pedagógica deve rever os textos, carregar áudio/vídeo optimizados e testar o consumo de dados no dispositivo-alvo. A interface não carrega nem inicia reprodução automaticamente.

## Certificados, blockchain e reconhecimento

O QR Code aponta para o verificador público; a verificação compara o hash SHA-256 com os campos imutáveis guardados no Supabase. As políticas impedem alunos de inserir ou editar progresso/certificados directamente; a inscrição, início/conclusão e emissão são feitas por RPC autenticada. O servidor exige que a aula esteja aberta durante, pelo menos, metade da duração declarada (mínimo de 60 segundos) antes de contar a conclusão. Campos `anchor_network`, `anchor_tx_hash` e `anchored_at` deixam espaço para registar uma âncora futura.

**Não há transacção on-chain implementada nesta entrega.** A validação pública e o hash detectam alterações nos dados registados, mas não constituem, isoladamente, uma âncora blockchain, acreditação governamental, equivalência académica ou reconhecimento por multinacionais. Isso exige escolha de rede/serviço, gestão de chaves, procedimentos de revogação, validação jurídica e acordos com instituições/emissores reconhecidos.

O ranking é opt-in. Apenas o nome público escolhido pelo aluno e a soma de XP são apresentados no RPC público de ranking; a participação vem desactivada por omissão. Para as listas de turma, a migration não cria política de leitura de `public.profiles` para instrutores. Em vez disso, a RPC `academy_instructor_learners` devolve exclusivamente o UUID e o nome de apresentação dos alunos inscritos nas turmas do próprio instrutor aprovado. O instrutor não obtém acesso a outros campos do perfil através desta funcionalidade.

## Limitações e próximos passos operacionais

1. Criar e activar instrutores aprovados; preparar uma página/workflow administrativo para esse provisionamento quando houver aprovação do processo.
2. Carregar assets de conteúdo, rever pedagogia, legendas/transcrições, direitos de utilização e variantes de baixo débito.
3. Adicionar provas formativas/avaliações finais se a política de certificação exigir mais do que conclusão das aulas.
4. Decidir rede e parceiro de acreditação antes de qualquer afirmação de publicação blockchain ou reconhecimento externo.
5. Validar os fluxos de aluno, instrutor, ranking opt-in e certificado em staging após a publicação; não reaplicar as migrations já verificadas.
