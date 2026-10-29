import { run, supabase } from './db'
import { sanitizeSearch } from '../utils/constants'

export interface SearchHit { type: 'Student' | 'Faculty' | 'Course'; id: string; title: string; subtitle: string; link: string }

export async function globalSearch(term: string): Promise<SearchHit[]> {
  const s = sanitizeSearch(term)
  if (s.length < 2) return []
  const [students, faculty, courses] = await Promise.all([
    run<{ id: string; student_id: string; full_name: string; department: string }[]>(
      supabase.from('students').select('id, student_id, full_name, department').or(`full_name.ilike.%${s}%,student_id.ilike.%${s}%,email.ilike.%${s}%`).limit(5)),
    run<{ id: string; faculty_id: string; full_name: string; department: string }[]>(
      supabase.from('faculty').select('id, faculty_id, full_name, department').or(`full_name.ilike.%${s}%,faculty_id.ilike.%${s}%,email.ilike.%${s}%`).limit(5)),
    run<{ id: string; course_code: string; title: string; department: string }[]>(
      supabase.from('courses').select('id, course_code, title, department').or(`course_code.ilike.%${s}%,title.ilike.%${s}%`).limit(5)),
  ])
  return [
    ...students.map((r): SearchHit => ({ type: 'Student', id: r.id, title: r.full_name, subtitle: `${r.student_id} · ${r.department}`, link: `/students?view=${r.id}` })),
    ...faculty.map((r): SearchHit => ({ type: 'Faculty', id: r.id, title: r.full_name, subtitle: `${r.faculty_id} · ${r.department}`, link: `/faculty?view=${r.id}` })),
    ...courses.map((r): SearchHit => ({ type: 'Course', id: r.id, title: `${r.course_code} - ${r.title}`, subtitle: r.department, link: `/courses?view=${r.id}` })),
  ]
}
