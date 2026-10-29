import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useListState, useViewParam } from '../hooks/useListState'
import { useToast } from '../hooks/useToast'
import { createAssignment, deleteAssignment, getAssignment, listAssignments, updateAssignment, type AssignmentInput } from '../services/assignments'
import { listCoursesLite } from '../services/courses'
import { listFacultyLite } from '../services/faculty'
import { errorText } from '../lib/errors'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader, FilterBar, DetailRow } from '../components/ui/PageHeader'
import { SearchField } from '../components/ui/SearchField'
import { Field, Select, inputCls } from '../components/ui/forms'
import { Button } from '../components/ui/Button'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, ErrorState, Skeleton, TableSkeleton } from '../components/ui/feedback'
import { StatusBadge, StatusPill } from '../components/ui/StatusBadge'
import { RowActions } from '../components/ui/RowActions'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { FormModal } from '../components/ui/FormModal'
import { SubmissionsPanel } from '../components/courses/SubmissionsPanel'
import { ASSIGNMENT_STATUSES, PAGE_SIZE, label } from '../utils/constants'
import { formatDateTime, toLocalInput } from '../utils/date'
import type { Assignment } from '../types'

const DAY = 86400000
function Deadline({ a }: { a: Assignment }) {
  if (a.status !== 'published') return null
  const diff = new Date(a.due_date).getTime() - Date.now()
  if (diff < 0) return <StatusBadge tone="bad" icon="alert">Overdue</StatusBadge>
  if (diff <= 3 * DAY) return <StatusBadge tone="warn">Due soon</StatusBadge>
  return null
}

function AssignmentForm({ assignment, onClose, onSaved }: { assignment: Assignment | null; onClose: () => void; onSaved: () => void }) {
  const courses = useAsync(listCoursesLite, [])
  const faculty = useAsync(listFacultyLite, [])
  const [v, setV] = useState({
    title: assignment?.title ?? '', description: assignment?.description ?? '', course_id: assignment?.course_id ?? '', faculty_id: assignment?.faculty_id ?? '',
    due_date: assignment ? toLocalInput(assignment.due_date) : toLocalInput(new Date(Date.now() + 7 * DAY).toISOString()), max_marks: String(assignment?.max_marks ?? 100), status: assignment?.status ?? 'published',
  })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    const e: Record<string, string> = {}
    if (!v.title.trim()) e.title = 'Title is required.'
    if (!v.course_id) e.course_id = 'Select a course.'
    if (!v.due_date || Number.isNaN(new Date(v.due_date).getTime())) e.due_date = 'Enter a valid due date.'
    const marks = Number(v.max_marks)
    if (!(marks > 0)) e.max_marks = 'Maximum marks must be greater than 0.'
    setErrs(e)
    if (Object.keys(e).length) return false
    const payload: AssignmentInput = { title: v.title.trim(), description: v.description.trim() || null, course_id: v.course_id, faculty_id: v.faculty_id || null, due_date: new Date(v.due_date).toISOString(), max_marks: marks, status: v.status as Assignment['status'] }
    if (assignment) await updateAssignment(assignment.id, payload); else await createAssignment(payload)
    onSaved()
  }

  return (
    <FormModal title={assignment ? 'Edit assignment' : 'Create assignment'} onClose={onClose} onSubmit={submit} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Title" required error={errs.title} htmlFor="atitle"><input id="atitle" className={inputCls} value={v.title} onChange={set('title')} /></Field></div>
        <Field label="Course" required error={errs.course_id} htmlFor="acourse"><Select id="acourse" value={v.course_id} onChange={set('course_id')} placeholder="Select course" options={(courses.data ?? []).filter((c) => c.status === 'active' || c.id === assignment?.course_id).map((c) => ({ value: c.id, label: `${c.course_code} - ${c.title}` }))} /></Field>
        <Field label="Assigned faculty" htmlFor="afac" hint="Blank = the course's faculty."><Select id="afac" value={v.faculty_id} onChange={set('faculty_id')} placeholder="Course's faculty" options={(faculty.data ?? []).map((f) => ({ value: f.id, label: f.full_name }))} /></Field>
        <Field label="Due date" required error={errs.due_date} htmlFor="adue"><input id="adue" type="datetime-local" className={inputCls} value={v.due_date} onChange={set('due_date')} /></Field>
        <Field label="Maximum marks" required error={errs.max_marks} htmlFor="amarks"><input id="amarks" type="number" min={1} step="0.5" className={inputCls} value={v.max_marks} onChange={set('max_marks')} /></Field>
        <Field label="Status" htmlFor="astat"><Select id="astat" value={v.status} onChange={set('status')} options={ASSIGNMENT_STATUSES.map((s) => ({ value: s, label: label(s) }))} /></Field>
        <div className="sm:col-span-2"><Field label="Description" htmlFor="adesc"><textarea id="adesc" rows={3} className={inputCls} value={v.description} onChange={set('description')} /></Field></div>
      </div>
    </FormModal>
  )
}

