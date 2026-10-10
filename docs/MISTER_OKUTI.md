# Mister Okuti — configuração e funcionamento

O Mister Okuti está disponível em `/mister-okuti` para contas autenticadas de candidato e de empresa. A API `POST /api/mister-okuti` identifica o papel pela sessão Supabase; não aceita o papel indicado pelo navegador.

## Configurar IA na Vercel

Configure **uma** credencial de fornecedor no ambiente de servidor da Vercel (Production/Preview conforme necessário):

- `OPENAI_API_KEY` — usa a API OpenAI; o modelo predefinido é `gpt-4o-mini`.
- `GEMINI_API_KEY` — alternativa Google Gemini; o modelo predefinido é `gemini-2.5-flash`.
- Se o projecto já utiliza `BUILT_IN_FORGE_API_KEY`, o Mister Okuti também o pode reutilizar; o modelo predefinido é `gpt-5-mini`.

Opcionalmente, defina `MISTER_OKUTI_MODEL` para seleccionar um modelo compatível com o fornecedor configurado. Para um endpoint OpenAI-compatible personalizado, pode definir `OPENAI_BASE_URL`.

**Não** use o prefixo `NEXT_PUBLIC_` nestas variáveis. As chamadas de IA são feitas apenas na rota server-side; não coloque chaves em componentes, no navegador ou no repositório. Depois de alterar variáveis na Vercel, faça o redeploy do projecto. Nenhuma variável real é incluída neste repositório.

## Acesso aos dados

- **Candidato:** a API usa a sessão e as políticas RLS do Supabase para ler apenas o próprio perfil, e apenas vagas com estado `published`. Os resultados ligam às páginas públicas das vagas.
- **Recrutador:** a pesquisa continua sujeita às políticas RLS e filtra explicitamente perfis com `visibility = 'public'` e `open_to_work = true`. Só envia ao modelo um resumo profissional limitado (cargo, competências, formação profissional e localização); não pesquisa nomes, contactos, documentos/CV nem avaliações.
- As mensagens e o contexto profissional mínimo necessário são enviados ao fornecedor de IA configurado server-side. A aplicação não persiste a conversa; as condições de tratamento do fornecedor escolhido aplicam-se ao processamento.
- O rascunho é validado e limitado no servidor, preenchido no formulário de criação já existente e não é guardado nem publicado automaticamente. A validação server-side deixa sempre vazios os critérios de idade e nacionalidade.
- A ordenação por termos coincidentes é uma ajuda de pesquisa, não uma recomendação de contratação. A revisão humana é obrigatória; o assistente não deve usar atributos protegidos nem decidir contratar, rejeitar ou excluir pessoas.
- As conversas não são persistidas pela aplicação; o histórico fica apenas no estado da página enquanto a conversa está aberta.

## Verificação local

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm build
```

A página e a API dependem das variáveis Supabase existentes no projecto. Esta implementação não altera a base de dados, não requer migração SQL e não publica nem activa alterações em produção.
