import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function loadEnv(path) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const item = line.trim();
    if (!item || item.startsWith("#")) continue;
    const index = item.indexOf("=");
    if (index < 0) continue;
    const key = item.slice(0, index);
    const value = item.slice(index + 1).replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv(new URL("../.env.local", import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) throw new Error("Supabase public credentials are required.");
const supabase = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });

async function signIn(email, password) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.user || !result.data.session) throw result.error || new Error("Authentication returned no session");
  return result.data.user;
}

const company = await signIn("empresa.demo@okutijobs.com", process.env.DEMO_COMPANY_PASSWORD || "DemoEmpresa#2026!");
const ownProfile = await supabase.from("profiles").select("id,account_type").eq("id", company.id).single();
if (ownProfile.error) throw ownProfile.error;
if (ownProfile.data.account_type !== "company") throw new Error("Demo account is not a company profile");

const companyProfile = await supabase.from("company_profiles").select("id,name,slug").eq("id", company.id).single();
if (companyProfile.error) throw companyProfile.error;
const ownJobs = await supabase.from("jobs").select("id,title,status").eq("company_id", company.id).order("created_at", { ascending: true });
if (ownJobs.error) throw ownJobs.error;
if (ownJobs.data.length !== 10) throw new Error(`Expected 10 demo jobs, received ${ownJobs.data.length}`);
if (ownJobs.data.some((job) => job.status !== "published")) throw new Error("A demo job is not published");

const jobIds = ownJobs.data.map((job) => job.id);
const applications = await supabase.from("applications").select("id,job_id,candidate_id,status").in("job_id", jobIds);
if (applications.error) throw applications.error;
if (applications.data.length !== 30) throw new Error(`Expected 30 demo applications, received ${applications.data.length}`);

const privateTableChecks = await Promise.all([
  supabase.from("messages").select("id").limit(1),
  supabase.from("notifications").select("id").eq("user_id", company.id).limit(1),
  supabase.from("talent_favorites").select("id").eq("company_id", company.id).limit(1),
]);
for (const check of privateTableChecks) if (check.error) throw check.error;

await supabase.auth.signOut();
const candidate = await signIn("candidato.demo1@okutijobs.com", "DemoCandidato#2026!1");
const candidateFavorites = await supabase.from("talent_favorites").select("id").eq("company_id", company.id);
if (candidateFavorites.error) throw candidateFavorites.error;
if (candidateFavorites.data.length !== 0) throw new Error("Candidate can see company favorites");
const candidateApplications = await supabase.from("applications").select("id,job_id,candidate_id").eq("candidate_id", candidate.id);
if (candidateApplications.error) throw candidateApplications.error;
if (candidateApplications.data.length !== 10) throw new Error(`Expected candidate to see 10 own applications, received ${candidateApplications.data.length}`);
await supabase.auth.signOut();

console.log(JSON.stringify({ ok: true, company: companyProfile.data.name, publishedJobs: ownJobs.data.length, companyApplications: applications.data.length, candidateOwnApplications: candidateApplications.data.length, candidateCannotReadCompanyFavorites: true }));
