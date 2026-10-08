-- Candidate profile preferences: simplified document questions, public talent visibility and language options.
-- Additive migration; preserves existing profile and document data.
alter table public.candidate_profiles
  add column if not exists passport_status text,
  add column if not exists driving_license_status text,
  add column if not exists maritime_status text;

-- The product decision is that candidate profiles are discoverable in the talent database.
update public.candidate_profiles
set visibility = 'public'
where visibility is distinct from 'public';

-- Keep existing document rows; cv and cv_english are the two supported CV slots.
alter table public.candidate_profiles
  add column if not exists nationality_secondary text;
