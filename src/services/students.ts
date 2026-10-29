import { fetchAll, run, runPaged, supabase, type ListFilters } from './db'
import { sanitizeSearch } from '../utils/constants'
import type { AttendanceSummary, Enrolment, Student, Submission } from '../types'
import { num, percentage } from '../utils/attendance'

export interface StudentFilters extends ListFilters { department: string; semester: string; status: string }
export type StudentInput = Omit<Student, 'id'>

export async function listStudents(f: StudentFilters) {
  let q = supabase.from('students').select('*', { count: 'exact' })
  const s = sanitizeSearch(f.search)
  if (s) q = q.or(`full_name.ilike.%${s}%,student_id.ilike.%${s}%,email.ilike.%${s}%`)
  if (f.department) q = q.eq('department', f.department)
  if (f.semester) q = q.eq('semester', Number(f.semester))
  if (f.status) q = q.eq('status', f.status)
  q = q.order(f.sort, { ascending: f.asc }).range((f.page - 1) * f.pageSize, f.page * f.pageSize - 1)
  return runPaged<Student>(q)
}

export const getStudent = (id: string) => run<Student>(supabase.from('students').select('*').eq('id', id).single())

export const createStudent = (v: StudentInput) => run<Student>(supabase.from('students').insert(v).select().single())
export const updateStudent = (id: string, v: StudentInput) => run<Student>(supabase.from('students').update(v).eq('id', id).select().single())
export const deleteStudent = (id: string) => run(supabase.from('students').delete().eq('id', id))

export const listActiveStudents = () =>
  fetchAll<Pick<Student, 'id' | 'student_id' | 'full_name'>>((a, b) =>
    supabase.from('students').select('id, student_id, full_name').eq('status', 'active').order('full_name').range(a, b))

export interface CourseAttendanceRow extends AttendanceSummary { course_id: string; course_code: string; title: string }

export async function getStudentDetail(id: string) {
  const [student, enrolments, attRows, submissions] = await Promise.all([
    getStudent(id),
    run<Enrolment[]>(supabase.from('student_courses').select('*, courses(id, course_code, title)').eq('student_id', id)),
    run<Record<string, unknown>[]>(supabase.from('v_student_course_attendance').select('*').eq('student_id', id)),
    run<(Submission & { assignments: { title: string; max_marks: number; courses: { course_code: string } | null } | null })[]>(
      supabase.from('submissions').select('*, assignments(title, max_marks, courses(course_code))').eq('student_id', id)),
  ])
  const perCourse: CourseAttendanceRow[] = enrolments.map((e) => {
    const r = attRows.find((a) => a.course_id === e.course_id)
    return {
      course_id: e.course_id, course_code: e.courses?.course_code ?? '', title: e.courses?.title ?? '',
      recorded: num(r?.recorded), attended: num(r?.attended), late: num(r?.late), absent: num(r?.absent),
      percentage: r ? (r.percentage === null ? null : Number(r.percentage)) : null,
    }
  })
  const recorded = perCourse.reduce((s, c) => s + c.recorded, 0)
  const attended = perCourse.reduce((s, c) => s + c.attended, 0)
  const overall: AttendanceSummary = {
    recorded, attended,
    late: perCourse.reduce((s, c) => s + c.late, 0),
    absent: perCourse.reduce((s, c) => s + c.absent, 0),
    percentage: percentage(attended, recorded),
  }
  return { student, enrolments, perCourse, overall, submissions }
}
