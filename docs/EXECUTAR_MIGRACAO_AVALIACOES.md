# Executar a migração das avaliações no Supabase

Esta migração cria a tabela que guarda permanentemente os resultados dos testes de candidatos.

## Passos

1. Entre no [Supabase](https://supabase.com/dashboard).
2. Abra o projecto usado pelo OkutiJobs em produção.
3. No menu esquerdo, seleccione **SQL Editor**.
4. Clique em **New query**.
5. Abra o ficheiro `supabase/migrations/0010_candidate_assessments.sql` no projecto.
6. Copie todo o conteúdo do ficheiro e cole no SQL Editor.
7. Clique em **Run**.
8. Confirme que aparece **Success** sem erros.
9. Abra **Table Editor** e confirme que existe `candidate_assessments`.
10. Em **Authentication → Policies**, confirme as políticas da tabela.

## Teste depois da migração

1. Entre como candidato.
2. Abra **Avaliações e testes**.
3. Conclua uma avaliação.
4. Actualize a página ou saia e entre novamente.
5. Confirme que o resultado continua em **Resultados guardados**.
6. Entre como empresa.
7. Abra uma vaga com candidaturas.
8. Clique em **Triar candidatos com IA**.
9. Confirme o gráfico **Fluxo de compatibilidade** e a linha dos testes no candidato.

## Se aparecer um erro

- `relation candidate_assessments does not exist`: a migração foi executada noutro projecto ou ainda não foi executada.
- `permission denied`: rever as políticas RLS e confirmar que a sessão é do candidato/empresa correcto.
- `Resultado calculado, mas não sincronizado`: a aplicação está funcional, mas a tabela ainda não está disponível no projecto de produção.

Não execute a migração repetidamente sem confirmar primeiro o resultado no histórico do SQL Editor.
