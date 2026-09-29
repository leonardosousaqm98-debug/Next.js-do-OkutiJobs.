-- International CV wizard: additive structured fields.
-- Run after 0004_admin_backoffice.sql.
alter table public.candidate_profiles
  add column if not exists email_primary text,
  add column if not exists phone_whatsapp text,
  add column if not exists linkedin_url text,
  add column if not exists website_url text,
  add column if not exists nationality text,
  add column if not exists place_of_birth text,
  add column if not exists date_of_birth date,
  add column if not exists marital_status text,
  add column if not exists passport_number text,
  add column if not exists passport_expiry date,
  add column if not exists passport_issuer text,
  add column if not exists driving_categories jsonb not null default '[]'::jsonb,
  add column if not exists driving_license_expiry date,
  add column if not exists maritime_book_number text,
  add column if not exists maritime_role text,
  add column if not exists maritime_certifications text,
  add column if not exists professional_licenses jsonb not null default '[]'::jsonb,
  add column if not exists experiences_structured jsonb not null default '[]'::jsonb,
  add column if not exists education_structured jsonb not null default '[]'::jsonb,
  add column if not exists certifications_structured jsonb not null default '[]'::jsonb,
  add column if not exists hard_skills jsonb not null default '[]'::jsonb,
  add column if not exists language_items jsonb not null default '[]'::jsonb,
  add column if not exists soft_skills jsonb not null default '[]'::jsonb,
  add column if not exists travel_availability text,
  add column if not exists relocation_scope text,
  add column if not exists offshore_rotation text;

update storage.buckets
set allowed_mime_types = array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
where id = 'candidate-documents';