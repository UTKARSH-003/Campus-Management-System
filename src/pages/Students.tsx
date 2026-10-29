import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useListState, useViewParam } from '../hooks/useListState'
import { useToast } from '../hooks/useToast'
import { deleteStudent, listStudents } from '../services/students'
import { errorText } from '../lib/errors'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader, FilterBar } from '../components/ui/PageHeader'
import { SearchField } from '../components/ui/SearchField'
import { Select } from '../components/ui/forms'
import { Button } from '../components/ui/Button'
import { DataTable, type Column } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/feedback'
import { StatusPill } from '../components/ui/StatusBadge'
import { RowActions } from '../components/ui/RowActions'
import { ConfirmDialog } from '../components/ui/Modal'
import { StudentForm } from '../components/students/StudentForm'
import { StudentDetail } from '../components/students/StudentDetail'
import { DEPARTMENTS, PAGE_SIZE, SEMESTERS, STUDENT_STATUSES, label } from '../utils/constants'
import type { Student } from '../types'

export default function Students() {
  const ls = useListState('student_id')
  const toast = useToast()
  const [view, setView] = useViewParam()
  const [editing, setEditing] = useState<Student | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Student | null>(null)
  const [busy, setBusy] = useState(false)

  const { data, error, loading, reload } = useAsync(
    () => listStudents({ search: ls.debounced, sort: ls.sort.key, asc: ls.sort.asc, page: ls.page, pageSize: PAGE_SIZE,
      department: ls.filters.department ?? '', semester: ls.filters.semester ?? '', status: ls.filters.status ?? '' }),
    [ls.debounced, ls.filters, ls.sort, ls.page])

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try { await deleteStudent(deleting.id); toast.success(`${deleting.full_name} was deleted.`); setDeleting(null); await reload() }
    catch (e) { toast.error(errorText(e)); setDeleting(null) }
    finally { setBusy(false) }
  }

  const columns: Column<Student>[] = [
    { key: 'full_name', header: 'Student', sortable: true, render: (s) => <span>{s.full_name}<span className="block text-xs font-medium text-muted">{s.student_id}</span></span> },
    { key: 'department', header: 'Department', sortable: true, render: (s) => <span>{s.department}<span className="block text-xs text-muted">{s.program}</span></span> },
    { key: 'semester', header: 'Sem / Sec', sortable: true, render: (s) => `${s.semester}${s.section ? ` / ${s.section}` : ''}` },
    { key: 'status', header: 'Status', sortable: true, render: (s) => <StatusPill status={s.status} /> },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (s) => <RowActions name={s.full_name} onView={() => setView(s.id)} onEdit={() => setEditing(s)} onDelete={() => setDeleting(s)} /> },
  ]

  return (
    <>
      <PageHeader title="Students" subtitle="Manage student records, enrolment and academic status."
        action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden />Add Student</Button>} />
      <FilterBar>
        <SearchField value={ls.search} onChange={ls.setSearch} placeholder="Search name, ID or email" />
        <Select aria-label="Filter by department" value={ls.filters.department ?? ''} onChange={(e) => ls.setFilter('department', e.target.value)} placeholder="All departments" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
        <Select aria-label="Filter by semester" value={ls.filters.semester ?? ''} onChange={(e) => ls.setFilter('semester', e.target.value)} placeholder="All semesters" options={SEMESTERS.map((s) => ({ value: s, label: `Semester ${s}` }))} />
        <Select aria-label="Filter by status" value={ls.filters.status ?? ''} onChange={(e) => ls.setFilter('status', e.target.value)} placeholder="All statuses" options={STUDENT_STATUSES.map((s) => ({ value: s, label: label(s) }))} />
      </FilterBar>
      <GlassCard flush>
        {loading && !data ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={() => void reload()} />
          : !data || data.rows.length === 0 ? <EmptyState title="No students found" message="Try changing the search or filters, or add a new student." action={<Button onClick={() => setEditing('new')}>Add Student</Button>} />
          : <>
            <div className={loading ? 'opacity-60 transition-opacity' : ''}>
              <DataTable caption="Students" columns={columns} rows={data.rows} rowKey={(s) => s.id} onRowClick={(s) => setView(s.id)} sort={ls.sort} onSort={ls.toggleSort} />
            </div>
            <Pagination page={ls.page} pageSize={PAGE_SIZE} total={data.total} onPage={ls.setPage} />
          </>}
      </GlassCard>

      {view && <StudentDetail id={view} onClose={() => setView(null)} onEdit={(s) => { setView(null); setEditing(s) }} />}
      {editing && <StudentForm student={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
        onSaved={(s) => { toast.success(`${s.full_name} was saved.`); setEditing(null); void reload() }} />}
      {deleting && <ConfirmDialog title="Delete student" busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setDeleting(null)}
        message={<>Delete <b>{deleting.full_name}</b> ({deleting.student_id})? This cannot be undone. Students with enrolments, attendance or submissions are protected and cannot be deleted; set their status to <b>Inactive</b> instead.</>} />}
    </>
  )
}
