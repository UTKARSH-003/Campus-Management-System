# CampusSphere - Smart Campus Management System

> **Academic prototype.** CampusSphere is a college project that demonstrates a centralised campus management platform. It uses entirely fictional data and is **not** a production-ready university information system.

Institution (demo): **Demo University** · Academic year **2026-2027**

---

## 1. Abstract

CampusSphere is a web application that lets a campus administrator manage students, faculty, courses, enrolment, attendance, timetables, assignments, announcements and reports from one dashboard. A React front-end talks directly to a Supabase PostgreSQL database; Supabase Auth identifies the administrator and Row Level Security (RLS) policies make the database itself enforce who may read or change data.

## 2. Introduction

Many colleges keep student lists, attendance sheets and timetables in separate spreadsheets. This causes duplicated data, inconsistent attendance figures and slow reporting. CampusSphere shows how one relational database can act as the single source of truth for all of these modules.

## 3. Problem statement

Campus data is scattered and manually maintained, so it is hard to answer simple questions such as "which course has poor attendance?" or "is this room already booked?". The prototype solves these with relational constraints and live, database-derived dashboards.

## 4. Objectives

1. Provide CRUD for the main campus modules, persisted in Supabase PostgreSQL.
2. Authenticate the administrator with Supabase Auth.
3. Protect data with Row Level Security (not front-end checks alone).
4. Make every dashboard number and chart come from real records.
5. Provide a responsive, accessible, polished interface.
6. Run locally without any paid backend or external AI service.

## 5. Scope

In scope: one administrator role, ten modules (below), fictional seed data, rule-based insights and assistant.
Out of scope: student/faculty logins, file uploads, e-mail/SMS, payments, exam results, real-time sync, production hardening (see Limitations).

## 6. Key features

- Dashboard: live statistics, progress cards, today's schedule, rule-based Campus Insights, recent announcements.
- Students / Faculty / Courses: search, filters, sorting, pagination, create / view / edit / delete, validation, duplicate-ID prevention, safe deletion (no silent cascades).
- Course enrolment: enrol or remove students; counts derived from `student_courses`.
- Attendance: mark Present / Late / Absent per course and date, bulk marking, edit saved attendance (upsert), summaries, history, CSV export.
- Timetable: Monday-Saturday weekly view with database-enforced room and faculty conflict prevention.
- Assignments: deadlines, upcoming / overdue detection, submissions and marks (marks ≤ maximum enforced by the database).
- Announcements: category and priority, filters, details.
- Reports: five Recharts charts with filters and CSV export matching the active filters.
- Settings: institution, academic year, attendance thresholds, time zone, own profile name.
- Global search, notification dropdown, floating rule-based Campus Assistant.
- Animated pastel background, glass cards, sticky sidebar / toolbar, mobile drawer, reduced-motion support.

## 7. Technology stack

React 19 · Vite · TypeScript · Tailwind CSS 4 · React Router · Lucide React · Recharts · Supabase (PostgreSQL, Auth, RLS) via `@supabase/supabase-js`. Fonts: Plus Jakarta Sans and Outfit (Google Fonts).

## 8. System architecture (viva summary)

```
Browser (React SPA)
   │  @supabase/supabase-js  (project URL + publishable key only)
   ▼
Supabase
   ├─ Auth        -> who is signed in (JWT)
   ├─ PostgREST   -> turns table / view queries into HTTP
   └─ PostgreSQL  -> tables, constraints, triggers, views, RLS policies
```

There is **no custom backend server**. All rules that must never be bypassed (uniqueness, valid ranges, overlap prevention, role checks) live in PostgreSQL. The React app adds friendly validation and error messages on top.

How RLS protects data: every table has RLS enabled. Each policy calls `public.is_admin()`, which looks up the signed-in user's row in `profiles` and checks `role = 'admin'`. A user who merely has an account is a `viewer` and sees nothing. Nobody can promote themselves: the `role` column is not updatable through the API (column-level grant) and a trigger also blocks role changes from API requests. The first admin is created from the Supabase SQL Editor.

Code layout: `src/pages` (one file per module) · `src/components` (layout, ui kit, module pieces) · `src/services` (all Supabase queries) · `src/hooks` (auth, settings, toasts, list state) · `src/utils` (dates, attendance maths, CSV) · `supabase/migrations` (schema, security, views) · `supabase/seed.sql`.

