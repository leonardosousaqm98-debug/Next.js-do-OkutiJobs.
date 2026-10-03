export type JobMatchInput = {
  title?: string | null; province?: string | null; city?: string | null; country?: string | null; seniority_level?: string | null; functional_area?: string | null;
  hard_skills?: unknown; required_certifications?: unknown; languages?: unknown; driving_categories?: unknown; nationalities?: unknown;
  salary_min?: number | null; salary_max?: number | null; work_mode?: string | null; contract_type?: string | null; availability?: string | null;
};
export type CandidateMatchInput = {
  country?: string | null; province?: string | null; city?: string | null; municipality?: string | null; seniority_level?: string | null; functional_areas?: unknown; skills?: unknown; hard_skills?: unknown; certifications?: unknown; certifications_structured?: unknown; languages?: unknown; language_items?: unknown; driving_categories?: unknown; nationality?: string | null; salary_min_amount?: number | null; salary_max_amount?: number | null; preferred_work_mode?: string | null; contract_type?: string | null; availability?: string | null; willing_to_relocate?: boolean | null;
};
export type MatchResult = { score: number; tier: "perfect" | "strong" | "none"; matched: string[]; missing: string[]; weights: Record<string, number> };
const normalize = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
const list = (value: unknown): string[] => Array.isArray(value) ? value.flatMap((item) => typeof item === "string" ? [item] : item && typeof item === "object" ? Object.values(item as Record<string, unknown>).filter((v): v is string => typeof v === "string") : []).map(normalize).filter(Boolean) : typeof value === "string" ? value.split(/[,;\n]/).map(normalize).filter(Boolean) : [];
const overlaps = (required: string[], available: string[]) => required.length > 0 && required.some((item) => available.some((candidate) => candidate.includes(item) || item.includes(candidate)));
const seniorityRank = (value: unknown) => {
  const text = normalize(value);
  if (!text) return 0;
  if (text.includes("estagio") || text.includes("trainee") || text.includes("junior") || text.includes("júnior")) return 1;
  if (text.includes("pleno") || text.includes("mid")) return 2;
  if (text.includes("senior") || text.includes("sénior")) return 3;
  if (text.includes("direcao") || text.includes("direção") || text.includes("execut") || text.includes("lider") || text.includes("especialista")) return 4;
  return 1;
};
const immediate = (value: unknown) => /imediat|immediate|disponivel agora|disponível agora/.test(normalize(value));

export function calculateJobMatch(job: JobMatchInput, candidate: CandidateMatchInput): MatchResult {
  const weights: Record<string, number> = { location: 18, experience: 18, skills: 22, language_certification: 17, eligibility: 13, salary_availability: 12 };
  const matched: string[] = []; const missing: string[] = []; let applicable = 0; let points = 0;
  const check = (key: string, label: string, applies: boolean, ok: boolean) => { if (!applies) return; applicable += weights[key]; if (ok) { points += weights[key]; matched.push(label); } else missing.push(label); };

  const jobCountry = normalize(job.country); const jobProvince = normalize(job.province); const jobCity = normalize(job.city);
  const candidateCountry = normalize(candidate.country); const candidateProvince = normalize(candidate.province); const candidateCity = normalize(candidate.city || candidate.municipality);
  const sameCountry = !jobCountry || candidateCountry === jobCountry;
  const sameProvince = !jobProvince || candidateProvince === jobProvince;
  const sameCity = !jobCity || candidateCity === jobCity;
  const locationOk = sameCountry && (sameCity || (sameProvince && Boolean(candidate.willing_to_relocate)) || (!jobCity && sameProvince));
  check("location", "Localização", Boolean(jobCountry || jobProvince || jobCity), locationOk);

  const requiredSeniority = seniorityRank(job.seniority_level); const candidateSeniority = seniorityRank(candidate.seniority_level);
  check("experience", "Experiência e senioridade", requiredSeniority > 0, candidateSeniority >= requiredSeniority);

  const requiredSkills = [...list(job.hard_skills), ...list(job.functional_area)]; const candidateSkills = [...list(candidate.skills), ...list(candidate.hard_skills), ...list(candidate.functional_areas)];
  check("skills", "Competências técnicas", requiredSkills.length > 0, overlaps(requiredSkills, candidateSkills));

  const requiredLanguageCert = [...list(job.languages), ...list(job.required_certifications)]; const candidateLanguageCert = [...list(candidate.languages), ...list(candidate.language_items), ...list(candidate.certifications), ...list(candidate.certifications_structured)];
  check("language_certification", "Idiomas e certificações", requiredLanguageCert.length > 0, overlaps(requiredLanguageCert, candidateLanguageCert));

  const requiredEligibility = [...list(job.nationalities), ...list(job.driving_categories)]; const availableEligibility = [...list(candidate.nationality), ...list(candidate.driving_categories)];
  check("eligibility", "Elegibilidade e requisitos específicos", requiredEligibility.length > 0, overlaps(requiredEligibility, availableEligibility));

  const workModeOk = !job.work_mode || normalize(job.work_mode) === normalize(candidate.preferred_work_mode) || normalize(job.work_mode) === "remoto";
  const contractOk = !job.contract_type || !candidate.contract_type || normalize(job.contract_type) === normalize(candidate.contract_type);
  const salaryOk = (!job.salary_min || !candidate.salary_max_amount || candidate.salary_max_amount >= job.salary_min) && (!job.salary_max || !candidate.salary_min_amount || candidate.salary_min_amount <= job.salary_max);
  const availabilityOk = !job.availability || !immediate(job.availability) || immediate(candidate.availability);
  check("salary_availability", "Remuneração, modalidade e disponibilidade", Boolean(job.salary_min != null || job.salary_max != null || job.work_mode || job.contract_type || job.availability), workModeOk && contractOk && salaryOk && availabilityOk);

  const score = applicable ? Math.round((points / applicable) * 100) : 0;
  return { score, tier: score >= 100 ? "perfect" : score >= 50 ? "strong" : "none", matched, missing, weights };
}
