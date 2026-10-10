"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

type Course = { id: string; title: string; slug: string; estimated_minutes: number; lessonCount: number };
type Learner = { id: string; user_id: string; learnerName: string; status: string; xp_points: number; enrolled_at: string; completedLessons: number; lessonCount: number; certificate: { verification_code: string; status: string; issued_at: string } | null };
type Cohort = { id: string; course_id: string; title: string; starts_at: string | null; ends_at: string | null; modality: string; status: string; capacity: number | null; course: Course | null; learners: Learner[] };
type InstructorData = { instructor: { display_title: string }; courses: Course[]; cohorts: Cohort[] };

function dateLabel(value: string | null) { return value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Data a confirmar"; }

export function AcademyInstructorDashboard() {
  const [data, setData] = useState<InstructorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ courseId: "", title: "", startsAt: "", endsAt: "", modality: "Online", capacity: "" });

  const refresh = useCallback(async () => {
    const response = await fetch("/api/academy/instructor", { cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as InstructorData & { error?: string };
    setLoading(false);
    if (!response.ok) { setError(payload.error || "Não foi possível carregar a área de instrutor."); return; }
    setData(payload); setError("");
    if (!form.courseId && payload.courses[0]) setForm((current) => ({ ...current, courseId: payload.courses[0].id }));
  }, [form.courseId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function createCohort(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(""); setError("");
    const response = await fetch("/api/academy/instructor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: form.courseId, title: form.title, startsAt: form.startsAt || null, endsAt: form.endsAt || null, modality: form.modality, capacity: form.capacity }) });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    setBusy(false);
    if (!response.ok) { setError(payload.error || "Não foi possível abrir a turma."); return; }
    setForm((current) => ({ ...current, title: "", startsAt: "", endsAt: "", capacity: "" }));
    setNotice("Turma aberta. Os alunos inscritos aparecerão nesta área.");
    await refresh();
  }

  const learners = data?.cohorts.flatMap((cohort) => cohort.learners) ?? [];
  const completedCount = learners.filter((learner) => learner.status === "completed").length;
  const certificatesCount = learners.filter((learner) => learner.certificate?.status === "issued").length;

  return <main className="academy-page academy-instructor-page"><SiteHeader signedIn accountHref="/academy" /><section className="academy-hero academy-instructor-hero"><div className="academy-hero-inner"><div className="academy-hero-copy"><p className="eyebrow light">OkutiAcademy · Espaço de instrutor</p><h1>Ensine com propósito. <em>Acompanhe cada avanço.</em></h1><p>Organize turmas, acompanhe progresso e consulte microcertificações emitidas para os seus alunos.</p><div className="academy-hero-actions"><a className="academy-button academy-button-gold" href="#academy-instructor-create">Abrir uma turma <span>↓</span></a><Link className="academy-hero-link" href="/academy">Vista do aluno <span>↗</span></Link></div></div><div className="academy-score-card academy-instructor-score"><span className="academy-score-orbit">◈</span><div><small>{data?.instructor.display_title || "Instrutor OkutiAcademy"}</small><strong>{data?.cohorts.length ?? 0} <i>turmas</i></strong><span>{learners.length} inscrições · {completedCount} cursos concluídos</span></div><div className="academy-instructor-stats"><span><b>{certificatesCount}</b> certificados emitidos</span><span><b>{data?.courses.length ?? 0}</b> cursos publicados</span></div></div></div></section>

    <div className="academy-content">
      {error ? <p className="academy-feedback academy-error" role="alert">{error}</p> : null}
      {notice ? <p className="academy-feedback academy-success" role="status">{notice}</p> : null}
      {loading ? <div className="academy-loading"><span />A carregar turmas e progresso…</div> : null}
      <section className="academy-section academy-instructor-create" id="academy-instructor-create"><div className="academy-section-heading"><div><p className="eyebrow">Gestão de turmas</p><h2>Prepare o próximo grupo.</h2></div><p>Use os cursos publicados no catálogo. A turma ficará disponível para inscrição de candidatos.</p></div><form className="academy-cohort-form" onSubmit={createCohort}><label><span>Curso</span><select required value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}><option value="">Seleccione um curso</option>{data?.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label><span>Nome da turma</span><input required minLength={3} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ex.: IVA na prática · Outubro" /></label><label><span>Modalidade</span><select value={form.modality} onChange={(event) => setForm({ ...form, modality: event.target.value })}><option>Online</option><option>Presencial</option><option>Híbrido</option></select></label><label><span>Início</span><input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label><label><span>Fim</span><input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></label><label><span>Vagas (opcional)</span><input type="number" min="1" max="10000" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} placeholder="Sem limite" /></label><button type="submit" className="academy-button academy-button-dark" disabled={busy || !data?.courses.length}>{busy ? "A criar turma…" : "Abrir turma"} <span>↗</span></button></form>{!data?.courses.length && !loading ? <p className="academy-form-hint">Não existem cursos publicados disponíveis para criar uma turma.</p> : null}</section>

      <section className="academy-section" aria-labelledby="academy-cohorts-title"><div className="academy-section-heading"><div><p className="eyebrow">As suas turmas</p><h2 id="academy-cohorts-title">Uma visão clara do progresso.</h2></div><p>O progresso é actualizado quando cada aluno conclui uma micro-aula.</p></div>{data?.cohorts.length ? <div className="academy-cohort-list">{data.cohorts.map((cohort) => <article className="academy-cohort-card" key={cohort.id}><header className="academy-cohort-card-head"><div><span className={`academy-status-pill status-${cohort.status}`}>{cohort.status === "open" ? "Inscrições abertas" : cohort.status === "in_progress" ? "Em curso" : cohort.status === "completed" ? "Concluída" : cohort.status}</span><h3>{cohort.title}</h3><p>{cohort.course?.title || "Curso"} · {cohort.modality} · {dateLabel(cohort.starts_at)}</p></div><div className="academy-cohort-seat-count"><strong>{cohort.learners.length}{cohort.capacity ? `/${cohort.capacity}` : ""}</strong><small>alunos</small></div></header>{cohort.learners.length ? <div className="academy-learner-table-wrap"><table className="academy-learner-table"><thead><tr><th>Aluno</th><th>Progresso</th><th>XP</th><th>Certificado</th></tr></thead><tbody>{cohort.learners.map((learner) => { const percent = learner.lessonCount ? Math.round(learner.completedLessons / learner.lessonCount * 100) : 0; return <tr key={learner.id}><td><strong>{learner.learnerName}</strong><small>Inscrito em {dateLabel(learner.enrolled_at)}</small></td><td><span className="academy-table-progress"><i><b style={{ width: `${percent}%` }} /></i>{learner.completedLessons}/{learner.lessonCount} aulas</span></td><td><b>{learner.xp_points} XP</b></td><td>{learner.certificate?.status === "issued" ? <Link href={`/certificados/${learner.certificate.verification_code}`} target="_blank" className="academy-certificate-link">Validar ↗</Link> : <span className="academy-certificate-pending">Em aprendizagem</span>}</td></tr>; })}</tbody></table></div> : <div className="academy-cohort-empty"><span>◌</span><p>A turma está aberta. As inscrições dos alunos aparecerão aqui.</p></div>}</article>)}</div> : !loading ? <div className="academy-empty-state"><span>◈</span><h3>Ainda não tem turmas abertas.</h3><p>Crie uma turma acima para começar a acompanhar os seus alunos.</p></div> : null}</section>
      <p className="academy-trust-note">A emissão automática do certificado ocorre quando o aluno conclui todas as aulas do curso. Os dados de progresso são apresentados segundo as permissões RLS do Supabase.</p>
    </div>
  </main>;
}
