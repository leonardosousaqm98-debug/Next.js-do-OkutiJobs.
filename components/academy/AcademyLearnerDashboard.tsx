"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { SiteHeader } from "@/components/SiteHeader";

type Lesson = { id: string; course_id: string; title: string; content_kind: "video" | "audio" | "text"; media_url: string | null; low_bandwidth_url: string | null; transcript: string | null; text_content: string; duration_seconds: number; asset_bytes: number | null; position: number };
type Cohort = { id: string; title: string; starts_at: string | null; ends_at: string | null; modality: string; status: string; capacity: number | null };
type Enrollment = { id: string; course_id: string; cohort_id: string | null; status: string; xp_points: number; enrolled_at: string; completed_at: string | null };
type Course = { id: string; slug: string; title: string; summary: string; category: string; level: string; competency_key: string | null; estimated_minutes: number; cover_url: string | null; lessons: Lesson[]; enrollment: Enrollment | null; openCohorts: Cohort[] };
type Certificate = { id: string; course_id: string; course_title: string; verification_code: string; integrity_hash: string; issued_at: string; status: string; anchor_network: string | null; anchor_tx_hash: string | null; anchored_at: string | null };
type Data = { learner: { name: string; email: string; totalXp: number }; courses: Course[]; enrollments: Enrollment[]; progress: { lesson_id: string; status: string; progress_percent: number; seconds_spent: number }[]; recommendations: { id: string; course_id: string; reason: string; skillName: string; course: Course | null }[]; certificates: Certificate[]; badges: { awarded_at: string; badge: { slug: string; name: string; description: string; icon: string; xp_threshold: number } | null }[]; leaderboard: { rank: number; learner_name: string; xp_points: number }[]; preferences: { public_display_name: string; leaderboard_opt_in: boolean } };

function durationLabel(seconds: number) { return `${Math.round(seconds / 60)} min`; }
function dateLabel(value: string | null) { return value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(value)) : "Data a confirmar"; }

function CertificateCard({ certificate }: { certificate: Certificate }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    const url = `${window.location.origin}/certificados/${certificate.verification_code}`;
    QRCode.toDataURL(url, { width: 156, margin: 1, errorCorrectionLevel: "M", color: { dark: "#003f52", light: "#ffffff" } }).then(setQr).catch(() => setQr(""));
  }, [certificate.verification_code]);
  return <article className="academy-certificate-card">
    <div className="academy-certificate-copy"><span className="academy-certificate-seal" aria-hidden="true">✓</span><p className="academy-certificate-kicker">Certificado verificável</p><h3>{certificate.course_title}</h3><p>Emitido a {dateLabel(certificate.issued_at)} · Ref. OKA-{certificate.verification_code.slice(0, 12).toUpperCase()}</p><code title={certificate.integrity_hash}>{certificate.integrity_hash}</code><div className="academy-certificate-actions"><Link className="academy-button academy-button-light" href={`/certificados/${certificate.verification_code}`} target="_blank">Verificação pública <span>↗</span></Link><button type="button" className="academy-text-button" onClick={() => navigator.clipboard?.writeText(certificate.integrity_hash)}>Copiar hash</button></div>{certificate.anchored_at && certificate.anchor_network ? <small className="academy-chain-note">Âncora: {certificate.anchor_network}{certificate.anchor_tx_hash ? ` · ${certificate.anchor_tx_hash}` : ""}</small> : <small className="academy-chain-note">Hash SHA-256 verificável. Âncora blockchain não configurada.</small>}</div>
    <div className="academy-qr-wrap">{qr ? <a href={qr} download={`certificado-${certificate.verification_code}.png`} title="Descarregar QR Code"><img src={qr} alt={`QR Code de verificação do certificado ${certificate.course_title}`} width="126" height="126" /></a> : <span className="academy-qr-placeholder">A gerar QR…</span>}<small>Digitalize para validar</small></div>
  </article>;
}