## 9. Database schema and relationships

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user: name and role (`admin` / `viewer`). Created automatically by a trigger with the lowest role. |
| `settings` | Single row (id = 1): institution, academic year, attendance thresholds, time zone. |
| `students` | Student records. Unique `student_id` and unique e-mail (case-insensitive). |
| `faculty` | Faculty records. Unique `faculty_id` and e-mail. |
| `courses` | Course catalogue. Unique `course_code`; `faculty_id` references `faculty` (never free text). |
| `student_courses` | Many-to-many enrolment, unique `(student_id, course_id)`. |
| `attendance` | One row per student, course and date (unique). Status `present` / `absent` / `late`. |
| `timetable` | Weekly slots (day 1-6, start, end, room). Exclusion constraints stop overlapping room or faculty use. |
| `assignments` | Assignments per course with due date and maximum marks. |
| `submissions` | One per student and assignment; marks cannot exceed the assignment maximum. |
| `announcements` | Title, category, priority, author (`profiles`), publish date, status. |

Key relationships: student ↔ course (many-to-many via `student_courses`); faculty 1 → many courses; course 1 → many attendance rows, timetable slots and assignments; assignment 1 → many submissions; auth user 1 ↔ 1 profile; announcement → author profile.

Integrity rules enforced in the database: foreign keys use `ON DELETE RESTRICT` (nothing is silently cascade-deleted); attendance requires an existing enrolment; an enrolment with recorded attendance cannot be removed; timetable end must be after start; timetable rows inherit the course's faculty when none is chosen.

Views (`security_invoker`, so RLS still applies): `v_student_course_attendance`, `v_course_attendance`, `v_attendance_overall`.

### Attendance calculation (used everywhere)

```
attended   = present + late          (absent does not count)
percentage = attended / recorded sessions × 100
no recorded sessions -> "No attendance data" (never divide by zero)
```
Bands (configurable in Settings): green ≥ 75 %, amber 60 % to < 75 %, rose < 60 %. Late is counted as attended but is shown separately.

## 10. Module descriptions

Dashboard · Students · Faculty · Courses · Attendance (Mark / Summary / History tabs) · Timetable · Assignments (with submissions) · Announcements · Reports · Settings. Every module reads and writes Supabase; there are no placeholder pages.

**Campus Insights / Notifications** apply fixed rules to live data: course attendance below the threshold, overdue assignments, assignments due within 3 days, urgent announcements from the last 7 days.

**Campus Assistant** is a rule-based keyword matcher (regular expressions) over live Supabase data. It understands: student count, faculty count, today's classes, overdue assignments, average attendance and recent announcements. **No AI model or external API is used**, and the interface says so.

## 11. Supabase setup (steps that need you)

I could not create or test against *your* Supabase project, so these steps are yours:

1. Create a free account at <https://supabase.com> and a new project named **CampusSphere**.
2. In **Project Settings → API** copy the **Project URL** and the **publishable (anon) key**. Never use the `service_role` / secret key in this app.
3. In the **SQL Editor** run, in order, the contents of:
   1. `supabase/migrations/0001_schema.sql`
   2. `supabase/migrations/0002_security.sql`
   3. `supabase/migrations/0003_views.sql`

   (Alternatively, with the Supabase CLI: `supabase link` then `supabase db push`.)
4. **Create the administrator.** In **Authentication → Users → Add user**, create a user with an e-mail and password (tick *Auto Confirm User*). Then, in the SQL Editor, promote that user (replace the e-mail):
   ```sql
   insert into public.profiles (id, full_name, role)
   select id, 'Campus Administrator', 'admin' from auth.users where email = 'you@example.com'
   on conflict (id) do update set role = 'admin', full_name = excluded.full_name;
   ```
   This only works from the SQL Editor; the app cannot change roles.
5. **Seed demo data**: run `supabase/seed.sql` in the SQL Editor (do this after step 4 so announcements get an author). It is safe to run twice: it does nothing if the demo students already exist.

## 12. Environment configuration

```bash
cp .env.example .env
# then edit .env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```
Variables prefixed `VITE_` are visible in the browser, so only the URL and publishable key belong there. `.env` is git-ignored. If the variables are missing the app shows a setup screen instead of crashing.

## 13. Local installation

Requires Node.js 20+ (developed on Node 22) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

Sign in with the administrator e-mail and password you created in step 4.

## 14. Development commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

