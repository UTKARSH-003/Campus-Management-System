import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useListState, useViewParam } from '../hooks/useListState'
import { useToast } from '../hooks/useToast'
import { deleteFaculty, getFaculty, listCoursesOfFaculty, listFaculty } from '../services/faculty'
import { errorText } from '../lib/errors'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader, FilterBar, DetailRow } from '../components/ui/PageHeader'
import { SearchField } from '../components/ui/SearchField'
import { Select } from '../components/ui/forms'
import { Button } from '../components/ui/Button'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, ErrorState, Skeleton, TableSkeleton } from '../components/ui/feedback'
import { StatusPill } from '../components/ui/StatusBadge'
import { RowActions } from '../components/ui/RowActions'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { FacultyForm } from '../components/faculty/FacultyForm'
import { DEPARTMENTS, FACULTY_STATUSES, PAGE_SIZE, label } from '../utils/constants'
import type { Faculty as FacultyT } from '../types'

function FacultyDetail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (f: FacultyT) => void }) {
  const { data, error, loading, reload } = useAsync(async () => ({ f: await getFaculty(id), courses: await listCoursesOfFaculty(id) }), [id])
  return (
    <Modal title="Faculty profile" onClose={onClose} wide footer={data && <Button onClick={() => onEdit(data.f)} className="w-full sm:w-auto">Edit faculty</Button>}>
      {loading && <Skeleton className="h-40 w-full" />}
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {data && !loading && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-display text-2xl font-extrabold text-ink">{data.f.full_name}</p><p className="text-sm text-muted">{data.f.faculty_id} · {data.f.designation ?? 'Faculty'}</p></div>
            <StatusPill status={data.f.status} />
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <DetailRow label="Email">{data.f.email}</DetailRow><DetailRow label="Phone">{data.f.phone}</DetailRow><DetailRow label="Department">{data.f.department}</DetailRow>
            <DetailRow label="Specialization">{data.f.specialization}</DetailRow>
          </dl>
          <section aria-label="Assigned courses"><h3 className="mb-3 text-sm font-bold text-ink">Assigned courses ({data.courses.length})</h3>
            {data.courses.length === 0 ? <p className="text-sm text-muted">No courses assigned yet.</p> :
              <ul className="space-y-2">{data.courses.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-light/60 px-4 py-2 text-sm">
                  <span className="font-semibold">{c.course_code} · {c.title}</span><span className="text-muted">Sem {c.semester} · {c.credits} credits</span>
                </li>))}</ul>}
          </section>
        </div>)}
    </Modal>
  )
}

export default function Faculty() {
  const ls = useListState('faculty_id')
  const toast = useToast()
  const [view, setView] = useViewParam()
  const [editing, setEditing] = useState<FacultyT | 'new' | null>(null)
  const [deleting, setDeleting] = useState<FacultyT | null>(null)
  const [busy, setBusy] = useState(false)

  const { data, error, loading, reload } = useAsync(
    () => listFaculty({ search: ls.debounced, sort: ls.sort.key, asc: ls.sort.asc, page: ls.page, pageSize: PAGE_SIZE, department: ls.filters.department ?? '', status: ls.filters.status ?? '' }),
    [ls.debounced, ls.filters, ls.sort, ls.page])

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try { await deleteFaculty(deleting.id); toast.success(`${deleting.full_name} was deleted.`); setDeleting(null); await reload() }
    catch (e) { toast.error(errorText(e).includes('linked') ? 'This faculty member still teaches courses, timetable slots or assignments. Reassign them first, or set the status to Inactive.' : errorText(e)); setDeleting(null) }
    finally { setBusy(false) }
  }

  const columns: Column<FacultyT>[] = [
    { key: 'full_name', header: 'Faculty', sortable: true, render: (f) => <span>{f.full_name}<span className="block text-xs font-medium text-muted">{f.faculty_id}</span></span> },
    { key: 'department', header: 'Department', sortable: true, render: (f) => f.department },
    { key: 'designation', header: 'Designation', sortable: true, render: (f) => <span>{f.designation ?? '-'}<span className="block text-xs text-muted">{f.specialization}</span></span> },
    { key: 'status', header: 'Status', sortable: true, render: (f) => <StatusPill status={f.status} /> },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (f) => <RowActions name={f.full_name} onView={() => setView(f.id)} onEdit={() => setEditing(f)} onDelete={() => setDeleting(f)} /> },
  ]

  return (
    <>
      <PageHeader title="Faculty" subtitle="Manage faculty members, designations and course assignments."
        action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden />Add Faculty</Button>} />
      <FilterBar>
        <SearchField value={ls.search} onChange={ls.setSearch} placeholder="Search name, ID or email" />
        <Select aria-label="Filter by department" value={ls.filters.department ?? ''} onChange={(e) => ls.setFilter('department', e.target.value)} placeholder="All departments" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
        <Select aria-label="Filter by status" value={ls.filters.status ?? ''} onChange={(e) => ls.setFilter('status', e.target.value)} placeholder="All statuses" options={FACULTY_STATUSES.map((s) => ({ value: s, label: label(s) }))} />
      </FilterBar>
      <GlassCard flush>
        {loading && !data ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={() => void reload()} />
          : !data || data.rows.length === 0 ? <EmptyState title="No faculty found" message="Try changing the search or filters, or add a faculty member." action={<Button onClick={() => setEditing('new')}>Add Faculty</Button>} />
          : <>
            <div className={loading ? 'opacity-60 transition-opacity' : ''}><DataTable caption="Faculty" columns={columns} rows={data.rows} rowKey={(f) => f.id} onRowClick={(f) => setView(f.id)} sort={ls.sort} onSort={ls.toggleSort} /></div>
            <Pagination page={ls.page} pageSize={PAGE_SIZE} total={data.total} onPage={ls.setPage} />
          </>}
      </GlassCard>
      {view && <FacultyDetail id={view} onClose={() => setView(null)} onEdit={(f) => { setView(null); setEditing(f) }} />}
      {editing && <FacultyForm faculty={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={(f) => { toast.success(`${f.full_name} was saved.`); setEditing(null); void reload() }} />}
      {deleting && <ConfirmDialog title="Delete faculty member" busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setDeleting(null)}
        message={<>Delete <b>{deleting.full_name}</b> ({deleting.faculty_id})? Faculty who teach courses, timetable slots or assignments are protected from deletion; reassign those first or set the status to <b>Inactive</b>.</>} />}
    </>
  )
}
