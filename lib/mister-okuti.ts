export type JsonRecord = Record<string, unknown>;

const stopWords = new Set([
  "a", "as", "o", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "e", "ou", "que", "qual", "quais", "como", "onde", "quando", "me", "mim", "eu", "meu", "minha", "meus", "minhas", "seu", "sua", "seus", "suas", "ao", "aos", "à", "às", "é", "ser", "ter", "há", "mais", "menos", "muito", "muita", "preciso", "precisa", "quero", "gostaria", "ajuda", "ajudar", "pode", "podes", "porfavor", "vagas", "vaga", "emprego", "empregos", "oportunidade", "oportunidades", "candidato", "candidatos", "candidata", "candidatas", "talento", "talentos", "perfil", "perfis", "competencia", "competencias", "skill", "skills", "experiencia", "profissional", "profissionais", "encontrar", "procurar", "pesquisar", "buscar", "search", "find", "candidate", "candidates", "jobs", "job", "the", "a", "an", "and", "or", "for", "to", "with", "in", "on", "at", "of", "is", "are", "i", "my", "me", "please", "help", "need", "want",
]);

export function normalizeText(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

export function tokenize(value: unknown) {
  return Array.from(new Set(normalizeText(value).match(/[\p{L}\p{N}+#.]+/gu) ?? []))
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

export function listStrings(value: unknown, maxItems = 30): string[] {
  if (!Array.isArray(value)) return typeof value === "string" && value.trim() ? [value.trim().slice(0, 180)] : [];
  const result: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim()) result.push(item.trim().slice(0, 180));
    else if (item && typeof item === "object" && !Array.isArray(item)) {
      const row = item as JsonRecord;
      const label = [row.name, row.skill, row.title, row.label, row.language, row.level]
        .find((candidate) => typeof candidate === "string" && candidate.trim());
      if (typeof label === "string") result.push(label.trim().slice(0, 180));
    }
    if (result.length >= maxItems) break;
  }
  return Array.from(new Set(result));
}

export function userContextText(history: Array<{ role: "user" | "assistant"; content: string }>, message: string) {
  return [...history.filter((item) => item.role === "user").slice(-5).map((item) => item.content), message].join("\n").slice(-8000);
}

export function wantsJobSearch(value: string) {
  const text = normalizeText(value);
  return /\b(vaga|vagas|emprego|empregos|oportunidade|oportunidades|job|jobs|compatibilidade|compativel|combina|recomendacao|recomendacoes)\b/.test(text)
    || /\b(?:procur|encontr|pesquis|buscar).{0,50}\b(?:emprego|vaga|oportunidade|job)\b/.test(text);
}

export function wantsTalentSearch(value: string) {
  const text = normalizeText(value);
  return /\b(?:procur|encontr|pesquis|identific|selecion|buscar|search|find).{0,70}\b(?:talento|candidato|profissional|perfil|competencia|skill|pessoa|talent|candidate)\w*\b/.test(text)
    || /\b(?:talento|candidato|profissional|perfil|competencia|skill|talent|candidate)\w*.{0,70}\b(?:procur|encontr|pesquis|precis|buscar|com|em|para)\w*\b/.test(text)
    || (/\b(?:procuro|busco|necessito|preciso)\b/.test(text) && tokenize(text).length >= 1);
}

export function wantsJobDraft(value: string) {
  const text = normalizeText(value);
  return /\b(?:criar|crie|redigir|redija|escrever|escreva|preparar|prepare|rascunho|draft|descrever|anuncio|anunciar)\w*\b/.test(text)
    && /\b(?:vaga|vagas|emprego|empregos|anuncio|job|position|posicao|cargo)\w*\b/.test(text);
}

export function parseAssistantJson(value: string): JsonRecord | null {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const candidates = [cleaned];
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(cleaned.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as JsonRecord;
    } catch { /* Tentar o recorte JSON seguinte. */ }
  }
  return null;
}

function boundedString(value: unknown, limit = 1200) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function boundedStringArray(value: unknown, limit = 20) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 180)).filter(Boolean))).slice(0, limit)
    : [];
}

export function sanitizeJobDraft(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as JsonRecord;
  const title = boundedString(source.title, 180);
  const description = boundedString(source.description, 6000);
  const draft: JsonRecord = {
    title,
    industry: boundedString(source.industry, 120),
    functionalArea: boundedString(source.functionalArea, 120),
    seniority: boundedString(source.seniority, 120),
    workMode: boundedString(source.workMode, 60),
    contractType: boundedString(source.contractType, 60),
    availability: boundedString(source.availability, 180),
    country: boundedString(source.country, 100),
    province: boundedString(source.province, 100),
    city: boundedString(source.city, 100),
    nationalities: [],
    passportRequirements: boundedStringArray(source.passportRequirements, 10),
    ageMin: "",
    ageMax: "",
    drivingCategories: boundedStringArray(source.drivingCategories, 12),
    certifications: boundedStringArray(source.certifications, 20),
    hardSkills: boundedStringArray(source.hardSkills, 30),
    languages: boundedStringArray(source.languages, 15),
    salaryCurrency: boundedString(source.salaryCurrency, 10),
    salaryMin: boundedString(source.salaryMin, 30),
    salaryMax: boundedString(source.salaryMax, 30),
    benefits: boundedStringArray(source.benefits, 20),
    description,
    requirements: boundedString(source.requirements, 4000),
  };
  return title.length >= 3 && description.length >= 20 ? draft : null;
}

