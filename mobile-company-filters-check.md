# Verificação mobile — candidaturas, filtros e escala

A listagem `/vagas` em 390px mostra pesquisa, área, regime, salário e experiência em campos empilhados, sem overflow horizontal. O controlo flutuante de escala aparece no canto inferior e mostra 93%, permitindo reduzir, repor a 100% e aumentar.

A rota `/empresa/candidaturas` redirecciona correctamente para `/login` quando não existe sessão, protegendo o histórico empresarial. A conta empresarial autenticada continua a ser necessária para ver candidaturas e links assinados para CVs.

A conta candidata de demonstração submeteu uma candidatura com estado `submitted`; o painel empresarial tem uma página dedicada para a consultar. Foi carregado um CV PDF de demonstração no bucket privado e o painel gera URLs assinados temporários após autorização.
