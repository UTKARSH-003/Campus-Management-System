-- ============================================================================
-- CampusSphere - fictional demonstration data
-- Run ONCE in the Supabase SQL Editor (it runs as the postgres role, which is
-- how it is allowed to write past RLS). Safe to re-run: the whole script is
-- skipped when the demo students already exist.
-- All people, e-mails and phone numbers below are invented.
-- ============================================================================
do $$
declare
  admin_profile uuid;
begin
  if exists (select 1 from public.students where student_id like 'DU26-%') then
    raise notice 'CampusSphere demo data already present - skipping seed.';
    return;
  end if;

  select id into admin_profile from public.profiles where role = 'admin' order by created_at limit 1;

  -- Faculty (6) ------------------------------------------------------------
  insert into public.faculty (faculty_id, full_name, email, phone, department, designation, specialization, status) values
    ('FAC-001','Dr. Meera Iyer',     'meera.iyer@demo-university.example',     '+91 90000 10001','Computer Science','Professor',           'Algorithms & Programming', 'active'),
    ('FAC-002','Dr. Rohan Mehta',    'rohan.mehta@demo-university.example',    '+91 90000 10002','Computer Science','Associate Professor', 'Databases & Web',          'active'),
    ('FAC-003','Prof. Ananya Rao',   'ananya.rao@demo-university.example',     '+91 90000 10003','Electronics',     'Assistant Professor', 'Digital Systems',          'active'),
    ('FAC-004','Dr. Vikram Desai',   'vikram.desai@demo-university.example',   '+91 90000 10004','Mechanical',      'Professor',           'Applied Mechanics',        'active'),
    ('FAC-005','Prof. Sara Thomas',  'sara.thomas@demo-university.example',    '+91 90000 10005','Business',        'Associate Professor', 'Organisational Behaviour', 'on_leave'),
    ('FAC-006','Dr. Kabir Nair',     'kabir.nair@demo-university.example',     '+91 90000 10006','Mathematics',     'Assistant Professor', 'Linear Algebra & Calculus','active')
  on conflict (faculty_id) do nothing;

  -- Courses (8) ------------------------------------------------------------
  insert into public.courses (course_code, title, description, department, semester, credits, faculty_id, status)
  select v.code, v.title, v.descr, v.dept, v.sem, v.cr, f.id, 'active'
  from (values
    ('CS101','Introduction to Programming','Problem solving and programming fundamentals.','Computer Science',1,4,'FAC-001'),
    ('CS201','Data Structures','Lists, trees, graphs and their complexity.','Computer Science',3,4,'FAC-001'),
    ('CS301','Database Systems','Relational model, SQL, normalisation and transactions.','Computer Science',5,4,'FAC-002'),
    ('CS305','Web Technologies','Modern front-end and back-end web development.','Computer Science',5,3,'FAC-002'),
    ('EC201','Digital Electronics','Logic gates, combinational and sequential circuits.','Electronics',3,4,'FAC-003'),
    ('ME101','Engineering Mechanics','Statics, dynamics and basic stress analysis.','Mechanical',1,3,'FAC-004'),
    ('BA101','Principles of Management','Core management concepts and practices.','Business',1,3,'FAC-005'),
    ('MA101','Engineering Mathematics I','Calculus and linear algebra for engineers.','Mathematics',1,4,'FAC-006')
  ) as v(code,title,descr,dept,sem,cr,fac)
  join public.faculty f on f.faculty_id = v.fac
  on conflict (course_code) do nothing;

  -- Students (25) ----------------------------------------------------------
  insert into public.students (student_id, full_name, email, phone, department, program, semester, section, enrollment_date, status)
  values
    ('DU26-001','Aarav Sharma',   'aarav.sharma@students.demo-university.example',   '+91 91000 20001','Computer Science','B.Tech CSE',1,'A', current_date - 90,'active'),
    ('DU26-002','Diya Patel',     'diya.patel@students.demo-university.example',     '+91 91000 20002','Computer Science','B.Tech CSE',1,'A', current_date - 90,'active'),
    ('DU26-003','Ishaan Verma',   'ishaan.verma@students.demo-university.example',   '+91 91000 20003','Electronics',     'B.Tech ECE',1,'B', current_date - 90,'active'),
    ('DU26-004','Kavya Reddy',    'kavya.reddy@students.demo-university.example',    '+91 91000 20004','Mechanical',      'B.Tech ME', 1,'A', current_date - 90,'active'),
    ('DU26-005','Rahul Khanna',   'rahul.khanna@students.demo-university.example',   '+91 91000 20005','Business',        'BBA',       1,'A', current_date - 90,'active'),
    ('DU26-006','Sneha Joshi',    'sneha.joshi@students.demo-university.example',    '+91 91000 20006','Computer Science','B.Tech CSE',1,'B', current_date - 90,'active'),
    ('DU26-007','Arjun Menon',    'arjun.menon@students.demo-university.example',    '+91 91000 20007','Mechanical',      'B.Tech ME', 1,'A', current_date - 90,'active'),
    ('DU26-008','Tanvi Kulkarni', 'tanvi.kulkarni@students.demo-university.example', '+91 91000 20008','Business',        'BBA',       1,'A', current_date - 90,'active'),
    ('DU26-009','Dev Malhotra',   'dev.malhotra@students.demo-university.example',   '+91 91000 20009','Computer Science','B.Tech CSE',1,'A', current_date - 90,'active'),
    ('DU26-010','Nisha Bose',     'nisha.bose@students.demo-university.example',     '+91 91000 20010','Electronics',     'B.Tech ECE',1,'B', current_date - 90,'inactive'),
    ('DU26-011','Aditya Singh',   'aditya.singh@students.demo-university.example',   '+91 91000 20011','Computer Science','B.Tech CSE',3,'A', current_date - 500,'active'),
    ('DU26-012','Pooja Nambiar',  'pooja.nambiar@students.demo-university.example',  '+91 91000 20012','Computer Science','B.Tech CSE',3,'A', current_date - 500,'active'),
    ('DU26-013','Karan Chopra',   'karan.chopra@students.demo-university.example',   '+91 91000 20013','Electronics',     'B.Tech ECE',3,'A', current_date - 500,'active'),
    ('DU26-014','Meghna Rao',     'meghna.rao@students.demo-university.example',     '+91 91000 20014','Electronics',     'B.Tech ECE',3,'B', current_date - 500,'active'),
    ('DU26-015','Siddharth Jain', 'siddharth.jain@students.demo-university.example', '+91 91000 20015','Computer Science','B.Tech CSE',3,'B', current_date - 500,'active'),
    ('DU26-016','Riya Bhatt',     'riya.bhatt@students.demo-university.example',     '+91 91000 20016','Computer Science','B.Tech CSE',3,'A', current_date - 500,'active'),
    ('DU26-017','Harsh Agarwal',  'harsh.agarwal@students.demo-university.example',  '+91 91000 20017','Electronics',     'B.Tech ECE',3,'A', current_date - 500,'suspended'),
    ('DU26-018','Lakshmi Pillai', 'lakshmi.pillai@students.demo-university.example', '+91 91000 20018','Computer Science','B.Tech CSE',3,'B', current_date - 500,'active'),
    ('DU26-019','Neel Gupta',     'neel.gupta@students.demo-university.example',     '+91 91000 20019','Computer Science','B.Tech CSE',5,'A', current_date - 900,'active'),
    ('DU26-020','Aisha Khan',     'aisha.khan@students.demo-university.example',     '+91 91000 20020','Computer Science','B.Tech CSE',5,'A', current_date - 900,'active'),
    ('DU26-021','Yash Pandey',    'yash.pandey@students.demo-university.example',    '+91 91000 20021','Computer Science','B.Tech CSE',5,'B', current_date - 900,'active'),
    ('DU26-022','Simran Kaur',    'simran.kaur@students.demo-university.example',    '+91 91000 20022','Computer Science','B.Tech CSE',5,'A', current_date - 900,'active'),
    ('DU26-023','Omkar Patil',    'omkar.patil@students.demo-university.example',    '+91 91000 20023','Computer Science','B.Tech CSE',5,'B', current_date - 900,'active'),
    ('DU26-024','Zara Fernandes', 'zara.fernandes@students.demo-university.example', '+91 91000 20024','Computer Science','B.Tech CSE',5,'A', current_date - 900,'active'),
    ('DU26-025','Manav Sethi',    'manav.sethi@students.demo-university.example',    '+91 91000 20025','Computer Science','B.Tech CSE',5,'B', current_date - 900,'graduated')
  on conflict (student_id) do nothing;

  -- Enrolments: same semester, and either the student's own department or a
  -- shared foundation department (Mathematics / Business).
  insert into public.student_courses (student_id, course_id)
  select s.id, c.id
  from public.students s
  join public.courses c
    on c.semester = s.semester
   and (c.department = s.department or c.department in ('Mathematics', 'Business'))
  where s.student_id like 'DU26-%'
    and not (c.department = 'Business' and s.department not in ('Business'))
  on conflict (student_id, course_id) do nothing;

  -- Timetable (conflict-free) ---------------------------------------------
  insert into public.timetable (course_id, day_of_week, start_time, end_time, room)
  select c.id, v.d, v.st::time, v.en::time, v.room
  from (values
    ('CS101',1,'09:00','10:00','A-101'), ('CS101',3,'09:00','10:00','A-101'),
    ('CS201',2,'10:00','11:00','A-102'), ('CS201',4,'10:00','11:00','A-102'),
    ('CS301',1,'11:00','12:00','Lab-2'), ('CS301',3,'11:00','12:00','Lab-2'), ('CS301',6,'09:00','11:00','Lab-2'),
    ('CS305',2,'14:00','15:30','Lab-1'),
    ('EC201',1,'10:00','11:30','B-201'), ('EC201',5,'10:00','11:30','B-201'),
    ('ME101',2,'09:00','10:00','C-101'),
    ('BA101',4,'14:00','15:00','D-105'),
    ('MA101',5,'09:00','10:00','A-101'), ('MA101',3,'13:00','14:00','A-103')
  ) as v(code,d,st,en,room)
  join public.courses c on c.course_code = v.code;

  -- Attendance: the 8 most recent weekdays for every enrolment. A hash makes
  -- the pattern deterministic; CS301 is deliberately weaker so the dashboard
  -- insight "course below threshold" has something to show.
  insert into public.attendance (student_id, course_id, attendance_date, status)
  select sc.student_id, sc.course_id, d.day,
    case
      when h < (case when c.course_code = 'CS301' then 50 else 78 end) then 'present'
      when h < (case when c.course_code = 'CS301' then 62 else 90 end) then 'late'
      else 'absent'
    end
  from public.student_courses sc
  join public.courses c on c.id = sc.course_id
  join public.students s on s.id = sc.student_id
  cross join lateral (
    select g::date as day
    from generate_series(current_date - 14, current_date - 1, interval '1 day') g
    where extract(isodow from g) between 1 and 5
    order by g desc
    limit 8
  ) d
  cross join lateral (
    select (abs(hashtext(s.student_id || c.course_code || d.day::text)) % 100) as h
  ) hh(h)
  where s.student_id like 'DU26-%'
  on conflict (student_id, course_id, attendance_date) do nothing;

  -- Assignments (8): some past (overdue / closed), some upcoming ----------
  insert into public.assignments (title, description, course_id, due_date, max_marks, status)
  select v.title, v.descr, c.id, now() + (v.days || ' days')::interval, v.marks, v.status
  from (values
    ('Hello World Programs',        'Write five introductory programs.',                    'CS101', -6, 20, 'closed'),
    ('Array and Loop Practice',     'Solve ten array-manipulation exercises.',              'CS101',  4, 25, 'published'),
    ('Linked List Implementation',  'Implement singly and doubly linked lists.',            'CS201', -2, 30, 'published'),
    ('ER Diagram Design',           'Design an ER diagram for a library system.',           'CS301', -9, 25, 'closed'),
    ('SQL Query Workbook',          'Complete the joins and aggregation workbook.',         'CS301',  6, 40, 'published'),
    ('Portfolio Website',           'Build a responsive personal portfolio.',               'CS305', 10, 50, 'published'),
    ('Logic Gate Simulation',       'Simulate a 4-bit adder.',                              'EC201', -1, 20, 'published'),
    ('Calculus Problem Set 1',      'Differentiation and integration problems.',            'MA101',  2, 20, 'published')
  ) as v(title,descr,code,days,marks,status)
  join public.courses c on c.course_code = v.code;

  -- Submissions for assignments whose due date has passed -----------------
  insert into public.submissions (assignment_id, student_id, submitted_at, status, marks_obtained, feedback)
  select a.id, sc.student_id, a.due_date - interval '1 day',
         case when (abs(hashtext(sc.student_id::text || a.id::text)) % 10) < 7 then 'graded' else 'submitted' end,
         case when (abs(hashtext(sc.student_id::text || a.id::text)) % 10) < 7
              then round(a.max_marks * (0.55 + (abs(hashtext(a.id::text || sc.student_id::text)) % 40) / 100.0)) end,
         case when (abs(hashtext(sc.student_id::text || a.id::text)) % 10) < 7 then 'Good work.' end
  from public.assignments a
  join public.student_courses sc on sc.course_id = a.course_id
  where a.due_date < now()
    and (abs(hashtext(a.id::text || sc.student_id::text)) % 10) < 8   -- ~80% of students submit
  on conflict (assignment_id, student_id) do nothing;

  -- Announcements ----------------------------------------------------------
  insert into public.announcements (title, description, category, priority, author_id, published_at, status)
  select v.title, v.descr, v.cat, v.pri, admin_profile, now() - (v.ago || ' hours')::interval, 'published'
  from (values
    ('Mid-semester examinations schedule released', 'The mid-semester examination timetable is now available. Please check your course timetable and report clashes to the examination cell.', 'exams', 'urgent', 6),
    ('Library timings extended',                    'The central library will remain open until 9 PM on weekdays during the examination period.',                                    'administrative', 'informational', 30),
    ('Guest lecture on cloud databases',            'Join us on Friday for a guest lecture on cloud-native databases in Seminar Hall 1.',                                           'events', 'important', 52),
    ('Assignment submission reminder',              'Students of CS301 and MA101 are reminded that assignments are due soon. Late submissions will be marked down.',                'academic', 'important', 76),
    ('Campus network maintenance',                  'Wi-Fi may be intermittently unavailable on Sunday between 2 AM and 5 AM due to scheduled maintenance.',                        'general', 'informational', 120),
    ('Annual tech fest registrations open',         'Registrations for the annual tech fest are now open. Teams of up to four students may participate.',                           'events', 'informational', 200)
  ) as v(title,descr,cat,pri,ago);

  raise notice 'CampusSphere demo data inserted.';
end $$;
