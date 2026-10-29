-- ============================================================================
-- CampusSphere - Migration 0002: authorization, integrity triggers, RLS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- is_admin(): trusted role lookup.
-- SECURITY DEFINER so it can read public.profiles without triggering the RLS
-- policies of profiles itself (avoids infinite recursion). search_path is
-- pinned to '' and every object is schema-qualified to prevent hijacking.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- New auth user -> profile with the LEAST privileged role ('viewer').
-- Admin rights are granted only through the SQL Editor (see README).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Defence in depth: API users can never change a role, even if a policy or
-- grant is later loosened by mistake. The SQL Editor (auth.uid() is null) can.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and (select auth.uid()) is not null then
    raise exception 'Roles cannot be changed from the application.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

-- Attendance may only be recorded for a student enrolled in that course.
create or replace function public.check_attendance_enrolment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.student_courses sc
    where sc.student_id = new.student_id and sc.course_id = new.course_id
  ) then
    raise exception 'Student is not enrolled in this course.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger attendance_check_enrolment
  before insert or update of student_id, course_id on public.attendance
  for each row execute function public.check_attendance_enrolment();

-- An enrolment cannot be removed while attendance has been recorded for it.
create or replace function public.protect_enrolment_with_attendance()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.attendance a
    where a.student_id = old.student_id and a.course_id = old.course_id
  ) then
    raise exception 'Cannot remove enrolment: attendance has already been recorded for this student in this course.'
      using errcode = '23503';
  end if;
  return old;
end;
$$;
create trigger student_courses_protect_attendance
  before delete on public.student_courses
  for each row execute function public.protect_enrolment_with_attendance();

-- Timetable / assignments inherit the course's faculty when none is given.
create or replace function public.default_faculty_from_course()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.faculty_id is null then
    select c.faculty_id into new.faculty_id from public.courses c where c.id = new.course_id;
  end if;
  return new;
end;
$$;
create trigger timetable_default_faculty
  before insert or update of course_id, faculty_id on public.timetable
  for each row execute function public.default_faculty_from_course();
create trigger assignments_default_faculty
  before insert or update of course_id, faculty_id on public.assignments
  for each row execute function public.default_faculty_from_course();

-- Marks obtained must not exceed the assignment's maximum marks.
create or replace function public.check_submission_marks()
returns trigger
language plpgsql
set search_path = ''
as $$
declare max_m numeric;
begin
  if new.marks_obtained is not null then
    select a.max_marks into max_m from public.assignments a where a.id = new.assignment_id;
    if new.marks_obtained > max_m then
      raise exception 'Marks obtained (%) cannot exceed the maximum marks (%).', new.marks_obtained, max_m
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create trigger submissions_check_marks
  before insert or update of marks_obtained, assignment_id on public.submissions
  for each row execute function public.check_submission_marks();

-- ---------------------------------------------------------------------------
-- Grants: nothing for anon; authenticated gets table privileges that RLS
-- then narrows down to administrators.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select, insert, update, delete on
  public.students, public.faculty, public.courses, public.student_courses,
  public.attendance, public.timetable, public.assignments, public.submissions,
  public.announcements
to authenticated;

grant select, insert, update on public.settings to authenticated;   -- no delete
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;       -- role is NOT updatable

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.settings        enable row level security;
alter table public.students        enable row level security;
alter table public.faculty         enable row level security;
alter table public.courses         enable row level security;
alter table public.student_courses enable row level security;
alter table public.attendance      enable row level security;
alter table public.timetable       enable row level security;
alter table public.assignments     enable row level security;
alter table public.submissions     enable row level security;
alter table public.announcements   enable row level security;

-- profiles: see/update only your own row (name only); admins can read all.
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- No insert/delete policy: rows are created by the trigger on auth.users only.

-- settings: administrators only. No delete policy (table has no delete grant).
create policy settings_select_admin on public.settings
  for select to authenticated using (public.is_admin());
create policy settings_insert_admin on public.settings
  for insert to authenticated with check (public.is_admin());
create policy settings_update_admin on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Campus tables: explicit select / insert / update / delete policies, each
-- requiring a verified administrator (profiles.role = 'admin').
do $$
declare t text;
begin
  foreach t in array array[
    'students','faculty','courses','student_courses','attendance',
    'timetable','assignments','submissions','announcements'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_admin())',
                   t || '_select_admin', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
                   t || '_insert_admin', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
                   t || '_update_admin', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())',
                   t || '_delete_admin', t);
  end loop;
end $$;
