import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("perfil profissional internacional do candidato", () => {
  const page = readFileSync(resolve(process.cwd(), "app/profile/page.tsx"), "utf8");
  const api = readFileSync(resolve(process.cwd(), "app/api/profile/route.ts"), "utf8");

  it("apresenta as secções essenciais de um CV internacional", () => {
    expect(page).toContain("Identidade e posicionamento");
    expect(page).toContain("Preferências e remuneração");
    expect(page).toContain("Skills e histórico");
    expect(page).toContain("AOA — Kwanza");
    expect(page).toContain("USD — Dólar");
    expect(page).toContain("Cargo pretendido");
    expect(page).toContain("Nível de senioridade");
    expect(page).toContain("Preferências e remuneração");
    expect(page).toContain("Formação, competências e idiomas");
    expect(page).toContain("Experiência profissional");
    expect(page).toContain("Competências");
    expect(page).toContain("Pré-visualização");
    expect(page).toContain("completeness");
    expect(api).toContain("profile_completeness");
  });

  it("persiste os campos profissionais através do endpoint protegido", () => {
    for (const field of ["bio", "country", "municipality", "preferred_work_mode", "academic_level", "study_field", "current_title", "desired_job_title", "seniority_level", "functional_areas", "salary_currency", "salary_min_amount", "salary_max_amount", "salary_period", "certifications", "languages", "visibility"]) {
      expect(api).toContain(field);
    }
    expect(api).toContain('authData.user');
    expect(api).toContain('supabase.from("candidate_profiles").upsert');
    expect(api).toContain("A pretensão máxima deve ser igual ou superior à mínima.");
  });
});