function AssignmentDetail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (a: Assignment) => void }) {
  const { data, error, loading, reload } = useAsync(() => getAssignment(id), [id])
  return (
    <Modal title="Assignment details" onClose={onClose} wide footer={data && <Button onClick={() => onEdit(data)} className="w-full sm:w-auto">Edit assignment</Button>}>
      {loading && <Skeleton className="h-40 w-full" />}
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {data && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-display text-2xl font-extrabold text-ink">{data.title}</p><p className="text-sm text-muted">{data.courses?.course_code} · {data.courses?.title}</p></div><div className="flex gap-2"><Deadline a={data} /><StatusPill status={data.status} /></div></div>
          <dl className="grid gap-4 sm:grid-cols-3"><DetailRow label="Due">{formatDateTime(data.due_date)}</DetailRow><DetailRow label="Maximum marks">{String(data.max_marks)}</DetailRow><DetailRow label="Faculty">{data.faculty?.full_name}</DetailRow></dl>
          {data.description && <p className="text-sm text-slate-600">{data.description}</p>}
          <SubmissionsPanel assignment={data} />
        </div>)}
    </Modal>
  )
}

export default function Assignments() {
  const [params] = useSearchParams()
  const ls = useListState('due_date', true, { timing: params.get('timing') ?? '' })
  const toast = useToast()
  const [view, setView] = useViewParam()
  const [editing, setEditing] = useState<Assignment | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Assignment | null>(null)
  const [busy, setBusy] = useState(false)
  const courses = useAsync(listCoursesLite, [])

  const { data, error, loading, reload } = useAsync(
    () => listAssignments({ search: ls.debounced, sort: ls.sort.key, asc: ls.sort.asc, page: ls.page, pageSize: PAGE_SIZE, courseId: ls.filters.course ?? '', status: ls.filters.status ?? '', timing: ls.filters.timing ?? '' }),
    [ls.debounced, ls.filters, ls.sort, ls.page])

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try { await deleteAssignment(deleting.id); toast.success('Assignment deleted.'); setDeleting(null); await reload() }
    catch (e) { toast.error(errorText(e).includes('linked') ? 'This assignment has submissions and cannot be deleted. Set its status to Closed instead.' : errorText(e)); setDeleting(null) }
    finally { setBusy(false) }
  }

  const columns: Column<Assignment>[] = [
    { key: 'title', header: 'Assignment', sortable: true, render: (a) => <span>{a.title}<span className="block text-xs font-medium text-muted">{a.courses?.course_code} · {a.courses?.title}</span></span> },
    { key: 'due_date', header: 'Due', sortable: true, render: (a) => <span className="flex flex-wrap items-center gap-2">{formatDateTime(a.due_date)}<Deadline a={a} /></span> },
    { key: 'max_marks', header: 'Max marks', sortable: true, render: (a) => a.max_marks },
    { key: 'status', header: 'Status', sortable: true, render: (a) => <StatusPill status={a.status} /> },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (a) => <RowActions name={a.title} onView={() => setView(a.id)} onEdit={() => setEditing(a)} onDelete={() => setDeleting(a)} /> },
  ]

  return (
    <>
      <PageHeader title="Assignments" subtitle="Create assignments, track deadlines and record submissions."
        action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden />Create Assignment</Button>} />
      <FilterBar>
        <SearchField value={ls.search} onChange={ls.setSearch} placeholder="Search title" />
        <Select aria-label="Filter by course" value={ls.filters.course ?? ''} onChange={(e) => ls.setFilter('course', e.target.value)} placeholder="All courses" options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.course_code }))} />
        <Select aria-label="Filter by status" value={ls.filters.status ?? ''} onChange={(e) => ls.setFilter('status', e.target.value)} placeholder="All statuses" options={ASSIGNMENT_STATUSES.map((s) => ({ value: s, label: label(s) }))} />
        <Select aria-label="Filter by deadline" value={ls.filters.timing ?? ''} onChange={(e) => ls.setFilter('timing', e.target.value)} placeholder="All deadlines" options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'overdue', label: 'Past due' }]} />
      </FilterBar>
      <GlassCard flush>
        {loading && !data ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={() => void reload()} />
          : !data || data.rows.length === 0 ? <EmptyState title="No assignments found" message="Try changing the filters or create an assignment." action={<Button onClick={() => setEditing('new')}>Create Assignment</Button>} />
          : <>
            <div className={loading ? 'opacity-60 transition-opacity' : ''}><DataTable caption="Assignments" columns={columns} rows={data.rows} rowKey={(a) => a.id} onRowClick={(a) => setView(a.id)} sort={ls.sort} onSort={ls.toggleSort} /></div>
            <Pagination page={ls.page} pageSize={PAGE_SIZE} total={data.total} onPage={ls.setPage} />
          </>}
      </GlassCard>
      {view && <AssignmentDetail id={view} onClose={() => setView(null)} onEdit={(a) => { setView(null); setEditing(a) }} />}
      {editing && <AssignmentForm assignment={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { toast.success('Assignment saved.'); setEditing(null); void reload() }} />}
      {deleting && <ConfirmDialog title="Delete assignment" busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setDeleting(null)} message={<>Delete <b>{deleting.title}</b>? Assignments that already have submissions are protected; set them to <b>Closed</b> instead.</>} />}
    </>
  )
}
