drop policy if exists "public companies are visible through jobs" on public.company_profiles;

create or replace view public.public_company_profiles as
select
  id,
  name,
  slug,
  description,
  industry,
  website_url,
  country,
  province,
  municipality,
  city,
  logo_path,
  verified_at,
  updated_at
from public.company_profiles;

grant select on public.public_company_profiles to anon, authenticated;
