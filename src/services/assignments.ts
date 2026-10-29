import { run, runPaged, supabase, type ListFilters } from './db'
import { sanitizeSearch } from '../utils/constants'
import type { Assignment, Submission } from '../types'

export interface AssignmentFilters extends ListFilters { courseId: string; status: string; timing: string }
export type AssignmentInput = Pick<Assignment, 'title' | 'description' | 'course_id' | 'faculty_id' | 'due_date' | 'max_marks' | 'status'>

export async function listAssignments(f: AssignmentFilters) {
  let q = supabase.from('assignments').select('*, courses(id, course_code, title), faculty(id, full_name)', { count: 'exact' })
  const s = sanitizeSearch(f.search)
  if (s) q = q.ilike('title', `%${s}%`)
  if (f.courseId) q = q.eq('course_id', f.courseId)
  if (f.status) q = q.eq('status', f.status)
  const now = new Date().toISOString()
  if (f.timing === 'overdue') q = q.lt('due_date', now).neq('status', 'draft')
  if (f.timing === 'upcoming') q = q.gte('due_date', now).neq('status', 'draft')
  q = q.order(f.sort, { ascending: f.asc }).range((f.page - 1) * f.pageSize, f.page * f.pageSize - 1)
  return runPaged<Assignment>(q)
}

export const getAssignment = (id: string) =>
  run<Assignment>(supabase.from('assignments').select('*, courses(id, course_code, title), faculty(id, full_name)').eq('id', id).single())
export const createAssignment = (v: AssignmentInput) => run(supabase.from('assignments').insert(v))
export const updateAssignment = (id: string, v: AssignmentInput) => run(supabase.from('assignments').update(v).eq('id', id))
export const deleteAssignment = (id: string) => run(supabase.from('assignments').delete().eq('id', id))

export const listSubmissions = (assignmentId: string) =>
  run<Submission[]>(supabase.from('submissions').select('*, students(student_id, full_name)').eq('assignment_id', assignmentId).order('submitted_at'))

export type SubmissionInput = Pick<Submission, 'assignment_id' | 'student_id' | 'status' | 'marks_obtained' | 'feedback'>

// Unique (assignment, student) key -> upsert edits an existing submission. The DB trigger enforces marks <= max.
export const saveSubmission = (v: SubmissionInput) =>
  run(supabase.from('submissions').upsert(v, { onConflict: 'assignment_id,student_id' }))
export const deleteSubmission = (id: string) => run(supabase.from('submissions').delete().eq('id', id))
