-- ============================================================================
-- CampusSphere - Migration 0003: reporting views
-- security_invoker = true makes each view run with the CALLER's permissions,
-- so the RLS policies on the underlying tables still apply.
--
-- ATTENDANCE DEFINITION (used everywhere in the app):
--   attended = present + late          absent is not attended
--   percentage = attended / recorded * 100   (NULL when nothing is recorded)
-- ============================================================================

create view public.v_student_course_attendance
with (security_invoker = true) as
select
  a.student_id,
  a.course_id,
  count(*)                                              as recorded,
  count(*) filter (where a.status in ('present','late')) as attended,
  count(*) filter (where a.status = 'late')              as late,
  count(*) filter (where a.status = 'absent')            as absent,
  round(100.0 * count(*) filter (where a.status in ('present','late')) / nullif(count(*), 0), 1) as percentage
from public.attendance a
group by a.student_id, a.course_id;

create view public.v_course_attendance
with (security_invoker = true) as
select
  a.course_id,
  count(distinct a.attendance_date)                      as sessions,
  count(*)                                              as recorded,
  count(*) filter (where a.status in ('present','late')) as attended,
  count(*) filter (where a.status = 'late')              as late,
  count(*) filter (where a.status = 'absent')            as absent,
  round(100.0 * count(*) filter (where a.status in ('present','late')) / nullif(count(*), 0), 1) as percentage
from public.attendance a
group by a.course_id;

create view public.v_attendance_overall
with (security_invoker = true) as
select
  count(*)                                              as recorded,
  count(*) filter (where a.status in ('present','late')) as attended,
  count(*) filter (where a.status = 'late')              as late,
  count(*) filter (where a.status = 'absent')            as absent,
  round(100.0 * count(*) filter (where a.status in ('present','late')) / nullif(count(*), 0), 1) as percentage
from public.attendance a;

revoke all on public.v_student_course_attendance, public.v_course_attendance, public.v_attendance_overall from anon;
grant select on public.v_student_course_attendance, public.v_course_attendance, public.v_attendance_overall to authenticated;
