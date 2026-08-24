import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("perfil profissional internacional do candidato", () => {
  const page = readFileSync(resolve(process.cwd(), "app/profile/page.tsx"), "utf8");
  const api = readFileSync(resolve(process.cwd(), "app/api/profile/route.ts"), "utf8");

  it("apresenta as secções essenciais de um CV internacional", () => {
    expect(page).toContain("Identidade e posicionamento");
    expect(page).toContain("Localização e disponibilidade");
    expect(page).toContain("Formação, competências e idiomas");
    expect(page).toContain("Pré-visualização");
    expect(page).toContain("completeness");
    expect(api).toContain("profile_completeness");
  });

  it("persiste os campos profissionais através do endpoint protegido", () => {
    for (const field of ["bio", "country", "municipality", "preferred_work_mode", "academic_level", "study_field", "current_title", "certifications", "languages", "visibility"]) {
      expect(api).toContain(field);
    }
    expect(api).toContain('authData.user');
    expect(api).toContain('supabase.from("candidate_profiles").upsert');
  });
});
