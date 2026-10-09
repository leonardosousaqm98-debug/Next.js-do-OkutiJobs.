"use client";
import { useEffect, useMemo, useState } from "react";

type Kind = "language" | "knowledge" | "psychometric";
type Question = { prompt: string; options: string[]; correct?: number; points?: number[] };
const bank: Record<Kind, Question[]> = {
  language: [
    { prompt: "Choose the correct sentence:", options: ["She work in Luanda.", "She works in Luanda.", "She working in Luanda.", "She worked in Luanda every day."], correct: 1 },
    { prompt: "What does “deadline” mean?", options: ["Prazo limite", "Reunião", "Salário", "Contrato"], correct: 0 },
    { prompt: "Complete: “I have worked here ___ 2022.”", options: ["for", "since", "during", "at"], correct: 1 },
    { prompt: "Choose the most professional email opening:", options: ["Hey!", "Yo, send this.", "Dear Hiring Manager,", "What’s up?"], correct: 2 },
    { prompt: "“Reliable” is closest to:", options: ["Confiável", "Rápido", "Caro", "Temporário"], correct: 0 },
  ],
  knowledge: [
    { prompt: "Qual é a melhor prática ao receber dados pessoais de um candidato?", options: ["Partilhar com qualquer pessoa", "Guardar apenas o necessário e limitar o acesso", "Publicar no anúncio", "Enviar para grupos externos"], correct: 1 },
    { prompt: "Numa folha de cálculo, que função soma valores?", options: ["SUM", "LINK", "TEXTONLY", "OPEN"], correct: 0 },
    { prompt: "Qual documento descreve responsabilidades e requisitos de uma vaga?", options: ["JD / descrição de função", "Recibo", "Factura", "Mapa de férias"], correct: 0 },
    { prompt: "O que significa KPI?", options: ["Indicador-chave de desempenho", "Código de pagamento", "Plano de contratação internacional", "Perfil de conhecimento interno"], correct: 0 },
    { prompt: "Antes de publicar uma vaga gerada por IA, a empresa deve:", options: ["Publicar sem rever", "Rever e corrigir os dados", "Remover os requisitos", "Esconder a descrição"], correct: 1 },
  ],
  psychometric: [
    { prompt: "Sequência: 2, 4, 8, 16. Qual é o próximo número?", options: ["18", "24", "32", "36"], correct: 2, points: [0, 0, 2, 0] },
    { prompt: "Se todos os relatórios são documentos e alguns documentos são digitais, podemos concluir que:", options: ["Todos os relatórios são digitais", "Nenhum relatório é documento", "Não é possível garantir que os relatórios sejam digitais", "Todos os documentos são relatórios"], correct: 2, points: [0, 0, 2, 0] },
    { prompt: "Perante uma tarefa urgente com informação incompleta, eu primeiro:", options: ["Ignoro a tarefa", "Confirmo prioridades e recolho os dados essenciais", "Invento os dados em falta", "Passo a responsabilidade sem avisar"], points: [0, 2, 1, 0] },
    { prompt: "Quando recebo feedback difícil, a minha reacção mais profissional é:", options: ["Ouvir, pedir exemplos e definir uma melhoria", "Responder imediatamente", "Ignorar sempre", "Culpar outra pessoa"], points: [2, 0, 0, 0] },
    { prompt: "Para resolver um problema complexo, prefiro:", options: ["Dividi-lo em partes e validar hipóteses", "Escolher a primeira resposta", "Esperar que desapareça", "Evitar pedir contexto"], points: [2, 0, 0, 0] },
  ],
};
const labels: Record<Kind, string> = { language: "Idioma", knowledge: "Conhecimento profissional", psychometric: "Raciocínio e perfil" };

