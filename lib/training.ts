export type TrainingCourse = {
  slug: string;
  title: string;
  area: string;
  level: string;
  mode: string;
  duration: string;
  price: string;
  estimatedDate: string;
  schedule: string;
  description: string;
  outcomes: string[];
};

export const trainingCourses: TrainingCourse[] = [
  { slug: "excel-profissional-para-negocios", title: "Excel profissional para negócios", area: "Escritório", level: "Intermédio", mode: "Online", duration: "12 horas", price: "35.000 Kz", estimatedDate: "Próxima turma: a confirmar com o grupo", schedule: "2 semanas · 2 sessões por semana", description: "Aprenda a organizar, analisar e apresentar informação de negócio com Excel de forma prática e profissional.", outcomes: ["Fórmulas e funções essenciais", "Tabelas, filtros e dashboards", "Análise de dados para decisões" ] },
  { slug: "contabilidade-geral-e-financeira", title: "Contabilidade geral e financeira", area: "Contabilidade", level: "Fundamentos", mode: "Híbrido", duration: "20 horas", price: "55.000 Kz", estimatedDate: "Próxima turma: a confirmar com o grupo", schedule: "4 semanas · sessões presenciais e online", description: "Construa uma base sólida em contabilidade, leitura financeira e controlo das operações de uma organização.", outcomes: ["Lançamentos e demonstrações financeiras", "Reconciliação e controlo", "Noções de gestão financeira" ] },
  { slug: "vendas-consultivas-e-negociacao", title: "Vendas consultivas e negociação", area: "Vendas", level: "Avançado", mode: "Presencial", duration: "16 horas", price: "45.000 Kz", estimatedDate: "Próxima turma: a confirmar com o grupo", schedule: "2 dias intensivos · presencial", description: "Desenvolva uma abordagem comercial orientada para valor, relacionamento e resultados sustentáveis.", outcomes: ["Diagnóstico das necessidades", "Proposta de valor e negociação", "Fecho e acompanhamento comercial" ] },
  { slug: "lideranca-de-equipas-de-alto-desempenho", title: "Liderança de equipas de alto desempenho", area: "Liderança", level: "Executivo", mode: "Híbrido", duration: "10 horas", price: "50.000 Kz", estimatedDate: "Próxima turma: a confirmar com o grupo", schedule: "2 semanas · formato híbrido", description: "Fortaleça a liderança, a comunicação e a capacidade de mobilizar equipas para objectivos comuns.", outcomes: ["Delegação e acompanhamento", "Feedback e conversas difíceis", "Cultura de responsabilidade" ] },
  { slug: "atendimento-ao-cliente", title: "Atendimento ao cliente", area: "Soft Skills", level: "Fundamentos", mode: "Online", duration: "8 horas", price: "25.000 Kz", estimatedDate: "Próxima turma: a confirmar com o grupo", schedule: "1 semana · 4 sessões online", description: "Aprenda técnicas para criar experiências de atendimento consistentes, humanas e orientadas para a resolução.", outcomes: ["Comunicação com o cliente", "Gestão de reclamações", "Qualidade e fidelização" ] },
  { slug: "comunicacao-profissional", title: "Comunicação profissional", area: "Soft Skills", level: "Intermédio", mode: "Online", duration: "8 horas", price: "25.000 Kz", estimatedDate: "Próxima turma: a confirmar com o grupo", schedule: "1 semana · 4 sessões online", description: "Comunique com clareza em reuniões, emails, apresentações e momentos de decisão profissional.", outcomes: ["Escrita profissional", "Apresentações mais seguras", "Escuta e comunicação assertiva" ] },
  { slug: "gestao-de-projectos", title: "Gestão de projectos", area: "Gestão", level: "Intermédio", mode: "Híbrido", duration: "18 horas", price: "60.000 Kz", estimatedDate: "Próxima turma: a confirmar com o grupo", schedule: "3 semanas · formato híbrido", description: "Aprenda a planear, executar e acompanhar projectos com estrutura, prioridades e indicadores claros.", outcomes: ["Planeamento e cronograma", "Gestão de riscos e recursos", "Monitorização e encerramento" ] },
  { slug: "literacia-digital-e-produtividade", title: "Literacia digital e produtividade", area: "Escritório", level: "Fundamentos", mode: "Online", duration: "6 horas", price: "20.000 Kz", estimatedDate: "Próxima turma: a confirmar com o grupo", schedule: "1 semana · 3 sessões online", description: "Ganhe confiança no uso das ferramentas digitais essenciais para trabalhar, colaborar e produzir melhor.", outcomes: ["Ferramentas de trabalho digital", "Organização de ficheiros e tarefas", "Colaboração online" ] },
];

export function getTrainingCourse(slug: string) {
  return trainingCourses.find((course) => course.slug === slug);
}

export type TrainingEnrollment = {
  course: string;
  enrolmentType: "pessoal" | "corporativa";
  name: string;
  email: string;
  phone: string;
  organisation?: string;
  participants?: string;
  note?: string;
};
