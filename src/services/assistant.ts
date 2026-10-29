import { countOf, run, supabase } from './db'
import { getSettings } from './settings'
import { nowInTimezone, hhmm, formatDate } from '../utils/date'
import { fmtPct } from '../utils/attendance'
import type { Announcement, Assignment, TimetableEntry } from '../types'

export interface AssistantReply { text: string; lines?: string[]; link?: { to: string; label: string } }

export const SUGGESTIONS = [
  'How many students are registered?',
  'How many faculty members are there?',
  "Show today's classes",
  'Which assignments are overdue?',
  'What is the average attendance?',
  'Show recent announcements',
]

type Intent = { test: RegExp; run: () => Promise<AssistantReply> }

const intents: Intent[] = [
  {
    test: /(how many|number of|total|count).*student|student.*(count|registered|enrolled|total)/i,
    run: async () => {
      const [all, active] = await Promise.all([
        countOf(supabase.from('students').select('id', { count: 'exact', head: true })),
        countOf(supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active')),
      ])
      return { text: `There are ${all} students registered, ${active} of them active.`, link: { to: '/students', label: 'Open Students' } }
    },
  },
  {
    test: /(how many|number of|total|count).*(faculty|teacher|professor|staff)|(faculty|teacher|professor).*(count|total)/i,
    run: async () => {
      const [all, active] = await Promise.all([
        countOf(supabase.from('faculty').select('id', { count: 'exact', head: true })),
        countOf(supabase.from('faculty').select('id', { count: 'exact', head: true }).eq('status', 'active')),
      ])
      return { text: `There are ${all} faculty members, ${active} currently active.`, link: { to: '/faculty', label: 'Open Faculty' } }
    },
  },
  {
    test: /(today|todays|today's).*(class|lecture|schedule|timetable)|(class|lecture|schedule).*today/i,
    run: async () => {
      const s = await getSettings()
      const now = nowInTimezone(s.timezone)
      const rows = await run<TimetableEntry[]>(
        supabase.from('timetable').select('*, courses(course_code, title), faculty(full_name)').eq('day_of_week', now.isoDow).order('start_time'))
      if (rows.length === 0) return { text: 'There are no classes scheduled for today.', link: { to: '/timetable', label: 'Open Timetable' } }
      return {
        text: `${rows.length} class${rows.length > 1 ? 'es' : ''} scheduled today:`,
        lines: rows.map((r) => `${hhmm(r.start_time)}-${hhmm(r.end_time)} · ${r.courses?.course_code} ${r.courses?.title} · ${r.room}`),
        link: { to: '/timetable', label: 'Open Timetable' },
      }
    },
  },
  {
    test: /overdue|late assignment|past due/i,
    run: async () => {
      const rows = await run<(Pick<Assignment, 'title' | 'due_date'> & { courses: { course_code: string } | null })[]>(
        supabase.from('assignments').select('title, due_date, courses(course_code)').eq('status', 'published').lt('due_date', new Date().toISOString()).order('due_date'))
      if (rows.length === 0) return { text: 'No open assignments are overdue.', link: { to: '/assignments', label: 'Open Assignments' } }
      return {
        text: `${rows.length} assignment${rows.length > 1 ? 's are' : ' is'} overdue:`,
        lines: rows.map((r) => `${r.courses?.course_code ?? ''} · ${r.title} (due ${formatDate(r.due_date)})`),
        link: { to: '/assignments?timing=overdue', label: 'Open Assignments' },
      }
    },
  },
  {
    test: /attendance/i,
    run: async () => {
      const o = await run<{ recorded: number; percentage: number | null }>(supabase.from('v_attendance_overall').select('recorded, percentage').single())
      return {
        text: o.percentage === null
          ? 'No attendance has been recorded yet.'
          : `Average attendance is ${fmtPct(Number(o.percentage))} across ${o.recorded} recorded entries (present and late count as attended).`,
        link: { to: '/attendance', label: 'Open Attendance' },
      }
    },
  },
  {
    test: /announcement|notice|news/i,
    run: async () => {
      const rows = await run<Announcement[]>(supabase.from('announcements').select('id, title, priority, published_at').eq('status', 'published').order('published_at', { ascending: false }).limit(4))
      if (rows.length === 0) return { text: 'There are no announcements yet.', link: { to: '/announcements', label: 'Open Announcements' } }
      return { text: 'Most recent announcements:', lines: rows.map((r) => `${r.title} (${r.priority}, ${formatDate(r.published_at)})`), link: { to: '/announcements', label: 'Open Announcements' } }
    },
  },
]

/** Rule-based intent matching over live Supabase data. No external AI service is used. */
export async function askAssistant(question: string): Promise<AssistantReply> {
  const hit = intents.find((i) => i.test.test(question))
  if (!hit) {
    return {
      text: "Sorry, I only understand a few built-in questions (I use simple rules, not an AI model). Try one of these:",
      lines: SUGGESTIONS,
    }
  }
  return hit.run()
}
