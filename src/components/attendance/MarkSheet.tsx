import { useEffect, useMemo, useState } from 'react'
import { Check, Clock, Save, X } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../hooks/useToast'
import { loadSheet, saveSheet, studentSummaries } from '../../services/attendance'
import { errorText } from '../../lib/errors'
import { Button } from '../ui/Button'
import { EmptyState, ErrorState, TableSkeleton } from '../ui/feedback'
import { SearchField } from '../ui/SearchField'
import { AttendanceBadge } from './AttendanceBadge'
import type { AttendanceStatus } from '../../types'

const OPTIONS: { value: AttendanceStatus; label: string; Icon: typeof Check; on: string }[] = [
  { value: 'present', label: 'Present', Icon: Check, on: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'late', label: 'Late', Icon: Clock, on: 'bg-amber-500 text-white border-amber-500' },
  { value: 'absent', label: 'Absent', Icon: X, on: 'bg-rose-500 text-white border-rose-500' },
]

export function MarkSheet({ courseId, date, onSaved }: { courseId: string; date: string; onSaved: () => void }) {
  const toast = useToast()
  const sheet = useAsync(() => loadSheet(courseId, date), [courseId, date])
  const summaries = useAsync(() => studentSummaries(courseId), [courseId])
  const [marks, setMarks] = useState<Record<string, AttendanceStatus | null>>({})
  const [original, setOriginal] = useState<Record<string, AttendanceStatus | null>>({})
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!sheet.data) return
    const m: Record<string, AttendanceStatus | null> = {}
    sheet.data.forEach((r) => { m[r.student.id] = r.status })
    setMarks(m); setOriginal(m)
  }, [sheet.data])

  const rows = sheet.data ?? []
  const visible = useMemo(() => rows.filter((r) => `${r.student.full_name} ${r.student.student_id}`.toLowerCase().includes(search.toLowerCase())), [rows, search])
  const dirty = rows.filter((r) => marks[r.student.id] !== original[r.student.id])
  const unmarked = rows.filter((r) => !marks[r.student.id]).length
  const pctOf = (id: string) => summaries.data?.find((s) => s.student.id === id)?.percentage ?? null

  const markAll = (status: AttendanceStatus) => setMarks((m) => { const n = { ...m }; visible.forEach((r) => { n[r.student.id] = status }); return n })

  const save = async () => {
    const entries = rows.filter((r) => marks[r.student.id]).map((r) => ({ studentId: r.student.id, status: marks[r.student.id] as AttendanceStatus }))
    if (entries.length === 0) { toast.error('Mark at least one student before saving.'); return }
    setSaving(true)
    try {
      await saveSheet(courseId, date, entries)
      toast.success(`Attendance saved for ${entries.length} student${entries.length > 1 ? 's' : ''}.`)
      await Promise.all([sheet.reload(), summaries.reload()])
      onSaved()
    } catch (e) { toast.error(errorText(e)) } finally { setSaving(false) }
  }

  if (sheet.loading && !sheet.data) return <TableSkeleton />
  if (sheet.error) return <ErrorState message={sheet.error} onRetry={() => void sheet.reload()} />
  if (rows.length === 0) return <EmptyState title="No students enrolled" message="Enrol students in this course (Courses page) before recording attendance." />

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-indigo-50 p-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <SearchField className="lg:w-72" value={search} onChange={setSearch} placeholder="Search student" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase text-muted">Bulk:</span>
          {OPTIONS.map((o) => <Button key={o.value} size="sm" variant="secondary" onClick={() => markAll(o.value)}>All {o.label.toLowerCase()}</Button>)}
        </div>
      </div>
      <ul className="divide-y divide-indigo-50">
        {visible.map((r) => (
          <li key={r.student.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{r.student.full_name}</p>
              <p className="flex items-center gap-2 text-xs text-muted">{r.student.student_id} <AttendanceBadge value={pctOf(r.student.id)} /></p>
            </div>
            <div role="radiogroup" aria-label={`Attendance for ${r.student.full_name}`} className="grid grid-cols-3 gap-2 sm:flex">
              {OPTIONS.map(({ value, label, Icon, on }) => {
                const active = marks[r.student.id] === value
                return (
                  <button key={value} type="button" role="radio" aria-checked={active} onClick={() => setMarks((m) => ({ ...m, [r.student.id]: value }))}
                    className={`inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors ${active ? on : 'border-indigo-100 bg-white text-slate-600 hover:bg-brand-light'}`}>
                    <Icon className="h-4 w-4" aria-hidden />{label}
                  </button>)
              })}
            </div>
          </li>))}
        {visible.length === 0 && <li className="p-6 text-center text-sm text-muted">No student matches your search.</li>}
      </ul>
      <div className="sticky bottom-0 flex flex-col items-stretch gap-3 rounded-b-3xl border-t border-indigo-50 bg-white/95 p-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-sm text-muted">{unmarked > 0 ? <><b className="text-amber-600">{unmarked}</b> not marked (excluded from calculations) · </> : null}{dirty.length} unsaved change{dirty.length === 1 ? '' : 's'}</p>
        <Button onClick={() => void save()} loading={saving} disabled={dirty.length === 0 && unmarked === rows.length}><Save className="h-4 w-4" aria-hidden />Save attendance</Button>
      </div>
    </div>
  )
}