When hosting the built `dist/` folder, configure the host to serve `index.html` for unknown paths (single-page-app fallback) so refreshing `/students` works.

## 15. Demonstration workflow (viva / presentation)

1. Open the login page, show an invalid password error, then sign in.
2. **Dashboard**: point out that numbers come from the database; open an insight.
3. **Students**: search, filter, add a student, try a duplicate Student ID (rejected), open a profile.
4. **Courses**: open a course, enrol a student.
5. **Attendance**: pick a course and today's date, press *All present*, change one student to Absent, save, reopen to show it persisted; show the Summary tab percentages and the dashboard update.
6. **Timetable**: add a class that clashes with an existing room or faculty slot and show the conflict message.
7. **Assignments**: open one, record a submission, try marks above the maximum (rejected).
8. **Reports**: change filters and export a CSV.
9. Open the **Campus Assistant** and ask "How many students are registered?".
10. Explain RLS: a signed-in user without the admin role sees no data (see Testing).

Resetting demo data: in the SQL Editor run
```sql
truncate table public.submissions, public.attendance, public.timetable, public.assignments,
  public.student_courses, public.announcements, public.courses, public.faculty, public.students cascade;
```
then run `supabase/seed.sql` again. (The browser deliberately cannot do this: it would need privileged credentials.)

## 16. API and database access

The front-end never builds SQL. `src/services/*.ts` call the Supabase client, e.g. `supabase.from('students').select('*').eq('status','active')`. PostgREST translates this into SQL and runs it as the signed-in user, so RLS applies to every call. Database errors (unique violations, foreign-key restrictions, exclusion constraints, check constraints) are translated to readable messages in `src/lib/errors.ts`.

## 17. Testing

What was actually run during development:

- **SQL against PostgreSQL semantics (PGlite, in-memory):** all migrations and the seed apply cleanly; seed is idempotent; verified that anonymous users are denied, a non-admin sees zero rows and cannot insert, nobody can change a role through the API, duplicate student ID / e-mail rejected, invalid e-mail and semester rejected, deleting a student / faculty / course that is referenced is blocked, attendance for a non-enrolled student and duplicate attendance are rejected, an enrolment with attendance cannot be removed, timetable invalid range / room overlap / faculty overlap are rejected while valid entries are accepted, marks above the maximum are rejected, and the views honour RLS.
- **TypeScript compile and production build:** `npm run build` succeeds.
- **Browser smoke test (Chromium via Playwright, 52 checks, all passing)** against the built app with the Supabase HTTP API *simulated from fixtures generated from the seed data*: login redirect and error, protected routes, navigation / active state / breadcrumbs for all 10 pages, dashboard values, form validation, create and delete calls, attendance upsert request, assistant answers and unsupported-question reply, global search, mobile drawer, no horizontal overflow on any page at 390 px width, logout.

**Not tested (be honest in the viva):**

- A live Supabase project: real Supabase Auth, PostgREST, and RLS evaluated through the HTTP API. (RLS was tested directly in PostgreSQL, not through the API.) Please run the demonstration workflow once on your own project.
- Firefox / Safari, real phones and tablets, screen-reader testing, automated accessibility audits.
- Performance with large data volumes; concurrent administrators.
- Profile image upload (not implemented), dark theme (not implemented).

The linter reports only warnings (mostly React-compiler style advice); there are no lint errors.

## 18. Limitations

- Single role (administrator); no student or faculty portals.
- Aggregates for reports/dashboard are computed in the browser from fetched rows for some metrics; fine for hundreds or low thousands of rows, not for very large institutions (use database views/functions for scale).
- Attendance history is filtered by student name in the browser after fetching the date/course range.
- No profile images, file uploads, notifications by e-mail, audit log, or backups.
- Departments and semester lists are constants in `src/utils/constants.ts`.
- The Campus Assistant understands only a fixed set of questions.

## 19. Future enhancements

Student and faculty portals with role-specific policies, assignment file uploads (Supabase Storage), exam and grade modules, audit logging, e-mail notifications, database functions for heavy reports, automated test suite (Vitest + Playwright against a local Supabase), dark mode, internationalisation.

## 20. Conclusion

CampusSphere demonstrates how a normalised PostgreSQL schema, database-enforced rules and a small React front-end can replace scattered spreadsheets with one consistent, secure, demonstrable campus management system.

---

All people, e-mail addresses and phone numbers in the seed data are invented.
