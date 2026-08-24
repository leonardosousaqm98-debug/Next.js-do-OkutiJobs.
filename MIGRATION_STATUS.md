# Estado da migração Next.js + Supabase

## Marco concluído

A Project URL foi validada contra o endpoint de autenticação. As tabelas `profiles`, `candidate_profiles`, `company_profiles`, `jobs`, `applications` e `candidate_documents` respondem pelo PostgREST. O bucket privado `candidate-documents` existe, está configurado para PDFs e aceita ficheiros até 10 MB.

A base Next.js já contém o início de sessão com Google OAuth, o callback `/auth/callback`, a rota protegida `/api/profile` e a rota protegida `/api/candidate/cv`. O upload verifica MIME, assinatura `%PDF-`, tamanho e ownership pelo primeiro segmento do path. O download usa URLs assinados de curta duração e não expõe `storage_path` ao cliente.

## Acções manuais no Supabase

A verificação actual mostra o provider Google como `true` no projecto Supabase. O Client ID e Client Secret foram configurados e o callback de produção do Supabase foi registado no Google Cloud Console. Para desenvolvimento, mantém-se `http://localhost:3000/auth/callback`; antes da publicação deve ser adicionado o callback do domínio Vercel definitivo. Na Vercel, configurar as mesmas URLs de produção no redirect permitido. A URL local será `http://localhost:3000/auth/callback` e a URL de produção deverá usar o domínio Vercel definitivo.

## Limites deste marco

Nenhum dado da aplicação antiga foi copiado automaticamente. A aplicação React/Vite + Express/tRPC + Drizzle/MySQL continua operacional. A migração de vagas, candidaturas, notificações, traduções, IA e dashboards deve ser feita por módulos, com exportação, reconciliação e rollback definidos antes de trocar o tráfego.

A chave service role deve ser confirmada como realmente rotacionada no painel. O valor enviado anteriormente aparentava coincidir com o valor anterior; por segurança, confirmar esta condição antes da publicação.


## Verificação de marca — 23 de Agosto de 2026

A homepage passou a usar o asset oficial recortado do logo no cabeçalho, no visual principal do hero e no rodapé. O wordmark OkutiJobs combina o nome com a assinatura de carreira e uma profundidade visual subtil em CSS. A rota `/` foi verificada com navegação, pesquisa, serviços, parceiros, CTA e contactos preservados; os 12 testes e o build Next.js continuam aprovados.


## Nota de verificação de preview

A pré-visualização da base Next.js foi confirmada pelo endereço independente `https://3100-iimi20u3fovrfejf3g9v5-9285947e.us4.manus.computer/`. A ferramenta de screenshot gerida pelo projecto `talentbridge` continua a apontar para a aplicação React/Vite antiga na porta 3000; essa captura não representa a nova base Next.js e não deve ser usada para avaliar o seu layout.
