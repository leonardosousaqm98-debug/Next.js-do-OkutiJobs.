# Notas de validação — funcionalidades de vagas

A preview Next.js respondeu 200 na homepage, na listagem `/vagas` e no detalhe `/vagas/demo-financas` após reinício do servidor dev para regenerar os chunks `.next`.

Na homepage, foram confirmados os campos de texto, localização e o select `Filtrar por categoria`, com opções Todas as categorias, Finanças, Contabilidade e Desporto. O botão Pesquisar e os links de oportunidade estão presentes.

No detalhe demo, foram confirmados o botão principal `Candidatar-me a esta vaga`, a secção `Requisitos da vaga` com lista legível e o segundo CTA `Enviar candidatura`. A rota mostra a empresa, localização, regime, contrato e área.

O dashboard empresarial é protegido e redirecciona para `/login` sem sessão; as contagens reais foram validadas separadamente com a conta demo Supabase: 10 vagas publicadas e 30 candidaturas.
