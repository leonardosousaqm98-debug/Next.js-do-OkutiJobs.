import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../../supabase/migrations/0014_okutiacademy.sql", import.meta.url), "utf8");
const learner = readFileSync(new URL("../../components/academy/AcademyLearnerDashboard.tsx", import.meta.url), "utf8");
const instructor = readFileSync(new URL("../../components/academy/AcademyInstructorDashboard.tsx", import.meta.url), "utf8");
const instructorApi = readFileSync(new URL("../../app/api/academy/instructor/route.ts", import.meta.url), "utf8");
const certificatePage = readFileSync(new URL("../../app/certificados/[code]/page.tsx", import.meta.url), "utf8");
const progressApi = readFileSync(new URL("../../app/api/academy/progress/route.ts", import.meta.url), "utf8");

describe("OkutiAcademy", () => {
  it("defines classes, 3–5 minute low-bandwidth lessons, learner progress and certificates", () => {
    for (const table of ["academy_cohorts", "academy_enrollments", "academy_lesson_progress", "academy_certificates"]) {
      expect(migration).toContain(`create table public.${table}`);
    }
    expect(migration).toContain("duration_seconds integer not null check (duration_seconds between 180 and 300)");
    expect(migration).toContain("low_bandwidth_url text");
    expect(migration).toContain("integrity_hash text not null");
  });

  it("recommends mapped courses after failed skill tests", () => {
    expect(migration).toContain("after insert on public.test_attempts");
    expect(migration).toContain("if new.passed = false then");
    expect(migration).toContain("('IVA','iva-na-pratica',10)");
    expect(migration).toContain("('Primavera','primavera-erp-fundamentos',10)");
    expect(learner).toContain("Percurso recomendado");
  });

  it("protects progress and issues rewards through server-side RPCs with a minimum lesson interval", () => {
    expect(migration).toContain("create or replace function public.start_academy_lesson");
    expect(migration).toContain("create or replace function public.complete_academy_lesson");
    expect(migration).toContain("extract(epoch from (now() - v_started_at)) < v_min_seconds");
    expect(migration).not.toContain('create policy "learners manage own progress"');
    expect(migration).not.toContain("create policy \"learners insert own certificates\"");
    expect(progressApi).toContain('action === "start"');
    expect(progressApi).toContain('complete_academy_lesson');
  });

  it("creates QR-linked public validation with a SHA-256 integrity comparison", () => {
    expect(migration).toContain("public.academy_certificate_hash");
    expect(migration).toContain("public.verify_academy_certificate");
    expect(migration).toContain("integrity_valid boolean");
    expect(learner).toContain("QRCode.toDataURL");
    expect(certificatePage).toContain('supabase.rpc("verify_academy_certificate"');
    expect(certificatePage).toContain("integrity_valid");
  });

  it("provides learner and instructor dashboards", () => {
    expect(learner).toContain("Concluir aula · +25 XP");
    expect(learner).toContain("Participar no ranking");
    expect(instructor).toContain("Abrir uma turma");
    expect(instructor).toContain("Uma visão clara do progresso.");
    expect(instructor).toContain("Validar ↗");
  });

  it("does not grant instructors row-wide access to profiles and returns only learner ID and name", () => {
    expect(migration).not.toContain('create policy "academy instructors read enrolled learner names" on public.profiles');
    expect(migration).toContain("create or replace function public.academy_instructor_learners(p_cohort_ids uuid[])");
    expect(migration).toContain("returns table (learner_id uuid, learner_name text)");
    expect(migration).toContain("c.instructor_id = auth.uid()");
    expect(migration).toContain("cardinality(p_cohort_ids) between 1 and 1000");
    expect(migration).toContain("grant execute on function public.academy_instructor_learners(uuid[]) to authenticated");
    expect(instructorApi).toContain('supabase.rpc("academy_instructor_learners"');
    expect(instructorApi).not.toContain('supabase.from("profiles")');
  });
});
