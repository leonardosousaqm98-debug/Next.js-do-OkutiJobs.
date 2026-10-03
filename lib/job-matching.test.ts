import { describe, expect, it } from "vitest";
import { calculateJobMatch } from "./job-matching";
const baseJob = { country: "Angola", province: "Luanda", seniority_level: "Pleno", hard_skills: ["Excel"], languages: ["Inglês"], salary_min: 100, work_mode: "Presencial" };
const baseCandidate = { country: "Angola", province: "Luanda", seniority_level: "Pleno", hard_skills: ["Excel"], languages: ["Inglês"], salary_max_amount: 200, preferred_work_mode: "Presencial" };
describe("calculateJobMatch", () => {
  it("returns 100% when all applicable groups match", () => expect(calculateJobMatch(baseJob, baseCandidate).score).toBe(100));
  it("returns the strong tier when one applicable group is missing", () => expect(calculateJobMatch(baseJob, { ...baseCandidate, languages: [], preferred_work_mode: "Remoto" })).toMatchObject({ tier: "strong", score: 67 }));
  it("does not match below 50%", () => expect(calculateJobMatch(baseJob, { country: "Portugal", seniority_level: "Júnior", hard_skills: [], languages: [], salary_max_amount: 20, preferred_work_mode: "Remoto" }).tier).toBe("none"));
  it("ignores empty vacancy criteria", () => expect(calculateJobMatch({ country: "Angola" }, { country: "Angola" }).score).toBe(100));
  it("requires relocation when a candidate is outside the requested city", () => {
    const result = calculateJobMatch({ ...baseJob, city: "Luanda" }, { ...baseCandidate, city: "Benguela", willing_to_relocate: false });
    expect(result.missing).toContain("Localização");
  });
  it("accepts a more senior candidate for a junior vacancy", () => {
    const result = calculateJobMatch({ ...baseJob, seniority_level: "Júnior" }, { ...baseCandidate, seniority_level: "Sénior" });
    expect(result.matched).toContain("Experiência e senioridade");
  });
  it("requires immediate availability when the vacancy explicitly requests it", () => {
    const result = calculateJobMatch({ ...baseJob, availability: "Disponibilidade imediata" }, { ...baseCandidate, availability: "Em 30 dias" });
    expect(result.missing).toContain("Remuneração, modalidade e disponibilidade");
  });
  it("checks nationality and driving requirements when provided", () => {
    const result = calculateJobMatch({ ...baseJob, nationalities: ["Angola"], driving_categories: ["Categoria B"] }, { ...baseCandidate, nationality: "Angola", driving_categories: ["Categoria B"] });
    expect(result.matched).toContain("Elegibilidade e requisitos específicos");
  });
});
