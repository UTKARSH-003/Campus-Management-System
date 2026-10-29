import { countOf, fetchAll, supabase } from './db'
import type { Assignment, Course, Faculty, Student } from '../types'

export interface ReportFilters { department: string; semester: string; courseId: string; from: string; to: string }
export interface Slice { name: string; value: number }

const tally = <T,>(rows: T[], key: (r: T) => string): Slice[] => {
  const m = new Map<string, number>()
  rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + 1))
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

export async function loadReports(f: ReportFilters) {
  const deptFilter = <Q extends { eq: (c: string, v: string) => Q }>(q: Q) => (f.department ? q.eq('department', f.department) : q)

  const attendanceCount = (status: string) => {
    let q = supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('status', status)
    if (f.courseId) q = q.eq('course_id', f.courseId)
    if (f.from) q = q.gte('attendance_date', f.from)
    if (f.to) q = q.lte('attendance_date', f.to)
    return countOf(q)
  }

  const [students, courses, faculty, assignments, present, late, absent] = await Promise.all([
    fetchAll<Pick<Student, 'department' | 'semester' | 'status'>>((a, b) => {
      let q = supabase.from('students').select('department, semester, status').range(a, b)
      if (f.department) q = q.eq('department', f.department)
      if (f.semester) q = q.eq('semester', Number(f.semester))
      return q
    }),
    fetchAll<Course>((a, b) => {
      let q = supabase.from('courses').select('course_code, title, department, semester, status, student_courses(count)').range(a, b)
      q = deptFilter(q)
      if (f.semester) q = q.eq('semester', Number(f.semester))
      return q
    }),
    fetchAll<Pick<Faculty, 'department' | 'status' | 'designation'>>((a, b) => deptFilter(supabase.from('faculty').select('department, status, designation').range(a, b))),
    fetchAll<Pick<Assignment, 'title' | 'status' | 'due_date' | 'course_id'> & { courses: { course_code: string; department: string } | null }>((a, b) =>
      supabase.from('assignments').select('title, status, due_date, course_id, courses(course_code, department)').range(a, b)),
    attendanceCount('present'), attendanceCount('late'), attendanceCount('absent'),
  ])

  const now = Date.now()
  const asg = assignments.filter((a) => (!f.department || a.courses?.department === f.department) && (!f.courseId || a.course_id === f.courseId))
  const assignmentStatus = tally(asg, (a) =>
    a.status === 'draft' ? 'Draft' : a.status === 'closed' ? 'Closed' : new Date(a.due_date).getTime() < now ? 'Overdue (open)' : 'Upcoming')

  return {
    enrollmentByDepartment: tally(students, (s) => s.department),
    attendance: [
      { name: 'Present', value: present }, { name: 'Late', value: late }, { name: 'Absent', value: absent },
    ] as Slice[],
    courseEnrollment: courses
      .map((c) => ({ name: c.course_code, title: c.title, value: c.student_courses?.[0]?.count ?? 0 }))
      .sort((a, b) => b.value - a.value),
    facultyByDepartment: tally(faculty, (x) => x.department),
    assignmentStatus,
  }
}

export type ReportData = Awaited<ReturnType<typeof loadReports>>
