export type CandidateForMatch = {
  desired_job_title?: string | null;
  headline?: string | null;
  current_title?: string | null;
  seniority_level?: string | null;
  province?: string | null;
  city?: string | null;
  academic_level?: string | null;
  study_field?: string | null;
  skills?: unknown;
  functional_areas?: unknown;
  salary_currency?: string | null;
  salary_min_amount?: number | null;
  salary_max_amount?: number | null;
};

export type MatchCriteria = {
  title?: string;
  province?: string;
  seniority?: string;
  skills?: string[];
  studyField?: string;
  currency?: string;
  minSalary?: number;
  maxSalary?: number;
};

export type MatchResult = { score: number; reasons: string[]; gaps: string[]; breakdown: { title: number; skills: number; seniority: number; location: number; education: number; salary: number } };

function normalize(value: unknown) { return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
function list(value: unknown) { return Array.isArray(value) ? value.map(normalize).filter(Boolean) : []; }
function contains(haystack: string, needle: string) { return Boolean(needle) && (haystack.includes(needle) || needle.includes(haystack)); }

export function calculateMatch(candidate: CandidateForMatch, criteria: MatchCriteria): MatchResult {
  const candidateText = [candidate.desired_job_title, candidate.headline, candidate.current_title, candidate.study_field].map(normalize).join(" ");
  const candidateSkills = [...list(candidate.skills), ...list(candidate.functional_areas)];
  const requestedSkills = (criteria.skills ?? []).map(normalize).filter(Boolean);
  const title = criteria.title ? contains(candidateText, normalize(criteria.title)) : false;
  const skillMatches = requestedSkills.filter((skill) => candidateSkills.some((candidateSkill) => contains(candidateSkill, skill)));
  const skills = requestedSkills.length ? skillMatches.length / requestedSkills.length : 0;
  const seniority = criteria.seniority ? normalize(candidate.seniority_level) === normalize(criteria.seniority) : false;
  const location = criteria.province ? normalize(candidate.province) === normalize(criteria.province) || normalize(candidate.city) === normalize(criteria.province) : false;
  const education = criteria.studyField ? contains(normalize(candidate.study_field), normalize(criteria.studyField)) : false;
  let salary = 0;
  if (criteria.currency && normalize(candidate.salary_currency) === normalize(criteria.currency)) {
    const candidateMin = Number(candidate.salary_min_amount ?? 0);
    const candidateMax = Number(candidate.salary_max_amount ?? Number.MAX_SAFE_INTEGER);
    const requestedMin = Number(criteria.minSalary ?? 0);
    const requestedMax = Number(criteria.maxSalary ?? Number.MAX_SAFE_INTEGER);
    salary = candidateMin <= requestedMax && candidateMax >= requestedMin ? 1 : 0;
  } else if (!criteria.currency && (criteria.minSalary !== undefined || criteria.maxSalary !== undefined)) salary = 0.5;
  else if (!criteria.minSalary && !criteria.maxSalary) salary = 0;

  const weights = { title: 25, skills: 30, seniority: 15, location: 10, education: 10, salary: 10 };
  const raw = (title ? weights.title : 0) + skills * weights.skills + (seniority ? weights.seniority : 0) + (location ? weights.location : 0) + (education ? weights.education : 0) + salary * weights.salary;
  const score = Math.round(raw);
  const reasons: string[] = [];
  const gaps: string[] = [];
  if (title) reasons.push("Cargo compatível"); else if (criteria.title) gaps.push("Cargo pretendido diferente ou não indicado");
  if (skillMatches.length) reasons.push(`${skillMatches.length}/${requestedSkills.length} skills encontradas`); else if (requestedSkills.length) gaps.push("Skills solicitadas não encontradas");
  if (seniority) reasons.push("Senioridade compatível"); else if (criteria.seniority) gaps.push("Senioridade por confirmar");
  if (location) reasons.push("Localização compatível"); else if (criteria.province) gaps.push("Localização diferente");
  if (education) reasons.push("Formação relacionada"); else if (criteria.studyField) gaps.push("Formação por confirmar");
  if (salary === 1) reasons.push("Pretensão dentro do orçamento"); else if (criteria.minSalary !== undefined || criteria.maxSalary !== undefined) gaps.push("Pretensão salarial fora do orçamento ou moeda diferente");
  return { score, reasons, gaps, breakdown: { title: title ? 100 : 0, skills: Math.round(skills * 100), seniority: seniority ? 100 : 0, location: location ? 100 : 0, education: education ? 100 : 0, salary: Math.round(salary * 100) } };
}
