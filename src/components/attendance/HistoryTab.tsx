import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../hooks/useToast'
import { listHistory } from '../../services/attendance'
import { downloadCsv } from '../../utils/csv'
import { formatDate } from '../../utils/date'
import { PAGE_SIZE } from '../../utils/constants'
import { Button } from '../ui/Button'
import { Field, inputCls } from '../ui/forms'
import { SearchField } from '../ui/SearchField'
import { Pagination } from '../ui/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '../ui/feedback'
import { StatusPill } from '../ui/StatusBadge'

export function HistoryTab({ courseId, version }: { courseId: string; version: number }) {
  const toast = useToast()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useAsync(() => listHistory({ courseId, from, to }), [courseId, from, to, version])

  const filtered = useMemo(() => (data ?? []).filter((r) => `${r.students?.full_name} ${r.students?.student_id}`.toLowerCase().includes(search.toLowerCase())), [data, search])
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const exportCsv = () => {
    const ok = downloadCsv('attendance-history.csv', filtered.map((r) => ({ Date: r.attendance_date, Course: r.courses?.course_code, 'Student ID': r.students?.student_id, Student: r.students?.full_name, Status: r.status })))
    if (!ok) toast.error('There is no data to export for the current filters.')
  }

  return (
    <div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <Field label="From" htmlFor="hfrom"><input id="hfrom" type="date" className={inputCls} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} /></Field>
        <Field label="To" htmlFor="hto"><input id="hto" type="date" className={inputCls} value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} /></Field>
        <div className="sm:col-span-2 lg:col-span-1"><Field label="Student" htmlFor="hq"><SearchField value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search student" /></Field></div>
        <div className="flex items-end"><Button variant="secondary" className="w-full" onClick={exportCsv}><Download className="h-4 w-4" aria-hidden />Export CSV</Button></div>
      </div>
      {loading && !data ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={() => void reload()} />
        : filtered.length === 0 ? <EmptyState title="No attendance records" message="Nothing matches the selected course and date range." />
        : <>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Attendance history</caption>
            <thead><tr className="border-b border-indigo-50 text-xs uppercase tracking-wide text-muted"><th className="px-4 py-3 lg:px-6">Date</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Student</th><th className="px-4 py-3 lg:px-6">Status</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b border-indigo-50/70"><td className="px-4 py-3 lg:px-6">{formatDate(r.attendance_date)}</td><td className="px-4 py-3 font-semibold">{r.courses?.course_code}</td>
                <td className="px-4 py-3">{r.students?.full_name}<span className="block text-xs text-muted">{r.students?.student_id}</span></td><td className="px-4 py-3 lg:px-6"><StatusPill status={r.status} /></td></tr>))}</tbody>
          </table></div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
        </>}
    </div>
  )
}
