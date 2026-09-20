import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { FlatIllustration } from "@/components/FlatIllustration";
import { TrainingEnrollmentForm } from "@/components/TrainingEnrollmentForm";
import { getTrainingCourse, trainingCourses } from "@/lib/training";

export function generateStaticParams() { return trainingCourses.map((course) => ({ slug: course.slug })); }

export default async function TrainingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getTrainingCourse(slug);
  if (!course) notFound();
  return <main><SiteHeader /><section className="training-detail-hero"><div><Link className="back-link" href="/formacoes">← Voltar ao catálogo</Link><p className="eyebrow">{course.area} · {course.level}</p><h1>{course.title}</h1><p className="training-detail-lede">{course.description}</p><a className="button button-orange" href="#inscricao">Inscrever-me <span>↗</span></a></div><div className="training-detail-art"><FlatIllustration src="/manus-storage/okutijobs-flat-service-mentoring_b03826c8.png" alt={`Ilustração da formação ${course.title}`} /></div></section><section className="training-detail-section"><div className="training-detail-main"><div className="training-info-grid"><div><small>Investimento</small><strong>{course.price}</strong></div><div><small>Duração</small><strong>{course.duration}</strong></div><div><small>Modalidade</small><strong>{course.mode}</strong></div><div><small>Data estimada</small><strong>{course.estimatedDate}</strong></div></div><article className="training-detail-copy"><p className="eyebrow">Sobre esta formação</p><h2>Aprendizagem prática para resultados reais.</h2><p>{course.description}</p><p><strong>Calendário:</strong> {course.schedule}. A data definitiva será confirmada pela equipa OkutiJobs depois de recebermos o seu pedido e o número de participantes.</p><h3>O que vai desenvolver</h3><ul>{course.outcomes.map((outcome) => <li key={outcome}><span>✓</span>{outcome}</li>)}</ul></article></div><aside className="training-detail-aside"><p className="eyebrow">Próximo passo</p><h2>Reserve a sua vaga.</h2><p>As inscrições podem ser individuais ou para equipas. Envie os seus dados e entraremos em contacto para confirmar a turma, horário e pagamento.</p><a className="button button-dark" href="#inscricao">Abrir formulário <span>↓</span></a><div className="training-contact-mini"><strong>Dúvidas?</strong><a href="tel:+244936161636">936 161 636</a><a href="mailto:comercial@okutijobs.com">comercial@okutijobs.com</a></div></aside></section><TrainingEnrollmentForm course={course} /></main>;
}
