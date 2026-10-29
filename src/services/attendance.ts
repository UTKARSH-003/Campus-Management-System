import { fetchAll, run, supabase } from './db'
import { num } from '../utils/attendance'
import type { AttendanceRecord, AttendanceStatus, AttendanceSummary, Course, Student } from '../types'

export interface SheetRow { student: Pick<Student, 'id' | 'student_id' | 'full_name' | 'status'>; status: AttendanceStatus | null }

/** Students enrolled in the course plus any attendance already saved for the date. */
export async function loadSheet(courseId: string, date: string): Promise<SheetRow[]> {
  const [enrol, saved] = await Promise.all([
    run<{ students: SheetRow['student'] }[]>(
      supabase.from('student_courses').select('students(id, student_id, full_name, status)').eq('course_id', courseId)),
    run<Pick<AttendanceRecord, 'student_id' | 'status'>[]>(
      supabase.from('attendance').select('student_id, status').eq('course_id', courseId).eq('attendance_date', date)),
  ])
  const byStudent = new Map(saved.map((r) => [r.student_id, r.status]))
  return enrol
    .map((e) => e.students)
    .filter(Boolean)
    .sort((a, b) => a.student_id.localeCompare(b.student_id))
    .map((student) => ({ student, status: byStudent.get(student.id) ?? null }))
}

/** Upsert on the unique (student, course, date) key: re-saving edits instead of duplicating. */
export const saveSheet = (courseId: string, date: string, rows: { studentId: string; status: AttendanceStatus }[]) =>
  run(supabase.from('attendance').upsert(
    rows.map((r) => ({ student_id: r.studentId, course_id: courseId, attendance_date: date, status: r.status })),
    { onConflict: 'student_id,course_id,attendance_date' }))

export interface HistoryFilters { courseId: string; from: string; to: string }

export async function listHistory(f: HistoryFilters) {
  return fetchAll<AttendanceRecord>((a, b) => {
    let q = supabase.from('attendance')
      .select('*, students(student_id, full_name), courses(course_code, title)')
      .order('attendance_date', { ascending: false }).order('id').range(a, b)
    if (f.courseId) q = q.eq('course_id', f.courseId)
    if (f.from) q = q.gte('attendance_date', f.from)
    if (f.to) q = q.lte('attendance_date', f.to)
    return q
  })
}

const toSummary = (r: Record<string, unknown>): AttendanceSummary => ({
  recorded: num(r.recorded), attended: num(r.attended), late: num(r.late), absent: num(r.absent),
  percentage: r.percentage === null || r.percentage === undefined ? null : Number(r.percentage),
})

export interface CourseSummaryRow extends AttendanceSummary { course: Pick<Course, 'id' | 'course_code' | 'title'>; sessions: number }

export async function courseSummaries(): Promise<CourseSummaryRow[]> {
  const [courses, rows] = await Promise.all([
    run<Pick<Course, 'id' | 'course_code' | 'title'>[]>(supabase.from('courses').select('id, course_code, title').order('course_code')),
    run<Record<string, unknown>[]>(supabase.from('v_course_attendance').select('*')),
  ])
  return courses.map((course) => {
    const r = rows.find((x) => x.course_id === course.id)
    return { course, sessions: num(r?.sessions), ...toSummary(r ?? {}) }
  })
}

export interface StudentSummaryRow extends AttendanceSummary { student: Pick<Student, 'id' | 'student_id' | 'full_name'> }

export async function studentSummaries(courseId: string): Promise<StudentSummaryRow[]> {
  const [enrol, rows] = await Promise.all([
    run<{ students: StudentSummaryRow['student'] }[]>(supabase.from('student_courses').select('students(id, student_id, full_name)').eq('course_id', courseId)),
    run<Record<string, unknown>[]>(supabase.from('v_student_course_attendance').select('*').eq('course_id', courseId)),
  ])
  return enrol.map((e) => e.students).filter(Boolean).sort((a, b) => a.student_id.localeCompare(b.student_id))
    .map((student) => ({ student, ...toSummary(rows.find((r) => r.student_id === student.id) ?? {}) }))
}
