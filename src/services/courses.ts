import { fetchAll, run, runPaged, supabase, type ListFilters } from './db'
import { sanitizeSearch } from '../utils/constants'
import type { Course, Enrolment } from '../types'

export interface CourseFilters extends ListFilters { department: string; semester: string; status: string }
export type CourseInput = Omit<Course, 'id' | 'faculty' | 'student_courses'>

export async function listCourses(f: CourseFilters) {
  let q = supabase.from('courses').select('*, faculty(id, full_name), student_courses(count)', { count: 'exact' })
  const s = sanitizeSearch(f.search)
  if (s) q = q.or(`course_code.ilike.%${s}%,title.ilike.%${s}%`)
  if (f.department) q = q.eq('department', f.department)
  if (f.semester) q = q.eq('semester', Number(f.semester))
  if (f.status) q = q.eq('status', f.status)
  q = q.order(f.sort, { ascending: f.asc }).range((f.page - 1) * f.pageSize, f.page * f.pageSize - 1)
  return runPaged<Course>(q)
}

export const getCourse = (id: string) =>
  run<Course>(supabase.from('courses').select('*, faculty(id, full_name), student_courses(count)').eq('id', id).single())
export const createCourse = (v: CourseInput) => run<Course>(supabase.from('courses').insert(v).select().single())
export const updateCourse = (id: string, v: CourseInput) => run<Course>(supabase.from('courses').update(v).eq('id', id).select().single())
export const deleteCourse = (id: string) => run(supabase.from('courses').delete().eq('id', id))

export const listCoursesLite = () =>
  fetchAll<Pick<Course, 'id' | 'course_code' | 'title' | 'status' | 'faculty_id'>>((a, b) =>
    supabase.from('courses').select('id, course_code, title, status, faculty_id').order('course_code').range(a, b))

export const listEnrolments = (courseId: string) =>
  run<Enrolment[]>(supabase.from('student_courses')
    .select('*, students(id, student_id, full_name, department, semester, status)').eq('course_id', courseId))

export const enrolStudents = (courseId: string, studentIds: string[]) =>
  run(supabase.from('student_courses').insert(studentIds.map((student_id) => ({ student_id, course_id: courseId }))))

export const removeEnrolment = (id: string) => run(supabase.from('student_courses').delete().eq('id', id))
