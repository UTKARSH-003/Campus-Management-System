import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, CalendarClock, CheckCircle2, ClipboardCheck, GraduationCap, Info, Percent, Sparkles, Users } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { useAsync } from '../hooks/useAsync'
import { loadDashboard } from '../services/dashboard'
import { GlassCard } from '../components/ui/GlassCard'
import { MetricCard, ProgressCard } from '../components/dashboard/cards'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/feedback'
import { PriorityBadge, StatusBadge } from '../components/ui/StatusBadge'
import { attendanceTone, fmtPct } from '../utils/attendance'
import { formatDate, hhmm, nowInTimezone } from '../utils/date'
import { Button } from '../components/ui/Button'

export default function Dashboard() {
  const { settings, loading: settingsLoading } = useSettings()
  const navigate = useNavigate()
  // Wait for the real settings (time zone, thresholds) before querying, so the dashboard loads once.
  const { data, error, loading, reload } = useAsync(() => (settingsLoading ? Promise.resolve(null) : loadDashboard(settings)), [settings, settingsLoading])
  const now = nowInTimezone(settings.timezone)
  const prettyDate = new Date(`${now.date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const busy = loading || settingsLoading

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[40px] p-8 text-white lg:p-10"
        style={{ background: 'radial-gradient(circle at top left, #4f46e5 0%, #6366f1 40%, #8b5cf6 100%)' }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-pink-300/20 blur-3xl" aria-hidden />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-widest">CAMPUS OVERVIEW</span>
            <h1 className="font-display mt-4 text-4xl font-extrabold lg:text-5xl">Your campus, connected.</h1>
            <p className="mt-3 max-w-lg text-indigo-100">Manage students, faculty, academic activities, and campus operations from one centralized workspace.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate('/students')} className="!bg-white !text-brand-dark hover:!bg-indigo-50 !shadow-none">View Students</Button>
              <Button onClick={() => navigate('/attendance')} className="!bg-white/15 !text-white hover:!bg-white/25 !shadow-none border border-white/30">Manage Attendance</Button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 lg:justify-self-end">
            <div className="rounded-3xl bg-white/15 p-5 backdrop-blur"><dt className="text-xs font-bold uppercase tracking-wider text-indigo-100">Academic year</dt><dd className="font-display mt-1 text-2xl font-extrabold">{settings.academic_year}</dd></div>
            <div className="rounded-3xl bg-white/15 p-5 backdrop-blur"><dt className="text-xs font-bold uppercase tracking-wider text-indigo-100">Today</dt><dd className="mt-1 text-sm font-bold">{prettyDate}</dd></div>
            <div className="col-span-2 rounded-3xl bg-white/15 p-5 backdrop-blur"><dt className="text-xs font-bold uppercase tracking-wider text-indigo-100">Institution</dt><dd className="mt-1 font-bold">{settings.institution_name}</dd></div>
          </dl>
        </div>
      </section>

      {error && <GlassCard><ErrorState message={error} onRetry={() => void reload()} /></GlassCard>}

      {/* Statistics */}
      <section aria-label="Key statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {busy || !data ? Array.from({ length: 4 }).map((_, i) => <GlassCard key={i}><Skeleton className="mb-4 h-12 w-12" /><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-9 w-20" /></GlassCard>) : (<>
          <MetricCard icon={GraduationCap} tone="indigo" label="Total Students" value={String(data.totalStudents)} hint={`${data.activeStudents} active`} />
          <MetricCard icon={Users} tone="rose" label="Total Faculty" value={String(data.totalFaculty)} hint={`${data.activeFaculty} active`} />
          <MetricCard icon={BookOpen} tone="amber" label="Active Courses" value={String(data.activeCourses)} hint={`of ${data.totalCourses} courses`} />
          <MetricCard icon={Percent} tone="emerald" label="Average Attendance" value={data.attendancePct === null ? '-' : `${data.attendancePct}%`}
            hint={data.attendancePct === null ? 'No attendance data' : `${data.attendanceRecorded} recorded entries`} />
        </>)}
      </section>

      {/* Progress cards */}
      <section aria-label="Progress metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {busy || !data ? Array.from({ length: 4 }).map((_, i) => <GlassCard key={i} className="!p-5"><Skeleton className="h-24 w-full" /></GlassCard>) : (<>
          <ProgressCard label="Attendance rate" value={data.attendancePct === null ? 'No data' : `${data.attendancePct}%`}
            description={data.attendancePct === null ? 'Record attendance to see this metric.' : 'Present + late over all recorded entries.'}
            percent={data.attendancePct}
            color={{ good: '#10b981', warn: '#f59e0b', bad: '#f43f5e', none: '#cbd5e1' }[attendanceTone(data.attendancePct, settings)]} />
          <ProgressCard label="Assignment completion" value={data.assignmentCompletionPct === null ? 'No data' : `${data.assignmentCompletionPct}%`}
            description={data.assignmentCompletionPct === null ? 'No past-due assignments with enrolled students yet.' : `Submissions received for ${data.assignmentsTracked} past-due assignment(s).`}
            percent={data.assignmentCompletionPct} color="#6366f1" />
          <ProgressCard label="Active courses" value={String(data.activeCourses)}
            description={`${data.activeCourses} of ${data.totalCourses} courses are currently active.`}
            percent={data.totalCourses ? Math.round((data.activeCourses / data.totalCourses) * 100) : null} color="#8b5cf6" />
          <ProgressCard label="Pending admin tasks" value={String(data.pendingTasks)}
            description={`${data.ungraded} submission(s) to grade, ${data.overdueOpen} overdue assignment(s) still open.`}
            percent={data.gradedShare} color="#f59e0b" />
        </>)}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Schedule */}
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><CalendarClock className="h-5 w-5 text-brand" aria-hidden />Today's Schedule</h2>
            <Link to="/timetable" className="text-sm font-bold text-brand hover:underline">View Timetable</Link>
          </div>
          {busy || !data ? <Skeleton className="h-40 w-full" /> : data.schedule.length === 0
            ? <EmptyState title="No classes today" message="Nothing is scheduled for today in the timetable." />
            : <ul className="space-y-2">{data.schedule.map(({ entry, state }) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-white/70 p-3 transition-colors hover:bg-brand-light">
                <p className="w-28 shrink-0 text-sm font-extrabold text-brand-dark">{hhmm(entry.start_time)} - {hhmm(entry.end_time)}</p>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{entry.courses?.title} <span className="font-semibold text-muted">({entry.courses?.course_code})</span></p>
                  <p className="truncate text-xs text-muted">{entry.faculty?.full_name ?? 'Faculty not assigned'} · Room {entry.room}</p>
                </div>
                <StatusBadge tone={state === 'completed' ? 'neutral' : state === 'in_progress' ? 'good' : 'info'}>
                  {state === 'completed' ? 'Completed' : state === 'in_progress' ? 'In progress' : 'Upcoming'}
                </StatusBadge>
              </li>))}</ul>}
        </GlassCard>

        {/* Insights */}
        <section aria-labelledby="insights-title" className="rounded-[32px] bg-[#312e81] p-8 text-white">
          <h2 id="insights-title" className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-amber-300" aria-hidden />Campus Insights</h2>
          <p className="mb-4 mt-1 text-xs text-indigo-200">Rule-based observations calculated from your campus records (no AI model is connected).</p>
          {busy || !data ? <Skeleton className="h-40 w-full !bg-white/10" /> : data.insights.length === 0
            ? <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4"><CheckCircle2 className="h-6 w-6 text-emerald-400" aria-hidden /><p className="text-sm font-semibold">All clear: no attendance, deadline or urgent-notice issues right now.</p></div>
            : <ul className="space-y-3">{data.insights.slice(0, 5).map((i) => (
              <li key={i.id} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
                {i.priority === 'urgent' ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" aria-hidden /> : i.priority === 'warning' ? <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold"><span className="sr-only">{i.priority === 'urgent' ? 'Urgent: ' : 'Warning: '}</span>{i.title}</p>
                  <p className="text-xs text-indigo-200">{i.description}</p>
                </div>
                <Link to={i.link} className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">View</Link>
              </li>))}</ul>}
        </section>
      </div>

      {/* Announcements */}
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><ClipboardCheck className="h-5 w-5 text-brand" aria-hidden />Recent Announcements</h2>
          <Link to="/announcements" className="text-sm font-bold text-brand hover:underline">View all</Link>
        </div>
        {busy || !data ? <Skeleton className="h-32 w-full" /> : data.announcements.length === 0
          ? <EmptyState title="No announcements yet" message="Published announcements will appear here." />
          : <ul className="grid gap-3 md:grid-cols-2">{data.announcements.map((a) => (
            <li key={a.id}>
              <button onClick={() => navigate(`/announcements?view=${a.id}`)} className="h-full w-full rounded-2xl bg-white/70 p-4 text-left transition-colors hover:bg-brand-light">
                <div className="mb-2 flex flex-wrap items-center gap-2"><PriorityBadge priority={a.priority} /><span className="text-xs font-semibold capitalize text-muted">{a.category}</span></div>
                <p className="font-bold text-ink">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>
                <p className="mt-2 text-xs text-muted">{a.profiles?.full_name ?? 'Administration'} · {formatDate(a.published_at)}</p>
              </button>
            </li>))}</ul>}
      </GlassCard>
      <p className="text-center text-xs text-muted">Attendance colour bands: {fmtPct(settings.attendance_threshold)}+ good · {settings.attendance_critical_threshold}-{settings.attendance_threshold}% warning · below {settings.attendance_critical_threshold}% critical.</p>
    </div>
  )
}
