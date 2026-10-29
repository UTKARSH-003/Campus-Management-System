-- ============================================================================
-- CampusSphere - Migration 0001: core schema
-- Tables, constraints, indexes, updated_at triggers.
-- Security (functions, RLS, grants) lives in 0002_security.sql.
-- ============================================================================

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles : one application profile per Supabase Auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- settings : single-row table (id is always 1)
-- ---------------------------------------------------------------------------
create table public.settings (
  id                              smallint primary key default 1 check (id = 1),
  institution_name                text not null default 'Demo University',
  academic_year                   text not null default '2026-2027',
  attendance_threshold            numeric(5,2) not null default 75 check (attendance_threshold between 0 and 100),
  attendance_critical_threshold   numeric(5,2) not null default 60 check (attendance_critical_threshold between 0 and 100),
  timezone                        text not null default 'Asia/Kolkata',
  updated_at                      timestamptz not null default now(),
  check (attendance_critical_threshold <= attendance_threshold)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------
create table public.students (
  id               uuid primary key default gen_random_uuid(),
  student_id       text not null unique check (length(btrim(student_id)) > 0),
  full_name        text not null check (length(btrim(full_name)) > 0),
  email            text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone            text,
  department       text not null,
  program          text,
  semester         smallint not null check (semester between 1 and 12),
  section          text,
  enrollment_date  date not null default current_date,
  status           text not null default 'active'
                   check (status in ('active', 'inactive', 'graduated', 'suspended')),
  profile_image_url text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index students_email_key on public.students (lower(email));
create index students_department_idx on public.students (department);
create index students_semester_idx on public.students (semester);
create index students_status_idx on public.students (status);
create index students_name_idx on public.students (lower(full_name));

-- ---------------------------------------------------------------------------
-- faculty
-- ---------------------------------------------------------------------------
create table public.faculty (
  id              uuid primary key default gen_random_uuid(),
  faculty_id      text not null unique check (length(btrim(faculty_id)) > 0),
  full_name       text not null check (length(btrim(full_name)) > 0),
  email           text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone           text,
  department      text not null,
  designation     text,
  specialization  text,
  status          text not null default 'active'
                  check (status in ('active', 'on_leave', 'retired', 'inactive')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index faculty_email_key on public.faculty (lower(email));
create index faculty_department_idx on public.faculty (department);
create index faculty_status_idx on public.faculty (status);

-- ---------------------------------------------------------------------------
-- courses  (faculty is referenced by ID, never stored as free text)
-- ---------------------------------------------------------------------------
create table public.courses (
  id           uuid primary key default gen_random_uuid(),
  course_code  text not null unique check (course_code ~ '^[A-Z]{2,6}[0-9]{2,4}[A-Z]?$'),
  title        text not null check (length(btrim(title)) > 0),
  description  text,
  department   text not null,
  semester     smallint not null check (semester between 1 and 12),
  credits      smallint not null check (credits between 1 and 10),
  faculty_id   uuid references public.faculty (id) on delete restrict,
  status       text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index courses_faculty_idx on public.courses (faculty_id);
create index courses_department_idx on public.courses (department);
create index courses_semester_idx on public.courses (semester);

-- ---------------------------------------------------------------------------
-- student_courses : many-to-many enrolment
-- ---------------------------------------------------------------------------
create table public.student_courses (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete restrict,
  course_id    uuid not null references public.courses (id) on delete restrict,
  enrolled_at  timestamptz not null default now(),
  constraint student_courses_unique unique (student_id, course_id)
);
create index student_courses_course_idx on public.student_courses (course_id);

-- ---------------------------------------------------------------------------
-- attendance : one row per student, course and date
-- ---------------------------------------------------------------------------
create table public.attendance (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students (id) on delete restrict,
  course_id        uuid not null references public.courses (id) on delete restrict,
  attendance_date  date not null,
  status           text not null check (status in ('present', 'absent', 'late')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint attendance_unique unique (student_id, course_id, attendance_date)
);
create index attendance_course_date_idx on public.attendance (course_id, attendance_date);
create index attendance_date_idx on public.attendance (attendance_date);

-- ---------------------------------------------------------------------------
-- timetable : weekly recurring slots (1 = Monday ... 6 = Saturday)
-- `slot` is a generated minute-range used by the exclusion constraints, which
-- make overlap prevention race-safe inside PostgreSQL itself.
-- ---------------------------------------------------------------------------
create table public.timetable (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses (id) on delete restrict,
  faculty_id    uuid references public.faculty (id) on delete restrict,
  day_of_week   smallint not null check (day_of_week between 1 and 6),
  start_time    time not null,
  end_time      time not null,
  room          text not null check (length(btrim(room)) > 0),
  section       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint timetable_valid_range check (end_time > start_time),
  slot int4range generated always as (
    int4range(
      (extract(hour from start_time) * 60 + extract(minute from start_time))::int,
      greatest(
        (extract(hour from start_time) * 60 + extract(minute from start_time))::int,
        (extract(hour from end_time) * 60 + extract(minute from end_time))::int
      ),
      '[)'
    )
  ) stored,
  constraint timetable_no_room_overlap
    exclude using gist (room with =, day_of_week with =, slot with &&),
  constraint timetable_no_faculty_overlap
    exclude using gist (faculty_id with =, day_of_week with =, slot with &&)
);
create index timetable_course_idx on public.timetable (course_id);
create index timetable_faculty_idx on public.timetable (faculty_id);
create index timetable_day_idx on public.timetable (day_of_week);

-- ---------------------------------------------------------------------------
-- assignments
-- ---------------------------------------------------------------------------
create table public.assignments (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(btrim(title)) > 0),
  description  text,
  course_id    uuid not null references public.courses (id) on delete restrict,
  faculty_id   uuid references public.faculty (id) on delete restrict,
  due_date     timestamptz not null,
  max_marks    numeric(6,2) not null check (max_marks > 0),
  status       text not null default 'published' check (status in ('draft', 'published', 'closed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index assignments_course_idx on public.assignments (course_id);
create index assignments_due_idx on public.assignments (due_date);

-- ---------------------------------------------------------------------------
-- submissions
-- ---------------------------------------------------------------------------
create table public.submissions (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references public.assignments (id) on delete restrict,
  student_id      uuid not null references public.students (id) on delete restrict,
  submitted_at    timestamptz not null default now(),
  status          text not null default 'submitted'
                  check (status in ('submitted', 'late', 'graded', 'missing')),
  marks_obtained  numeric(6,2) check (marks_obtained is null or marks_obtained >= 0),
  feedback        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint submissions_unique unique (assignment_id, student_id)
);
create index submissions_student_idx on public.submissions (student_id);

-- ---------------------------------------------------------------------------
-- announcements (author is the profile of the signed-in user who created it)
-- ---------------------------------------------------------------------------
create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (length(btrim(title)) > 0),
  description   text not null,
  category      text not null default 'general'
                check (category in ('general', 'academic', 'exams', 'events', 'administrative')),
  priority      text not null default 'informational'
                check (priority in ('informational', 'important', 'urgent')),
  author_id     uuid default auth.uid() references public.profiles (id) on delete set null,
  published_at  timestamptz not null default now(),
  status        text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index announcements_published_idx on public.announcements (published_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','settings','students','faculty','courses','attendance',
    'timetable','assignments','submissions','announcements'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end $$;