export function CandidateAssessments() {
  const [kind, setKind] = useState<Kind>("language");
  const [language, setLanguage] = useState("en");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; level: string } | null>(null);
  const [history, setHistory] = useState<Array<{ assessment_type: string; language_code: string | null; score: number; level: string | null }>>([]);
  const [message, setMessage] = useState("");
  const questions = bank[kind];
  const current = questions[index];
  const progress = Math.round(((index + (result ? 1 : 0)) / questions.length) * 100);
  useEffect(() => { fetch("/api/candidate/assessments").then((r) => r.json()).then((body) => setHistory(body.assessments ?? [])).catch(() => undefined); }, []);
  const title = useMemo(() => labels[kind], [kind]);
  function selectKind(next: Kind) { setKind(next); setStarted(false); setResult(null); setAnswers([]); setIndex(0); setMessage(""); }
  function finish(nextAnswers: number[]) {
    const raw = nextAnswers.reduce((sum, answer, questionIndex) => { const question = questions[questionIndex]; return sum + (question.points ? question.points[answer] ?? 0 : answer === question.correct ? 2 : 0); }, 0);
    const max = questions.reduce((sum, question) => sum + (question.points ? Math.max(...question.points) : 2), 0);
    const score = Math.round((raw / max) * 100);
    const level = score >= 80 ? "Avançado" : score >= 60 ? "Intermédio" : "Em desenvolvimento";
    setResult({ score, level });
    setMessage("A avaliação foi concluída. O resultado pode ser considerado pelas empresas juntamente com o seu perfil e CV.");
    fetch("/api/candidate/assessments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assessmentType: kind, languageCode: kind === "language" ? language : null, score, level, answers: nextAnswers }) }).then(async (response) => { if (!response.ok) setMessage("Resultado calculado. A sincronização com o perfil ficará disponível após a activação da tabela de avaliações."); else setHistory((currentHistory) => [{ assessment_type: kind, language_code: kind === "language" ? language : null, score, level }, ...currentHistory.filter((item) => !(item.assessment_type === kind && item.language_code === (kind === "language" ? language : null)))]); }).catch(() => undefined);
  }
  function answer(value: number) { const next = [...answers, value]; setAnswers(next); if (index + 1 >= questions.length) finish(next); else setIndex(index + 1); }
  return <main><header className="site-header"><a className="brand" href="/candidato">OkutiJobs</a><a className="button button-dark" href="/candidato">Voltar ao painel</a></header><section className="assessment-page"><div className="portal-heading"><div><p className="eyebrow">Avaliações OkutiJobs</p><h1>Mostre o que sabe.</h1><p className="lede">Faça avaliações curtas e partilhe resultados verificáveis com empresas. Estes testes são complementares e não substituem uma entrevista humana.</p></div><span className="portal-status">● Perfil em evolução</span></div><div className="assessment-tabs">{(Object.keys(labels) as Kind[]).map((item) => <button type="button" className={kind === item ? "active" : ""} onClick={() => selectKind(item)} key={item}>{labels[item]}</button>)}</div>{kind === "language" && <div className="assessment-language"><label htmlFor="assessment-language">Idioma avaliado</label><select id="assessment-language" value={language} onChange={(event) => setLanguage(event.target.value)} disabled={started}><option value="en">Inglês</option><option value="fr">Francês</option><option value="pt">Português profissional</option><option value="es">Espanhol</option></select></div>}{!started && !result ? <section className="assessment-start"><span className="assessment-icon">✦</span><h2>{title}</h2><p>5 perguntas · aproximadamente 5 minutos · resultado de 0 a 100.</p>{kind === "psychometric" && <small>O resultado é orientativo e não constitui diagnóstico psicológico ou médico.</small>}<button type="button" className="button button-orange" onClick={() => { setStarted(true); setMessage(""); }}>Começar avaliação ↗</button></section> : result ? <section className="assessment-result"><span className="assessment-result-score">{result.score}<small>/100</small></span><p className="eyebrow">Resultado concluído</p><h2>{result.level}</h2><p>{message}</p><button type="button" className="button button-dark" onClick={() => { setStarted(false); setResult(null); setAnswers([]); setIndex(0); }}>Refazer avaliação</button></section> : <section className="assessment-question"><div className="assessment-progress"><span style={{ width: `${progress}%` }} /></div><p className="eyebrow">Pergunta {index + 1} de {questions.length}</p><h2>{current.prompt}</h2><div className="assessment-options">{current.options.map((option, optionIndex) => <button type="button" onClick={() => answer(optionIndex)} key={option}>{option}</button>)}</div></section>}<section className="assessment-history"><p className="eyebrow">Resultados guardados</p>{history.length ? history.map((item, index) => <div key={`${item.assessment_type}-${item.language_code}-${index}`}><strong>{labels[item.assessment_type as Kind] ?? item.assessment_type}{item.language_code ? ` · ${item.language_code.toUpperCase()}` : ""}</strong><span>{item.score}/100 · {item.level ?? "Concluído"}</span></div>) : <p>Ainda não concluiu nenhuma avaliação.</p>}</section></section></main>;
}