type CandidateProfile = JsonRecord & { id: string };
type JobRecord = JsonRecord & { id: string; slug: string; title: string; published_at?: string | null };

function profileTerms(profile: JsonRecord) {
  const titles = [profile.desired_job_title, profile.current_title, profile.headline].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const skills = [
    ...listStrings(profile.skills),
    ...listStrings(profile.hard_skills),
    ...listStrings(profile.functional_areas),
    ...listStrings(profile.certifications),
    ...listStrings(profile.languages),
    ...listStrings(profile.language_items),
    ...listStrings(profile.certifications_structured),
    ...(typeof profile.study_field === "string" ? [profile.study_field] : []),
  ];
  return { titles, skills };
}

function fieldTokens(values: unknown[]) {
  return new Set(values.flatMap((value) => tokenize(value)));
}

export function rankJobMatches<T extends JobRecord>(profile: JsonRecord, jobs: T[], query: string) {
  const queryTokens = tokenize(query);
  const { titles, skills } = profileTerms(profile);
  const titleTokens = fieldTokens(titles);
  const skillPhrases = Array.from(new Set(skills.map(normalizeText).filter((item) => item.length >= 2)));
  const preferredLocations = [profile.city, profile.province, profile.country].filter((value): value is string => typeof value === "string" && value.trim().length > 0).map(normalizeText);
  return jobs.map((job) => {
    const jobText = normalizeText([job.title, job.description, job.requirements, job.industry, job.functional_area, job.seniority_level, ...listStrings(job.hard_skills), ...listStrings(job.required_certifications), ...listStrings(job.languages)].filter(Boolean).join(" "));
    const jobTokens = fieldTokens([jobText]);
    const queryHits = queryTokens.filter((token) => jobTokens.has(token));
    const titleHits = Array.from(titleTokens).filter((token) => jobTokens.has(token));
    const skillHits = skillPhrases.filter((skill) => jobText.includes(skill));
    const locationText = normalizeText([job.country, job.province, job.city].join(" "));
    const locationHit = Boolean(locationText) && preferredLocations.some((location) => locationText.includes(location) || location.includes(locationText));
    const score = Math.min(100, queryHits.length * 4 + titleHits.length * 5 + skillHits.length * 8 + (locationHit ? 3 : 0));
    const matchTerms = Array.from(new Set([...skillHits, ...queryHits])).slice(0, 8);
    return { ...job, score, matchTerms };
  }).sort((a, b) => b.score - a.score || String(b.published_at ?? "").localeCompare(String(a.published_at ?? ""))).slice(0, 6);
}

export function rankTalentMatches(candidates: CandidateProfile[], query: string) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];
  return candidates.map((candidate) => {
    const roles = [candidate.desired_job_title, candidate.current_title, candidate.headline].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    const skills = [
      ...listStrings(candidate.skills),
      ...listStrings(candidate.hard_skills),
      ...listStrings(candidate.functional_areas),
      ...listStrings(candidate.certifications),
      ...listStrings(candidate.languages),
    ];
    const searchableValues = [...roles, ...skills, candidate.seniority_level, candidate.study_field, candidate.city, candidate.province].filter(Boolean);
    const candidateTokens = fieldTokens(searchableValues);
    const matchedTokens = queryTokens.filter((token) => candidateTokens.has(token));
    const matchedSkills = skills.filter((skill) => queryTokens.some((token) => tokenize(skill).includes(token)));
    const roleHits = queryTokens.filter((token) => roles.some((role) => tokenize(role).includes(token)));
    const score = matchedSkills.length * 4 + roleHits.length * 3 + matchedTokens.length;
    return {
      id: candidate.id,
      headline: boundedString(candidate.headline, 180),
      currentTitle: boundedString(candidate.current_title, 180),
      desiredJobTitle: boundedString(candidate.desired_job_title, 180),
      seniority: boundedString(candidate.seniority_level, 80),
      studyField: boundedString(candidate.study_field, 120),
      location: [boundedString(candidate.city, 80), boundedString(candidate.province, 80), boundedString(candidate.country, 80)].filter(Boolean).join(" · "),
      skills: Array.from(new Set(skills)).slice(0, 8),
      matchTerms: Array.from(new Set([...matchedSkills, ...matchedTokens])).slice(0, 8),
      score,
    };
  }).filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 6);
}
