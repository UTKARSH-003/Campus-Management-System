import { run, supabase } from './db'
import type { TimetableEntry } from '../types'

export interface TimetableFilters { courseId: string; facultyId: string; day: string }
export type TimetableInput = Pick<TimetableEntry, 'course_id' | 'faculty_id' | 'day_of_week' | 'start_time' | 'end_time' | 'room' | 'section'>

export function listTimetable(f: TimetableFilters) {
  let q = supabase.from('timetable').select('*, courses(id, course_code, title), faculty(id, full_name)')
    .order('day_of_week').order('start_time')
  if (f.courseId) q = q.eq('course_id', f.courseId)
  if (f.facultyId) q = q.eq('faculty_id', f.facultyId)
  if (f.day) q = q.eq('day_of_week', Number(f.day))
  return run<TimetableEntry[]>(q)
}

// Overlap / invalid-range protection is enforced by PostgreSQL exclusion + check constraints.
export const createEntry = (v: TimetableInput) => run(supabase.from('timetable').insert(v))
export const updateEntry = (id: string, v: TimetableInput) => run(supabase.from('timetable').update(v).eq('id', id))
export const deleteEntry = (id: string) => run(supabase.from('timetable').delete().eq('id', id))
