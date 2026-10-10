revoke execute on function public.academy_can_read_cohort(uuid) from anon;
revoke execute on function public.academy_enrol(uuid, uuid) from anon;
revoke execute on function public.academy_is_enrolled_in_course(uuid) from anon;
revoke execute on function public.academy_is_instructor() from anon;
revoke execute on function public.academy_suggest_courses_after_failed_test() from public, anon, authenticated;
revoke execute on function public.academy_teaches_cohort(uuid) from anon;
revoke execute on function public.academy_teaches_enrollment(uuid) from anon;
revoke execute on function public.start_academy_lesson(uuid) from anon;
revoke execute on function public.complete_academy_lesson(uuid, integer) from anon;
