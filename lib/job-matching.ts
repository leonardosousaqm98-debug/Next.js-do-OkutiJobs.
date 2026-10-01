export type JobMatchInput = {
  title?: string | null; province?: string | null; city?: string | null; country?: string | null; seniority_level?: string | null; functional_area?: string | null;
  hard_skills?: unknown; required_certifications?: unknown; languages?: unknown; driving_categories?: unknown; nationalities?: unknown;
  salary_min?: number | null; salary_max?: number | null; work_mode?: string | null;
};
export type CandidateMatchInput = {
  country?: string | null; province?: string | null; city?: string | null; seniority_level?: string | null; functional_areas?: unknown; skills?: unknown; hard_skills?: unknown; certifications?: unknown; certifications_structured?: unknown; languages?: unknown; language_items?: unknown; driving_categories?: unknown; nationality?: string | null; salary_min_amount?: number | null; salary_max_amount?: number | null; preferred_work_mode?: string | null;
};
export type MatchResult = { score: number; tier: "perfect" | "strong" | "none"; matched: string[]; missing: string[]; weights: Record<string, number> };
const normalize = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
const list = (value: unknown): string[] => Array.isArray(value) ? value.flatMap((item) => typeof item === "string" ? [item] : item && typeof item === "object" ? Object.values(item as Record<string, unknown>).filter((v): v is string => typeof v === "string") : []).map(normalize).filter(Boolean) : typeof value === "string" ? value.split(/[,;\n]/).map(normalize).filter(Boolean) : [];
const overlaps = (required: string[], available: string[]) => required.length > 0 && required.some((item) => available.some((candidate) => candidate.includes(item) || item.includes(candidate)));
export function calculateJobMatch(job: JobMatchInput, candidate: CandidateMatchInput): MatchResult {
  const weights: Record<string, number> = { location: 20, experience: 20, skills: 20, language_certification: 20, salary_availability: 20 };
  const matched: string[] = []; const missing: string[] = []; let applicable = 0; let points = 0;
  const check = (key: string, label: string, applies: boolean, ok: boolean) => { if (!applies) return; applicable += weights[key]; if (ok) { points += weights[key]; matched.push(label); } else missing.push(label); };
  const jobLocation = [job.country, job.province, job.city].map(normalize).filter(Boolean); const candidateLocation = [candidate.country, candidate.province, candidate.city].map(normalize).filter(Boolean);
  check("location", "Localização", jobLocation.length > 0, jobLocation.some((place) => candidateLocation.some((value) => value === place || value.includes(place) || place.includes(value))));
  check("experience", "Experiência e senioridade", Boolean(job.seniority_level), normalize(job.seniority_level) === normalize(candidate.seniority_level) || normalize(candidate.seniority_level).includes(normalize(job.seniority_level)));
  const requiredSkills = [...list(job.hard_skills), ...list(job.functional_area)]; const candidateSkills = [...list(candidate.skills), ...list(candidate.hard_skills), ...list(candidate.functional_areas)];
  check("skills", "Competências técnicas", requiredSkills.length > 0, overlaps(requiredSkills, candidateSkills));
  const requiredLanguageCert = [...list(job.languages), ...list(job.required_certifications)]; const candidateLanguageCert = [...list(candidate.languages), ...list(candidate.language_items), ...list(candidate.certifications), ...list(candidate.certifications_structured)];
  check("language_certification", "Idiomas e certificações", requiredLanguageCert.length > 0, overlaps(requiredLanguageCert, candidateLanguageCert));
  const salaryApplies = job.salary_min != null || job.salary_max != null || Boolean(job.work_mode); const salaryOk = (job.work_mode ? normalize(job.work_mode) === normalize(candidate.preferred_work_mode) : true) && (!job.salary_min || !candidate.salary_max_amount || candidate.salary_max_amount >= job.salary_min) && (!job.salary_max || !candidate.salary_min_amount || candidate.salary_min_amount <= job.salary_max);
  check("salary_availability", "Remuneração e modalidade", salaryApplies, salaryOk);
  const score = applicable ? Math.round((points / applicable) * 100) : 0;
  return { score, tier: score >= 100 ? "perfect" : score >= 50 ? "strong" : "none", matched, missing, weights };
}
