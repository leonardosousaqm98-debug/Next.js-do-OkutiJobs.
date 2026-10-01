import { describe, expect, it } from "vitest";
import { calculateJobMatch } from "./job-matching";
const baseJob = { country: "Angola", province: "Luanda", seniority_level: "Pleno", hard_skills: ["Excel"], languages: ["Inglês"], salary_min: 100, work_mode: "Presencial" };
const baseCandidate = { country: "Angola", province: "Luanda", seniority_level: "Pleno", hard_skills: ["Excel"], languages: ["Inglês"], salary_max_amount: 200, preferred_work_mode: "Presencial" };
describe("calculateJobMatch", () => {
 it("returns 100% when all applicable groups match", () => expect(calculateJobMatch(baseJob, baseCandidate).score).toBe(100));
 it("returns the strong tier at or above 50%", () => expect(calculateJobMatch(baseJob, { ...baseCandidate, languages: [], preferred_work_mode: "Remoto" })).toMatchObject({ tier: "strong", score: 60 }));
 it("does not match below 50%", () => expect(calculateJobMatch(baseJob, { country: "Portugal", seniority_level: "Júnior", hard_skills: [], languages: [], salary_max_amount: 20, preferred_work_mode: "Remoto" }).tier).toBe("none"));
 it("ignores empty vacancy criteria", () => expect(calculateJobMatch({ country: "Angola" }, { country: "Angola" }).score).toBe(100));
});
