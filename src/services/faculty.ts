import { run, runPaged, supabase, type ListFilters } from './db'
import { sanitizeSearch } from '../utils/constants'
import type { Course, Faculty } from '../types'

export interface FacultyFilters extends ListFilters { department: string; status: string }
export type FacultyInput = Omit<Faculty, 'id'>

export async function listFaculty(f: FacultyFilters) {
  let q = supabase.from('faculty').select('*', { count: 'exact' })
  const s = sanitizeSearch(f.search)
  if (s) q = q.or(`full_name.ilike.%${s}%,faculty_id.ilike.%${s}%,email.ilike.%${s}%`)
  if (f.department) q = q.eq('department', f.department)
  if (f.status) q = q.eq('status', f.status)
  q = q.order(f.sort, { ascending: f.asc }).range((f.page - 1) * f.pageSize, f.page * f.pageSize - 1)
  return runPaged<Faculty>(q)
}

export const getFaculty = (id: string) => run<Faculty>(supabase.from('faculty').select('*').eq('id', id).single())
export const createFaculty = (v: FacultyInput) => run<Faculty>(supabase.from('faculty').insert(v).select().single())
export const updateFaculty = (id: string, v: FacultyInput) => run<Faculty>(supabase.from('faculty').update(v).eq('id', id).select().single())
export const deleteFaculty = (id: string) => run(supabase.from('faculty').delete().eq('id', id))

export const listCoursesOfFaculty = (id: string) =>
  run<Course[]>(supabase.from('courses').select('id, course_code, title, semester, credits, status, department, faculty_id, description').eq('faculty_id', id).order('course_code'))

export const listFacultyLite = () =>
  run<Pick<Faculty, 'id' | 'faculty_id' | 'full_name' | 'status'>[]>(supabase.from('faculty').select('id, faculty_id, full_name, status').order('full_name'))
