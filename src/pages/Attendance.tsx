import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { useSettings } from '../hooks/useSettings'
import { listCoursesLite } from '../services/courses'
import { nowInTimezone } from '../utils/date'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Field, Select, inputCls } from '../components/ui/forms'
import { EmptyState, ErrorState } from '../components/ui/feedback'
import { MarkSheet } from '../components/attendance/MarkSheet'
import { SummaryTab } from '../components/attendance/SummaryTab'
import { HistoryTab } from '../components/attendance/HistoryTab'

type Tab = 'mark' | 'summary' | 'history'
const TABS: { id: Tab; label: string }[] = [{ id: 'mark', label: 'Mark attendance' }, { id: 'summary', label: 'Summary' }, { id: 'history', label: 'History' }]

export default function Attendance() {
  const { settings } = useSettings()
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'mark') as Tab
  const courseId = params.get('course') ?? ''
  const today = nowInTimezone(settings.timezone).date
  const [date, setDate] = useState(today)
  const [version, setVersion] = useState(0)
  const courses = useAsync(listCoursesLite, [])

  const update = useCallback((patch: Record<string, string>) => {
    setParams((p) => { const n = new URLSearchParams(p); Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); return n })
  }, [setParams])

  const active = (courses.data ?? []).filter((c) => c.status === 'active')
  const options = (tab === 'mark' ? active : courses.data ?? []).map((c) => ({ value: c.id, label: `${c.course_code} - ${c.title}` }))

  return (
    <>
      <PageHeader title="Attendance" subtitle="Record daily attendance, review course summaries and browse history." />
      <GlassCard flush>
        <div role="tablist" aria-label="Attendance views" className="flex gap-1 overflow-x-auto border-b border-indigo-50 px-4 pt-3 lg:px-6">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => update({ tab: t.id === 'mark' ? '' : t.id })}
              className={`whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-bold ${tab === t.id ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-ink'}`}>{t.label}</button>))}
        </div>
        {courses.error ? <ErrorState message={courses.error} onRetry={() => void courses.reload()} /> : (
          <>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:px-6">
              <Field label="Course" htmlFor="acourse"><Select id="acourse" value={courseId} onChange={(e) => update({ course: e.target.value })} placeholder={tab === 'mark' ? 'Select a course' : 'All courses'} options={options} /></Field>
              {tab === 'mark' && <Field label="Date" htmlFor="adate" hint="Future dates cannot be recorded."><input id="adate" type="date" max={today} className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>}
            </div>
            {tab === 'mark' && (!courseId || !date
              ? <EmptyState title="Select a course and date" message="Choose a course to load its enrolled students." />
              : date > today ? <EmptyState title="Date is in the future" message="Attendance can only be recorded for today or earlier." />
              : <MarkSheet key={`${courseId}-${date}`} courseId={courseId} date={date} onSaved={() => setVersion((v) => v + 1)} />)}
            {tab === 'summary' && <SummaryTab courseId={courseId} onSelectCourse={(id) => update({ course: id })} version={version} />}
            {tab === 'history' && <HistoryTab courseId={courseId} version={version} />}
          </>)}
      </GlassCard>
    </>
  )
}
