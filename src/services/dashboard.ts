import { countOf, fetchAll, run, supabase } from './db'
import { nowInTimezone, hhmm } from '../utils/date'
import { percentage } from '../utils/attendance'
import { getInsights } from './insights'
import type { Announcement, Assignment, InsightItem, Settings, TimetableEntry } from '../types'

export interface ScheduleRow { entry: TimetableEntry; state: 'completed' | 'in_progress' | 'upcoming' }

export interface DashboardData {
  totalStudents: number
  activeStudents: number
  totalFaculty: number
  activeFaculty: number
  activeCourses: number
  totalCourses: number
  attendancePct: number | null
  attendanceRecorded: number
  assignmentCompletionPct: number | null
  assignmentsTracked: number
  pendingTasks: number
  ungraded: number
  overdueOpen: number
  gradedShare: number | null
  schedule: ScheduleRow[]
  announcements: Announcement[]
  insights: InsightItem[]
  today: string
}

const head = (table: string) => supabase.from(table).select('id', { count: 'exact', head: true })

export async function loadDashboard(settings: Settings): Promise<DashboardData> {
  const now = nowInTimezone(settings.timezone)

  const [totalStudents, activeStudents, totalFaculty, activeFaculty, totalCourses, activeCourses, overall, todays, announcements, assignments, submissions, enrolments, insights] =
    await Promise.all([
      countOf(head('students')),
      countOf(head('students').eq('status', 'active')),
      countOf(head('faculty')),
      countOf(head('faculty').eq('status', 'active')),
      countOf(head('courses')),
      countOf(head('courses').eq('status', 'active')),
      run<{ recorded: number; percentage: number | null }>(supabase.from('v_attendance_overall').select('recorded, percentage').single()),
      run<TimetableEntry[]>(supabase.from('timetable').select('*, courses(id, course_code, title), faculty(id, full_name)').eq('day_of_week', now.isoDow).order('start_time')),
      run<Announcement[]>(supabase.from('announcements').select('*, profiles(full_name)').eq('status', 'published').order('published_at', { ascending: false }).limit(4)),
      run<Pick<Assignment, 'id' | 'course_id' | 'due_date' | 'status'>[]>(supabase.from('assignments').select('id, course_id, due_date, status').neq('status', 'draft')),
      fetchAll<{ assignment_id: string; status: string }>((a, b) => supabase.from('submissions').select('assignment_id, status').range(a, b)),
      fetchAll<{ course_id: string }>((a, b) => supabase.from('student_courses').select('course_id').range(a, b)),
      getInsights(settings),
    ])

  // Assignment completion = submissions received / submissions expected, over assignments whose due date has passed.
  const enrolledPerCourse = new Map<string, number>()
  enrolments.forEach((e) => enrolledPerCourse.set(e.course_id, (enrolledPerCourse.get(e.course_id) ?? 0) + 1))
  const due = assignments.filter((a) => new Date(a.due_date) < new Date())
  const dueIds = new Set(due.map((a) => a.id))
  const expected = due.reduce((s, a) => s + (enrolledPerCourse.get(a.course_id) ?? 0), 0)
  const received = submissions.filter((s) => dueIds.has(s.assignment_id) && s.status !== 'missing').length

  const ungraded = submissions.filter((s) => s.status === 'submitted' || s.status === 'late').length
  const graded = submissions.filter((s) => s.status === 'graded').length
  const overdueOpen = assignments.filter((a) => a.status === 'published' && new Date(a.due_date) < new Date()).length

  const schedule: ScheduleRow[] = todays.map((entry) => {
    const start = hhmm(entry.start_time), end = hhmm(entry.end_time)
    return { entry, state: now.time >= end ? 'completed' : now.time >= start ? 'in_progress' : 'upcoming' }
  })

  return {
    totalStudents, activeStudents, totalFaculty, activeFaculty, totalCourses, activeCourses,
    attendancePct: overall.percentage === null ? null : Number(overall.percentage),
    attendanceRecorded: Number(overall.recorded ?? 0),
    assignmentCompletionPct: percentage(received, expected),
    assignmentsTracked: due.length,
    pendingTasks: ungraded + overdueOpen, ungraded, overdueOpen,
    gradedShare: percentage(graded, graded + ungraded),
    schedule, announcements, insights, today: now.date,
  }
}
