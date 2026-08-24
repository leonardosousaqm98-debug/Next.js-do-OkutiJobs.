import { describe, expect, it } from "vitest";
import { calculateMatch } from "./candidate-match";

describe("candidate match score", () => {
  it("gives a strong explainable score to a compatible candidate", () => {
    const result = calculateMatch({ desired_job_title: "Técnico de Contabilidade", current_title: "Contabilista", province: "Luanda", seniority_level: "Júnior", study_field: "Contabilidade", skills: ["Excel", "ERP Primavera"] , salary_currency: "AOA", salary_min_amount: 350000, salary_max_amount: 450000 }, { title: "Técnico de Contabilidade", province: "Luanda", seniority: "Júnior", studyField: "Contabilidade", skills: ["Excel", "Primavera"], currency: "AOA", minSalary: 400000, maxSalary: 500000 });
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.reasons).toContain("Cargo compatível");
    expect(result.reasons).toContain("Pretensão dentro do orçamento");
  });

  it("does not hide missing criteria and flags a salary mismatch", () => {
    const result = calculateMatch({ desired_job_title: "Assistente", province: "Benguela", seniority_level: "Júnior", skills: ["Word"], salary_currency: "USD", salary_min_amount: 1000, salary_max_amount: 1200 }, { title: "Engenheiro", province: "Luanda", seniority: "Sénior", skills: ["Excel"], currency: "AOA", minSalary: 300000, maxSalary: 500000 });
    expect(result.score).toBeLessThan(30);
    expect(result.gaps).toContain("Pretensão salarial fora do orçamento ou moeda diferente");
    expect(result.gaps.length).toBeGreaterThan(2);
  });
});
