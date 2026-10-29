import { useState } from 'react'
import { Clock, MapPin, Plus, User } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/useToast'
import { createEntry, deleteEntry, listTimetable, updateEntry, type TimetableInput } from '../services/timetable'
import { listCoursesLite } from '../services/courses'
import { listFacultyLite } from '../services/faculty'
import { errorText } from '../lib/errors'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader, FilterBar } from '../components/ui/PageHeader'
import { Field, Select, inputCls } from '../components/ui/forms'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/feedback'
import { RowActions } from '../components/ui/RowActions'
import { ConfirmDialog } from '../components/ui/Modal'
import { FormModal } from '../components/ui/FormModal'
import { DAY_NAMES, hhmm } from '../utils/date'
import type { TimetableEntry } from '../types'

const DAY_OPTIONS = DAY_NAMES.slice(1).map((d, i) => ({ value: i + 1, label: d }))

function EntryForm({ entry, onClose, onSaved }: { entry: TimetableEntry | null; onClose: () => void; onSaved: () => void }) {
  const courses = useAsync(listCoursesLite, [])
  const faculty = useAsync(listFacultyLite, [])
  const [v, setV] = useState({ course_id: entry?.course_id ?? '', faculty_id: entry?.faculty_id ?? '', day_of_week: String(entry?.day_of_week ?? 1),
    start_time: entry ? hhmm(entry.start_time) : '09:00', end_time: entry ? hhmm(entry.end_time) : '10:00', room: entry?.room ?? '', section: entry?.section ?? '' })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    const e: Record<string, string> = {}
    if (!v.course_id) e.course_id = 'Select a course.'
    if (!v.room.trim()) e.room = 'Room is required.'
    if (!v.start_time) e.start_time = 'Start time is required.'
    if (!v.end_time) e.end_time = 'End time is required.'
    if (v.start_time && v.end_time && v.end_time <= v.start_time) e.end_time = 'End time must be later than start time.'
    setErrs(e)
    if (Object.keys(e).length) return false
    const payload: TimetableInput = { course_id: v.course_id, faculty_id: v.faculty_id || null, day_of_week: Number(v.day_of_week), start_time: v.start_time, end_time: v.end_time, room: v.room.trim(), section: v.section.trim() || null }
    if (entry) await updateEntry(entry.id, payload); else await createEntry(payload)
    onSaved()
  }

  return (
    <FormModal title={entry ? 'Edit timetable entry' : 'Add timetable entry'} onClose={onClose} onSubmit={submit} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course" required error={errs.course_id} htmlFor="tcourse"><Select id="tcourse" value={v.course_id} onChange={set('course_id')} placeholder="Select course" options={(courses.data ?? []).filter((c) => c.status === 'active' || c.id === entry?.course_id).map((c) => ({ value: c.id, label: `${c.course_code} - ${c.title}` }))} /></Field>
        <Field label="Faculty" htmlFor="tfac" hint="Leave blank to use the course's assigned faculty."><Select id="tfac" value={v.faculty_id} onChange={set('faculty_id')} placeholder="Course's faculty" options={(faculty.data ?? []).map((f) => ({ value: f.id, label: f.full_name }))} /></Field>
        <Field label="Day" htmlFor="tday"><Select id="tday" value={v.day_of_week} onChange={set('day_of_week')} options={DAY_OPTIONS} /></Field>
        <Field label="Room" required error={errs.room} htmlFor="troom"><input id="troom" className={inputCls} value={v.room} onChange={set('room')} placeholder="A-101" /></Field>
        <Field label="Start time" required error={errs.start_time} htmlFor="tstart"><input id="tstart" type="time" className={inputCls} value={v.start_time} onChange={set('start_time')} /></Field>
        <Field label="End time" required error={errs.end_time} htmlFor="tend"><input id="tend" type="time" className={inputCls} value={v.end_time} onChange={set('end_time')} /></Field>
        <Field label="Section" htmlFor="tsec"><input id="tsec" className={inputCls} value={v.section} onChange={set('section')} maxLength={5} /></Field>
      </div>
      <p className="text-xs text-muted">The database rejects overlapping bookings for the same room or the same faculty member on the same day.</p>
    </FormModal>
  )
}

