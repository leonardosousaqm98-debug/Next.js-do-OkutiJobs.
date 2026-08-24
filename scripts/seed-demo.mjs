import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function loadEnv(path) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(new URL("../.env.local", import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) throw new Error("Supabase service credentials are required.");
const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });

const companyEmail = "empresa.demo@okutijobs.com";
const companyPassword = process.env.DEMO_COMPANY_PASSWORD || "DemoEmpresa#2026!";
const companyName = "OkutiJobs Demo — Empresa de Teste";
const jobs = [
  ["Gestor de Projectos de Construção", "construcao", "Luanda", "Gestão", "Coordene projectos de construção, equipas e fornecedores com foco em prazo e qualidade."],
  ["Analista Financeiro — Júnior", "financas", "Luanda", "Finanças", "Prepare análises financeiras, reconciliações e relatórios de apoio à decisão."],
  ["Especialista de Recursos Humanos", "recursos-humanos", "Benguela", "Recursos Humanos", "Apoie recrutamento, integração, formação e acompanhamento de colaboradores."],
  ["Técnico de Contabilidade", "contabilidade", "Huíla", "Contabilidade", "Execute lançamentos, reconciliações bancárias e apoio ao fecho mensal."],
  ["Executivo de Vendas B2B", "vendas-b2b", "Luanda", "Vendas", "Desenvolva relações comerciais, pipeline e propostas para clientes empresariais."],
  ["Técnico de Suporte Informático", "suporte-informatico", "Cabinda", "Tecnologia", "Preste suporte a utilizadores, equipamentos e aplicações internas."],
  ["Coordenador de Logística", "logistica", "Lobito", "Logística", "Planeie operações logísticas, stock, transporte e indicadores de serviço."],
  ["Técnico de Segurança no Trabalho", "seguranca-trabalho", "Soyo", "Segurança", "Implemente procedimentos de segurança, auditorias e acções de prevenção."],
  ["Assistente Administrativo", "assistente-administrativo", "Luanda", "Administrativo", "Organize documentação, agenda, atendimento e rotinas administrativas."],
  ["Especialista de Marketing Digital", "marketing-digital", "Luanda", "Marketing", "Planeie campanhas digitais, conteúdos, métricas e presença online."],
];
const candidateNames = ["Ana Manuel", "Carlos Joaquim", "Marta Francisco"];

async function ensureUser(email, fullName, accountType, password) {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  let user = listed.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName, account_type: accountType } });
    if (created.error) throw created.error;
    user = created.data.user;
  }
  if (!user) throw new Error(`Unable to resolve ${email}`);
  const profile = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, account_type: accountType, preferred_language: "pt", updated_at: new Date().toISOString() });
  if (profile.error) throw profile.error;
  return user.id;
}

const companyId = await ensureUser(companyEmail, companyName, "company", companyPassword);
const company = await supabase.from("company_profiles").upsert({
  id: companyId,
  name: companyName,
  slug: "okutijobs-demo-empresa",
  description: "Perfil de demonstração da OkutiJobs. Os anúncios desta empresa servem exclusivamente para testar pesquisa, candidatura e gestão de vagas.",
  industry: "Serviços profissionais e recrutamento",
  website_url: "https://okutijobs.com",
  country: "Angola",
  province: "Luanda",
  municipality: "Kilamba Kiaxi",
  city: "Luanda",
}, { onConflict: "id" });
if (company.error) throw company.error;

const candidateIds = [];
for (let index = 0; index < candidateNames.length; index += 1) {
  const email = `candidato.demo${index + 1}@okutijobs.com`;
  const id = await ensureUser(email, `${candidateNames[index]} — Perfil Demo`, "candidate", `DemoCandidato#2026!${index + 1}`);
  candidateIds.push(id);
  const candidate = await supabase.from("candidate_profiles").upsert({
    id,
    headline: index === 0 ? "Analista de operações e atendimento" : index === 1 ? "Técnico financeiro e administrativo" : "Profissional comercial e de projectos",
    bio: "Perfil de demonstração criado para testar correspondência, candidaturas e apresentação de candidatos.",
    country: "Angola",
    province: index === 1 ? "Benguela" : "Luanda",
    city: index === 1 ? "Lobito" : "Luanda",
    preferred_work_mode: index === 2 ? "hybrid" : "onsite",
    contract_type: "full_time",
    academic_level: "Licenciatura",
    study_field: index === 1 ? "Contabilidade" : index === 2 ? "Gestão" : "Administração",
    current_title: index === 0 ? "Analista de Operações" : index === 1 ? "Técnico Administrativo" : "Executivo Comercial",
    salary_min_kz: 250000,
    salary_max_kz: 650000,
    availability: "immediate",
    willing_to_relocate: true,
    willing_to_travel: true,
    open_to_work: true,
    visibility: "public",
    profile_completeness: 82,
    certifications: index === 1 ? ["Excel Avançado", "Primavera" ] : ["Microsoft Office", "Atendimento ao Cliente"],
    languages: [{ language: "Português", level: "C2" }, { language: "Inglês", level: index === 2 ? "B2" : "B1" }],
  }, { onConflict: "id" });
  if (candidate.error) throw candidate.error;
}

for (let index = 0; index < jobs.length; index += 1) {
  const [title, slug, province, area, description] = jobs[index];
  const job = await supabase.from("jobs").upsert({
    company_id: companyId,
    title: `${title} — Demonstração`,
    slug: `demo-${slug}`,
    description: `${description} Esta é uma oportunidade de demonstração da OkutiJobs para validação da interface.`,
    requirements: `Licenciatura ou formação relevante; experiência demonstrável em ${area.toLowerCase()}; domínio de ferramentas digitais; boa comunicação e organização.`,
    country: "Angola",
    province,
    city: province === "Luanda" ? "Luanda" : province === "Lobito" ? "Lobito" : province,
    work_mode: index % 3 === 0 ? "hybrid" : index % 3 === 1 ? "onsite" : "remote",
    contract_type: index % 4 === 0 ? "part_time" : "full_time",
    status: "published",
    publication_mode: "public",
    published_at: new Date(Date.now() - index * 86400000).toISOString(),
  }, { onConflict: "slug" }).select("id").single();
  if (job.error) throw job.error;
  for (const candidateId of candidateIds) {
    const application = await supabase.from("applications").upsert({ job_id: job.data.id, candidate_id: candidateId, status: ["submitted", "screening", "interview"][index % 3] }, { onConflict: "job_id,candidate_id", ignoreDuplicates: true });
    if (application.error) throw application.error;
  }
}

console.log(JSON.stringify({ ok: true, companyEmail, companyPassword, jobs: jobs.length, candidatesPerJob: candidateIds.length, note: "DEMO — não usar como dados reais" }));
