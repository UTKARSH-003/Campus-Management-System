import { run, supabase } from './db'
import { fmtPct } from '../utils/attendance'
import type { Announcement, Assignment, Course, InsightItem, Settings } from '../types'

const DAY = 86400000

/**
 * Rule-based "Campus Insights" (no AI model involved). Rules:
 *  1. Course attendance below the configured threshold (below the critical threshold = urgent)
 *  2. Published assignments overdue
 *  3. Published assignments due within 3 days
 *  4. Urgent announcements from the last 7 days
 */
export async function getInsights(settings: Settings): Promise<InsightItem[]> {
  const now = Date.now()
  const [courseAtt, courses, assignments, announcements] = await Promise.all([
    run<{ course_id: string; percentage: number | null; recorded: number }[]>(supabase.from('v_course_attendance').select('course_id, percentage, recorded')),
    run<Pick<Course, 'id' | 'course_code' | 'title'>[]>(supabase.from('courses').select('id, course_code, title')),
    run<Pick<Assignment, 'id' | 'title' | 'due_date' | 'status'>[]>(
      supabase.from('assignments').select('id, title, due_date, status').eq('status', 'published').order('due_date')),
    run<Pick<Announcement, 'id' | 'title' | 'description' | 'published_at'>[]>(
      supabase.from('announcements').select('id, title, description, published_at').eq('priority', 'urgent').eq('status', 'published')
        .gte('published_at', new Date(now - 7 * DAY).toISOString()).order('published_at', { ascending: false }).limit(3)),
  ])

  const items: InsightItem[] = []

  for (const r of courseAtt) {
    if (r.percentage === null || r.recorded === 0) continue
    const p = Number(r.percentage)
    if (p >= settings.attendance_threshold) continue
    const c = courses.find((x) => x.id === r.course_id)
    if (!c) continue
    items.push({
      id: `att-${c.id}`,
      title: `${c.course_code} attendance is ${fmtPct(p)}`,
      description: `${c.title} is below the ${settings.attendance_threshold}% attendance threshold.`,
      priority: p < settings.attendance_critical_threshold ? 'urgent' : 'warning',
      timestamp: new Date().toISOString(),
      link: `/attendance?tab=summary&course=${c.id}`,
    })
  }

  for (const a of assignments) {
    const due = new Date(a.due_date).getTime()
    if (due < now) {
      items.push({ id: `od-${a.id}`, title: `Overdue: ${a.title}`, description: 'The due date has passed and the assignment is still open.', priority: 'urgent', timestamp: a.due_date, link: `/assignments?view=${a.id}` })
    } else if (due - now <= 3 * DAY) {
      items.push({ id: `due-${a.id}`, title: `Due soon: ${a.title}`, description: 'Deadline within the next 3 days.', priority: 'warning', timestamp: a.due_date, link: `/assignments?view=${a.id}` })
    }
  }

  for (const n of announcements) {
    items.push({ id: `ann-${n.id}`, title: n.title, description: n.description.length > 120 ? `${n.description.slice(0, 117).trimEnd()}...` : n.description, priority: 'urgent', timestamp: n.published_at, link: `/announcements?view=${n.id}` })
  }

  const rank = { urgent: 0, warning: 1, info: 2 }
  return items.sort((a, b) => rank[a.priority] - rank[b.priority])
}
