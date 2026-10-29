import { useAsync } from '../../hooks/useAsync'
import { getStudentDetail } from '../../services/students'
import { Modal } from '../ui/Modal'
import { DetailRow } from '../ui/PageHeader'
import { ErrorState, Skeleton } from '../ui/feedback'
import { StatusPill } from '../ui/StatusBadge'
import { AttendanceBadge } from '../attendance/AttendanceBadge'
import { Button } from '../ui/Button'
import { formatDate } from '../../utils/date'
import type { Student } from '../../types'

export function StudentDetail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (s: Student) => void }) {
  const { data, error, loading, reload } = useAsync(() => getStudentDetail(id), [id])
  return (
    <Modal title="Student profile" onClose={onClose} wide
      footer={data && <Button onClick={() => onEdit(data.student)} className="w-full sm:w-auto">Edit student</Button>}>
      {loading && <div className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-32 w-full" /></div>}
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {data && !loading && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-display text-2xl font-extrabold text-ink">{data.student.full_name}</p><p className="text-sm text-muted">{data.student.student_id}</p></div>
            <StatusPill status={data.student.status} />
          </div>
          <section aria-label="Personal details"><h3 className="mb-3 text-sm font-bold text-ink">Personal details</h3>
            <dl className="grid gap-4 sm:grid-cols-3"><DetailRow label="Email">{data.student.email}</DetailRow><DetailRow label="Phone">{data.student.phone}</DetailRow><DetailRow label="Enrolled on">{formatDate(data.student.enrollment_date)}</DetailRow></dl></section>
          <section aria-label="Academic information"><h3 className="mb-3 text-sm font-bold text-ink">Academic information</h3>
            <dl className="grid gap-4 sm:grid-cols-4"><DetailRow label="Department">{data.student.department}</DetailRow><DetailRow label="Program">{data.student.program}</DetailRow><DetailRow label="Semester">{String(data.student.semester)}</DetailRow><DetailRow label="Section">{data.student.section}</DetailRow></dl></section>
          <section aria-label="Enrolled courses and attendance">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-ink">Enrolled courses &amp; attendance</h3><span className="flex items-center gap-2 text-xs text-muted">Overall <AttendanceBadge value={data.overall.percentage} /></span></div>
            {data.perCourse.length === 0 ? <p className="text-sm text-muted">Not enrolled in any course.</p> : (
              <div className="overflow-x-auto rounded-2xl border border-indigo-50"><table className="w-full min-w-[480px] text-sm">
                <thead><tr className="text-left text-xs uppercase text-muted"><th className="px-4 py-2">Course</th><th className="px-4 py-2">Attended / recorded</th><th className="px-4 py-2">Attendance</th></tr></thead>
                <tbody>{data.perCourse.map((c) => (<tr key={c.course_id} className="border-t border-indigo-50"><td className="px-4 py-2 font-semibold">{c.course_code} · {c.title}</td><td className="px-4 py-2">{c.attended} / {c.recorded}{c.late ? ` (${c.late} late)` : ''}</td><td className="px-4 py-2"><AttendanceBadge value={c.percentage} /></td></tr>))}</tbody>
              </table></div>)}
          </section>
          <section aria-label="Assignment summary"><h3 className="mb-3 text-sm font-bold text-ink">Assignment summary</h3>
            {data.submissions.length === 0 ? <p className="text-sm text-muted">No submissions recorded.</p> : (
              <ul className="space-y-2">{data.submissions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-light/60 px-4 py-2 text-sm">
                  <span className="font-semibold">{s.assignments?.courses?.course_code} · {s.assignments?.title}</span>
                  <span className="flex items-center gap-3"><span className="text-muted">{s.marks_obtained === null ? 'Not graded' : `${s.marks_obtained} / ${s.assignments?.max_marks}`}</span><StatusPill status={s.status} /></span>
                </li>))}</ul>)}
          </section>
        </div>)}
    </Modal>
  )
}
