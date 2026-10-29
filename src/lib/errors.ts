import type { PostgrestError } from '@supabase/supabase-js'

export class AppError extends Error {}

/** Turn a PostgreSQL / PostgREST error into a message an administrator can act on. */
export function friendlyMessage(error: { code?: string; message?: string; details?: string | null }): string {
  const msg = error.message ?? 'Unexpected error'
  const detail = `${msg} ${error.details ?? ''}`

  if (detail.includes('timetable_no_room_overlap')) return 'That room is already booked at an overlapping time on this day.'
  if (detail.includes('timetable_no_faculty_overlap')) return 'That faculty member already teaches another class at an overlapping time on this day.'
  if (detail.includes('timetable_valid_range')) return 'End time must be later than start time.'
  if (detail.includes('students_student_id_key')) return 'A student with this Student ID already exists.'
  if (detail.includes('students_email_key')) return 'A student with this email already exists.'
  if (detail.includes('faculty_faculty_id_key')) return 'A faculty member with this Faculty ID already exists.'
  if (detail.includes('faculty_email_key')) return 'A faculty member with this email already exists.'
  if (detail.includes('courses_course_code_key')) return 'A course with this code already exists.'
  if (detail.includes('student_courses_unique')) return 'This student is already enrolled in the course.'
  if (detail.includes('attendance_unique')) return 'Attendance for this student, course and date already exists.'
  if (detail.includes('submissions_unique')) return 'A submission for this student and assignment already exists.'

  switch (error.code) {
    case '23505':
      return 'A record with the same unique value already exists.'
    case '23503':
      if (/violates RESTRICT|still referenced/i.test(detail))
        return 'This record is linked to other data (for example enrolments, attendance or courses) and cannot be deleted. Set its status to Inactive instead.'
      return 'A related record does not exist.'
    case '23514':
      // Custom trigger messages are already readable; table check constraints are not.
      if (!/violates check constraint/.test(msg)) return msg
      return 'One of the values is outside the allowed range or format.'
    case '42501':
      return 'You do not have permission to do that. Administrator access is required.'
    case 'PGRST116':
      return 'The record could not be found.'
    default:
      if (/row-level security/i.test(msg)) return 'You do not have permission to do that. Administrator access is required.'
      return msg
  }
}

export function toError(error: PostgrestError | Error): AppError {
  return new AppError(friendlyMessage(error))
}

export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.'
}
