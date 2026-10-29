export const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Business', 'Mathematics', 'Civil']
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
export const STUDENT_STATUSES = ['active', 'inactive', 'graduated', 'suspended'] as const
export const FACULTY_STATUSES = ['active', 'on_leave', 'retired', 'inactive'] as const
export const COURSE_STATUSES = ['active', 'inactive', 'archived'] as const
export const ASSIGNMENT_STATUSES = ['draft', 'published', 'closed'] as const
export const SUBMISSION_STATUSES = ['submitted', 'late', 'graded', 'missing'] as const
export const ANNOUNCEMENT_CATEGORIES = ['general', 'academic', 'exams', 'events', 'administrative'] as const
export const PRIORITIES = ['informational', 'important', 'urgent'] as const
export const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Visiting Faculty']

export const label = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
export const COURSE_CODE_RE = /^[A-Z]{2,6}[0-9]{2,4}[A-Z]?$/

/** Strip characters that have special meaning inside a PostgREST .or() / ilike filter. */
export const sanitizeSearch = (q: string) => q.replace(/[,()%*\\]/g, ' ').trim()

export const PAGE_SIZE = 10
