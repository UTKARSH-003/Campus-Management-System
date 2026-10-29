import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useListState, useViewParam } from '../hooks/useListState'
import { useToast } from '../hooks/useToast'
import { deleteCourse, listCourses } from '../services/courses'
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
import { CourseForm } from '../components/courses/CourseForm'
import { CourseDetail } from '../components/courses/CourseDetail'
import { COURSE_STATUSES, DEPARTMENTS, PAGE_SIZE, SEMESTERS, label } from '../utils/constants'
import type { Course } from '../types'

export default function Courses() {
  const ls = useListState('course_code')
  const toast = useToast()
  const [view, setView] = useViewParam()
  const [editing, setEditing] = useState<Course | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Course | null>(null)
  const [busy, setBusy] = useState(false)

  const { data, error, loading, reload } = useAsync(
    () => listCourses({ search: ls.debounced, sort: ls.sort.key, asc: ls.sort.asc, page: ls.page, pageSize: PAGE_SIZE,
      department: ls.filters.department ?? '', semester: ls.filters.semester ?? '', status: ls.filters.status ?? '' }),
    [ls.debounced, ls.filters, ls.sort, ls.page])

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try { await deleteCourse(deleting.id); toast.success(`${deleting.course_code} was deleted.`); setDeleting(null); await reload() }
    catch (e) { toast.error(errorText(e)); setDeleting(null) }
    finally { setBusy(false) }
  }

  const columns: Column<Course>[] = [
    { key: 'course_code', header: 'Course', sortable: true, render: (c) => <span>{c.course_code}<span className="block text-xs font-medium text-muted">{c.title}</span></span> },
    { key: 'department', header: 'Department', sortable: true, render: (c) => c.department },
    { key: 'semester', header: 'Sem / Credits', sortable: true, render: (c) => `Sem ${c.semester} · ${c.credits} cr` },
    { key: 'faculty', header: 'Faculty', render: (c) => c.faculty?.full_name ?? <span className="text-muted">Unassigned</span> },
    { key: 'enrolled', header: 'Enrolled', render: (c) => c.student_courses?.[0]?.count ?? 0 },
    { key: 'status', header: 'Status', sortable: true, render: (c) => <StatusPill status={c.status} /> },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (c) => <RowActions name={c.course_code} onView={() => setView(c.id)} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} /> },
  ]

  return (
    <>
      <PageHeader title="Courses" subtitle="Manage courses, faculty assignments and student enrolment."
        action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden />Add Course</Button>} />
      <FilterBar>
        <SearchField value={ls.search} onChange={ls.setSearch} placeholder="Search code or title" />
        <Select aria-label="Filter by department" value={ls.filters.department ?? ''} onChange={(e) => ls.setFilter('department', e.target.value)} placeholder="All departments" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
        <Select aria-label="Filter by semester" value={ls.filters.semester ?? ''} onChange={(e) => ls.setFilter('semester', e.target.value)} placeholder="All semesters" options={SEMESTERS.map((s) => ({ value: s, label: `Semester ${s}` }))} />
        <Select aria-label="Filter by status" value={ls.filters.status ?? ''} onChange={(e) => ls.setFilter('status', e.target.value)} placeholder="All statuses" options={COURSE_STATUSES.map((s) => ({ value: s, label: label(s) }))} />
      </FilterBar>
      <GlassCard flush>
        {loading && !data ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={() => void reload()} />
          : !data || data.rows.length === 0 ? <EmptyState title="No courses found" message="Try changing the search or filters, or add a course." action={<Button onClick={() => setEditing('new')}>Add Course</Button>} />
          : <>
            <div className={loading ? 'opacity-60 transition-opacity' : ''}><DataTable caption="Courses" columns={columns} rows={data.rows} rowKey={(c) => c.id} onRowClick={(c) => setView(c.id)} sort={ls.sort} onSort={ls.toggleSort} /></div>
            <Pagination page={ls.page} pageSize={PAGE_SIZE} total={data.total} onPage={ls.setPage} />
          </>}
      </GlassCard>
      {view && <CourseDetail id={view} onClose={() => setView(null)} onChanged={() => void reload()} onEdit={(c) => { setView(null); setEditing(c) }} />}
      {editing && <CourseForm course={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={(c) => { toast.success(`${c.course_code} was saved.`); setEditing(null); void reload() }} />}
      {deleting && <ConfirmDialog title="Delete course" busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setDeleting(null)}
        message={<>Delete <b>{deleting.course_code} - {deleting.title}</b>? Courses with enrolments, attendance, timetable entries or assignments are protected; set the status to <b>Archived</b> instead.</>} />}
    </>
  )
}