export function AcademyLearnerDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [lessonUnlockAt, setLessonUnlockAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [lowBandwidth, setLowBandwidth] = useState(true);
  const [publicName, setPublicName] = useState("");
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/academy", { cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as Data & { error?: string };
    if (!response.ok) { setError(payload.error || "Não foi possível abrir a OkutiAcademy."); setLoading(false); return; }
    setData(payload);
    setPublicName(payload.preferences?.public_display_name || "");
    setLeaderboardOptIn(payload.preferences?.leaderboard_opt_in || false);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  const activeCourse = useMemo(() => data?.courses.find((course) => course.id === selectedCourseId) ?? null, [data, selectedCourseId]);
  const activeLesson = useMemo(() => activeCourse?.lessons.find((lesson) => lesson.id === selectedLessonId) ?? activeCourse?.lessons[0] ?? null, [activeCourse, selectedLessonId]);
  const completedLessons = data?.progress.filter((item) => item.status === "completed").length ?? 0;
  const completedCourses = data?.enrollments.filter((item) => item.status === "completed").length ?? 0;
  const progressFor = (lessonId: string) => data?.progress.find((item) => item.lesson_id === lessonId)?.status === "completed";

  useEffect(() => {
    const lessonId = activeLesson?.id;
    const enrollmentId = activeCourse?.enrollment?.id;
    const alreadyComplete = lessonId ? data?.progress.some((item) => item.lesson_id === lessonId && item.status === "completed") : false;
    setLessonUnlockAt(null);
    if (!lessonId || !enrollmentId || alreadyComplete) return;
    let cancelled = false;
    void fetch("/api/academy/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", lessonId }) })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { started_at?: string; min_seconds?: number; error?: string };
        if (cancelled) return;
        if (!response.ok || !payload.started_at) { setError(payload.error || "Não foi possível iniciar o registo da aula."); return; }
        setLessonUnlockAt(new Date(payload.started_at).getTime() + (payload.min_seconds ?? 0) * 1000);
      }).catch(() => { if (!cancelled) setError("Não foi possível iniciar o registo da aula."); });
    return () => { cancelled = true; };
  }, [activeCourse?.enrollment?.id, activeLesson?.id, data?.progress]);

  useEffect(() => {
    if (!lessonUnlockAt) { setSecondsRemaining(0); return; }
    const update = () => setSecondsRemaining(Math.max(0, Math.ceil((lessonUnlockAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [lessonUnlockAt]);

  async function enroll(courseId: string, cohortId?: string) {
    setBusy(`enroll-${courseId}`); setNotice(""); setError("");
    const response = await fetch("/api/academy/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, cohortId }) });
    const payload = await response.json().catch(() => ({})) as { error?: string; alreadyEnrolled?: boolean };
    setBusy("");
    if (!response.ok) { setError(payload.error || "Não foi possível concluir a inscrição."); return; }
    setSelectedCourseId(courseId); setSelectedLessonId(""); setNotice(payload.alreadyEnrolled ? "Já está inscrito. Vamos retomar o seu percurso." : "Inscrição concluída. A sua primeira micro-aula está pronta.");
    await refresh();
  }

  async function completeLesson(lesson: Lesson) {
    if (!activeCourse?.enrollment) return;
    if (secondsRemaining > 0) { setError(`Ainda faltam ${secondsRemaining} segundos mínimos de aprendizagem nesta aula.`); return; }
    setBusy(`lesson-${lesson.id}`); setNotice(""); setError("");
    const response = await fetch("/api/academy/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", lessonId: lesson.id, secondsSpent: lesson.duration_seconds }) });
    const payload = await response.json().catch(() => ({})) as { error?: string; xp_awarded?: number; course_completed?: boolean; new_badges?: { name: string }[]; certificate?: unknown };
    setBusy("");
    if (!response.ok) { setError(payload.error || "Não foi possível guardar o progresso."); return; }
    const reward = payload.xp_awarded ? ` +${payload.xp_awarded} XP.` : "";
    const certificate = payload.certificate ? " Certificado verificável emitido." : "";
    const badges = payload.new_badges?.length ? ` Novo badge: ${payload.new_badges.map((badge) => badge.name).join(", ")}.` : "";
    setNotice(`Aula concluída.${reward}${badges}${certificate}`);
    await refresh();
  }

  async function savePreferences() {
    setBusy("preferences"); setError(""); setNotice("");
    const response = await fetch("/api/academy/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leaderboardOptIn, publicDisplayName: publicName }) });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    setBusy("");
    if (!response.ok) { setError(payload.error || "Não foi possível guardar a preferência."); return; }
    setNotice(leaderboardOptIn ? "Participação no ranking activada com o nome escolhido." : "A sua participação no ranking foi desactivada.");
    await refresh();
  }

  return <main className="academy-page">
    <SiteHeader signedIn accountHref="/candidato" />
    <section className="academy-hero"><div className="academy-hero-inner"><div className="academy-hero-copy"><p className="eyebrow light">Formação contínua · OkutiAcademy</p><h1>Aprenda em pequenos passos. <em>Avance todos os dias.</em></h1><p>Aulas de 3 a 5 minutos, desenhadas para caber no seu ritmo e consumir menos dados móveis.</p><div className="academy-hero-actions"><a className="academy-button academy-button-gold" href="#academy-catalog">Explorar micro-cursos <span>↓</span></a><Link className="academy-hero-link" href="/candidato">Voltar ao painel <span>↗</span></Link></div></div><div className="academy-score-card"><span className="academy-score-orbit">✦</span><div><small>O seu percurso</small><strong>{data?.learner.totalXp ?? 0} <i>XP</i></strong><span>{completedCourses} cursos concluídos · {completedLessons} aulas feitas</span></div><div className="academy-score-track"><span style={{ width: `${Math.min(100, (data?.learner.totalXp ?? 0) % 300 / 3)}%` }} /></div><small>Continue a aprender para desbloquear badges.</small></div></div></section>

    <div className="academy-content">
      {error ? <p className="academy-feedback academy-error" role="alert">{error}</p> : null}
      {notice ? <p className="academy-feedback academy-success" role="status">{notice}</p> : null}
      {activeCourse && activeLesson && secondsRemaining > 0 ? <p className="academy-time-note" role="status">A aula está activa. Mantenha-a aberta durante pelo menos mais {secondsRemaining} s para registar uma conclusão válida.</p> : null}
      {loading ? <div className="academy-loading"><span />A preparar a sua área de aprendizagem…</div> : null}

      {data?.recommendations.length ? <section className="academy-section" aria-labelledby="academy-recommend-title"><div className="academy-section-heading"><div><p className="eyebrow">Percurso recomendado</p><h2 id="academy-recommend-title">Reforce uma competência em falta.</h2></div><p>Estas sugestões aparecem automaticamente quando uma validação de competências precisa de mais prática.</p></div><div className="academy-recommendations">{data.recommendations.map((recommendation) => <article className="academy-recommend-card" key={recommendation.id}><span className="academy-recommend-icon">↗</span><div><small>Recomendado para: {recommendation.skillName}</small><h3>{recommendation.course?.title || "Formação recomendada"}</h3><p>{recommendation.reason}</p></div>{recommendation.course ? <button type="button" className="academy-button academy-button-dark" disabled={busy === `enroll-${recommendation.course.id}`} onClick={() => void enroll(recommendation.course!.id)}>{busy === `enroll-${recommendation.course.id}` ? "A abrir…" : "Começar agora"} <span>↗</span></button> : null}</article>)}</div></section> : null}

      {activeCourse ? <section className="academy-learning-room" aria-labelledby="academy-room-title"><div className="academy-learning-room-head"><div><p className="eyebrow">A sua sala de aprendizagem</p><h2 id="academy-room-title">{activeCourse.title}</h2><p>{activeCourse.summary}</p></div><button type="button" className="academy-close-room" onClick={() => { setSelectedCourseId(""); setSelectedLessonId(""); }}>Fechar sala <span>×</span></button></div><div className="academy-room-grid"><nav className="academy-lesson-list" aria-label="Aulas do curso"><strong>Conteúdo do curso</strong>{activeCourse.lessons.map((lesson, index) => <button type="button" className={`academy-lesson-nav ${activeLesson?.id === lesson.id ? "is-current" : ""}`} key={lesson.id} onClick={() => setSelectedLessonId(lesson.id)}><span className="academy-lesson-number">{progressFor(lesson.id) ? "✓" : String(index + 1).padStart(2, "0")}</span><span><strong>{lesson.title}</strong><small>{lesson.content_kind === "text" ? "Texto" : lesson.content_kind === "audio" ? "Áudio" : "Vídeo"} · {durationLabel(lesson.duration_seconds)}</small></span></button>)}{activeCourse.lessons.length === 0 ? <p>As aulas deste curso ainda estão a ser preparadas.</p> : null}</nav><article className="academy-lesson-player">{activeLesson ? <><div className="academy-lesson-meta"><span>{activeLesson.content_kind === "text" ? "Leitura leve" : activeLesson.content_kind === "audio" ? "Áudio optimizado" : "Vídeo curto"}</span><span>{durationLabel(activeLesson.duration_seconds)}</span><button type="button" onClick={() => setLowBandwidth((value) => !value)} aria-pressed={lowBandwidth}>{lowBandwidth ? "Modo poupança de dados: activo" : "Modo poupança de dados: desligado"}</button></div><h3>{activeLesson.title}</h3>{activeLesson.content_kind === "video" && (activeLesson.low_bandwidth_url || activeLesson.media_url) ? <video className="academy-media" controls preload="none" poster={activeCourse.cover_url || undefined} src={lowBandwidth ? activeLesson.low_bandwidth_url || activeLesson.media_url || undefined : activeLesson.media_url || undefined}><track kind="captions" srcLang="pt" label="Português" src={activeLesson.transcript?.toLowerCase().endsWith(".vtt") ? activeLesson.transcript : undefined} /></video> : null}{activeLesson.content_kind === "audio" && (activeLesson.low_bandwidth_url || activeLesson.media_url) ? <audio className="academy-audio" controls preload="none" src={lowBandwidth ? activeLesson.low_bandwidth_url || activeLesson.media_url || undefined : activeLesson.media_url || undefined} /> : null}{activeLesson.content_kind === "text" ? <div className="academy-lesson-text">{activeLesson.text_content || activeLesson.transcript || "O conteúdo desta micro-aula será disponibilizado em breve."}</div> : activeLesson.transcript ? <details className="academy-transcript"><summary>Ler transcrição em texto</summary><p>{activeLesson.transcript}</p></details> : null}{activeLesson.media_url ? <small className="academy-data-note">{activeLesson.asset_bytes ? `Ficheiro ${Math.ceil(activeLesson.asset_bytes / 1024)} KB · ` : ""}O conteúdo só é carregado quando iniciar a reprodução.</small> : null}<div className="academy-lesson-footer"><span>{progressFor(activeLesson.id) ? "Aula concluída" : "Marque a aula como concluída quando terminar."}</span><button type="button" className="academy-button academy-button-gold" disabled={progressFor(activeLesson.id) || Boolean(busy)} onClick={() => void completeLesson(activeLesson)}>{busy === `lesson-${activeLesson.id}` ? "A guardar…" : progressFor(activeLesson.id) ? "Concluída ✓" : "Concluir aula · +25 XP"}</button></div></> : <p>Seleccione uma aula para começar.</p>}</article></div></section> : null}

      <section className="academy-section" id="academy-catalog" aria-labelledby="academy-catalog-title"><div className="academy-section-heading"><div><p className="eyebrow">Catálogo de micro-learning</p><h2 id="academy-catalog-title">Competências que se constroem em minutos.</h2></div><p>Escolha um curso, aprenda ao seu ritmo e acompanhe o progresso numa só área.</p></div>{loading ? null : data?.courses.length ? <div className="academy-course-grid">{data.courses.map((course, index) => { const done = course.lessons.filter((lesson) => progressFor(lesson.id)).length; const total = course.lessons.length; const percent = total ? Math.round(done / total * 100) : 0; return <article className={`academy-course-card academy-course-tone-${index % 4}`} key={course.id}><div className="academy-course-card-top"><span className="academy-course-symbol">{course.category.toLowerCase().includes("contabilidade") ? "▤" : course.category.toLowerCase().includes("software") ? "⌘" : "✦"}</span><span className="academy-course-level">{course.level}</span></div><p className="academy-course-category">{course.category}{course.competency_key ? ` · ${course.competency_key}` : ""}</p><h3>{course.title}</h3><p className="academy-course-summary">{course.summary}</p><div className="academy-course-meta"><span>{course.lessons.length} micro-aulas</span><span>{course.estimated_minutes} min estimados</span></div>{course.enrollment ? <div className="academy-progress-line"><span style={{ width: `${percent}%` }} /><small>{percent}% concluído</small></div> : null}<div className="academy-course-actions">{course.enrollment ? <button type="button" className="academy-button academy-button-dark" onClick={() => { setSelectedCourseId(course.id); setSelectedLessonId(""); document.getElementById("academy-room-title")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>{course.enrollment.status === "completed" ? "Rever curso" : "Retomar curso"} <span>↗</span></button> : <button type="button" className="academy-button academy-button-dark" disabled={busy === `enroll-${course.id}`} onClick={() => void enroll(course.id)}>{busy === `enroll-${course.id}` ? "A inscrever…" : "Começar curso"} <span>↗</span></button>}</div>{course.openCohorts.length ? <details className="academy-cohort-options"><summary>Ver turmas com instrutor ({course.openCohorts.length})</summary>{course.openCohorts.map((cohort) => <div key={cohort.id}><span><strong>{cohort.title}</strong><small>{cohort.modality} · {dateLabel(cohort.starts_at)}</small></span><button type="button" onClick={() => void enroll(course.id, cohort.id)} disabled={busy === `enroll-${course.id}`}>Inscrever</button></div>)}</details> : null}</article>; })}</div> : <div className="academy-empty-state"><span>✦</span><h3>O catálogo está a crescer.</h3><p>Os primeiros percursos aparecerão aqui assim que forem publicados pela equipa OkutiAcademy.</p></div>}</section>

      <section className="academy-section academy-achievements-section"><div className="academy-section-heading"><div><p className="eyebrow">Conquistas</p><h2>O seu esforço deixa marcas.</h2></div><p>Os pontos aumentam com cada aula concluída. Os badges reconhecem a consistência.</p></div><div className="academy-achievement-grid"><div className="academy-badge-panel"><div className="academy-panel-heading"><h3>Os meus badges</h3><span>{data?.badges.length ?? 0} desbloqueados</span></div>{data?.badges.length ? <div className="academy-badges">{data.badges.map((award) => award.badge ? <article className="academy-badge" key={award.badge.slug}><span>{award.badge.icon}</span><strong>{award.badge.name}</strong><small>{award.badge.description}</small></article> : null)}</div> : <div className="academy-badge-empty"><span>◇</span><p>Conclua uma micro-aula para desbloquear o primeiro badge.</p></div>}</div><div className="academy-leaderboard-panel"><div className="academy-panel-heading"><h3>Ranking da comunidade</h3><span>Opt-in · nome público escolhido por si</span></div>{data?.leaderboard.length ? <ol className="academy-leaderboard">{data.leaderboard.map((entry) => <li key={`${entry.rank}-${entry.learner_name}`}><span className="academy-rank-number">{String(entry.rank).padStart(2, "0")}</span><strong>{entry.learner_name}</strong><b>{entry.xp_points} XP</b></li>)}</ol> : <div className="academy-badge-empty"><span>↗</span><p>O ranking só mostra participantes que aderiram voluntariamente.</p></div>}<div className="academy-ranking-settings"><label className="academy-toggle-row"><span><strong>Participar no ranking</strong><small>O seu nome público e XP serão visíveis na tabela.</small></span><input type="checkbox" checked={leaderboardOptIn} onChange={(event) => setLeaderboardOptIn(event.target.checked)} /></label>{leaderboardOptIn ? <div className="academy-ranking-name"><label htmlFor="academy-public-name">Nome a apresentar</label><input id="academy-public-name" value={publicName} maxLength={32} onChange={(event) => setPublicName(event.target.value)} placeholder="Ex.: Leo M." /></div> : null}<button type="button" className="academy-button academy-button-dark" disabled={busy === "preferences"} onClick={() => void savePreferences()}>{busy === "preferences" ? "A guardar…" : "Guardar preferência"}</button></div></div></div></section>

      <section className="academy-section" aria-labelledby="academy-certificates-title"><div className="academy-section-heading"><div><p className="eyebrow">Microcertificações</p><h2 id="academy-certificates-title">Certificados com verificação pública.</h2></div><p>Cada certificado emitido inclui uma referência única, QR Code e hash de integridade.</p></div>{data?.certificates.length ? <div className="academy-certificates">{data.certificates.map((certificate) => <CertificateCard key={certificate.id} certificate={certificate} />)}</div> : <div className="academy-empty-state academy-certificate-empty"><span>⌑</span><h3>O primeiro certificado está à sua espera.</h3><p>Conclua todas as micro-aulas de um curso para receber um certificado verificável.</p></div>}<p className="academy-trust-note">A verificação confirma a emissão e a integridade dos dados registados pela OkutiAcademy. Reconhecimento formal por terceiros e ancoragem em blockchain dependem de acordos e serviços externos próprios.</p></section>
    </div>
  </main>;
}
