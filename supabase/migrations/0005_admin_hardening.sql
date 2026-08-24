-- OkutiJobs: impedir auto-elevação para admin
 drop policy if exists "admins manage admin members" on public.admin_members;
 create policy "admins manage admin members" on public.admin_members
   for all to authenticated
   using (public.is_platform_admin())
   with check (public.is_platform_admin());

-- O bootstrap inicial deve ser executado server-side com service_role para um email previamente confirmado.