export default function Timetable() {
  const toast = useToast()
  const [courseId, setCourseId] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [day, setDay] = useState('')
  const [editing, setEditing] = useState<TimetableEntry | 'new' | null>(null)
  const [deleting, setDeleting] = useState<TimetableEntry | null>(null)
  const [busy, setBusy] = useState(false)
  const courses = useAsync(listCoursesLite, [])
  const faculty = useAsync(listFacultyLite, [])
  const { data, error, loading, reload } = useAsync(() => listTimetable({ courseId, facultyId, day }), [courseId, facultyId, day])

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try { await deleteEntry(deleting.id); toast.success('Timetable entry deleted.'); setDeleting(null); await reload() }
    catch (e) { toast.error(errorText(e)); setDeleting(null) } finally { setBusy(false) }
  }

  const days = DAY_OPTIONS.filter((d) => !day || String(d.value) === day)

  return (
    <>
      <PageHeader title="Timetable" subtitle="Weekly class schedule, Monday to Saturday."
        action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden />Add Entry</Button>} />
      <FilterBar>
        <Select aria-label="Filter by course" value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="All courses" options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.course_code }))} />
        <Select aria-label="Filter by faculty" value={facultyId} onChange={(e) => setFacultyId(e.target.value)} placeholder="All faculty" options={(faculty.data ?? []).map((f) => ({ value: f.id, label: f.full_name }))} />
        <Select aria-label="Filter by weekday" value={day} onChange={(e) => setDay(e.target.value)} placeholder="All days" options={DAY_OPTIONS} />
      </FilterBar>
      {loading && !data ? <GlassCard flush><TableSkeleton /></GlassCard> : error ? <GlassCard><ErrorState message={error} onRetry={() => void reload()} /></GlassCard>
        : !data || data.length === 0 ? <GlassCard><EmptyState title="No timetable entries" message="Add a class slot to build the weekly timetable." action={<Button onClick={() => setEditing('new')}>Add Entry</Button>} /></GlassCard>
        : (
          <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${day ? '' : 'xl:grid-cols-3'}`}>
            {days.map((d) => {
              const items = data.filter((e) => e.day_of_week === d.value)
              return (
                <GlassCard key={d.value} className="min-w-0 !p-5">
                  <h2 className="mb-3 text-base font-extrabold text-ink">{d.label}</h2>
                  {items.length === 0 ? <p className="text-sm text-muted">No classes.</p> : (
                    <ul className="space-y-2">{items.map((e) => (
                      <li key={e.id} className="rounded-2xl border border-indigo-50 bg-white/80 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{e.courses?.course_code} · {e.courses?.title}</p></div>
                          <RowActions name={`${e.courses?.course_code} on ${d.label}`} onEdit={() => setEditing(e)} onDelete={() => setDeleting(e)} />
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand-dark"><Clock className="h-3.5 w-3.5" aria-hidden />{hhmm(e.start_time)} - {hhmm(e.end_time)}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><MapPin className="h-3.5 w-3.5" aria-hidden />Room {e.room}{e.section ? ` · Sec ${e.section}` : ''}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><User className="h-3.5 w-3.5" aria-hidden />{e.faculty?.full_name ?? 'Faculty not assigned'}</p>
                      </li>))}</ul>)}
                </GlassCard>)
            })}
          </div>)}
      {editing && <EntryForm entry={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { toast.success('Timetable entry saved.'); setEditing(null); void reload() }} />}
      {deleting && <ConfirmDialog title="Delete timetable entry" busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setDeleting(null)}
        message={<>Delete <b>{deleting.courses?.course_code}</b> on {DAY_NAMES[deleting.day_of_week]} at {hhmm(deleting.start_time)}?</>} />}
    </>
  )
}
