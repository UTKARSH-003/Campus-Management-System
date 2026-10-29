import { useState } from 'react'
import { UserMinus, UserPlus } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../hooks/useToast'
import { enrolStudents, getCourse, listEnrolments, removeEnrolment } from '../../services/courses'
import { listActiveStudents } from '../../services/students'
import { errorText } from '../../lib/errors'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { DetailRow } from '../ui/PageHeader'
import { ErrorState, Skeleton } from '../ui/feedback'
import { StatusPill } from '../ui/StatusBadge'
import { Select } from '../ui/forms'
import type { Course } from '../../types'

export function CourseDetail({ id, onClose, onEdit, onChanged }: { id: string; onClose: () => void; onEdit: (c: Course) => void; onChanged: () => void }) {
  const toast = useToast()
  const { data, error, loading, reload } = useAsync(async () => ({ course: await getCourse(id), enrolments: await listEnrolments(id), students: await listActiveStudents() }), [id])
  const [pick, setPick] = useState('')
  const [busy, setBusy] = useState(false)

  const enrolled = new Set(data?.enrolments.map((e) => e.student_id))
  const available = (data?.students ?? []).filter((s) => !enrolled.has(s.id))

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    try { await fn(); toast.success(ok); setPick(''); await reload(); onChanged() }
    catch (e) { toast.error(errorText(e)) }
    finally { setBusy(false) }
  }

  return (
    <Modal title="Course details" onClose={onClose} wide footer={data && <Button onClick={() => onEdit(data.course)} className="w-full sm:w-auto">Edit course</Button>}>
      {loading && !data && <Skeleton className="h-48 w-full" />}
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {data && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-display text-2xl font-extrabold text-ink">{data.course.title}</p><p className="text-sm text-muted">{data.course.course_code}</p></div>
            <StatusPill status={data.course.status} />
          </div>
          <dl className="grid gap-4 sm:grid-cols-4">
            <DetailRow label="Department">{data.course.department}</DetailRow><DetailRow label="Semester">{String(data.course.semester)}</DetailRow>
            <DetailRow label="Credits">{String(data.course.credits)}</DetailRow><DetailRow label="Faculty">{data.course.faculty?.full_name ?? 'Unassigned'}</DetailRow>
          </dl>
          {data.course.description && <p className="text-sm text-slate-600">{data.course.description}</p>}
          <section aria-label="Enrolled students">
            <h3 className="mb-3 text-sm font-bold text-ink">Enrolled students ({data.enrolments.length})</h3>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <div className="flex-1"><Select aria-label="Student to enrol" value={pick} onChange={(e) => setPick(e.target.value)} placeholder={available.length ? 'Select an active student to enrol' : 'No more active students available'} options={available.map((s) => ({ value: s.id, label: `${s.full_name} (${s.student_id})` }))} /></div>
              <Button disabled={!pick} loading={busy} onClick={() => void act(() => enrolStudents(id, [pick]), 'Student enrolled.')}><UserPlus className="h-4 w-4" aria-hidden />Enrol</Button>
            </div>
            {data.enrolments.length === 0 ? <p className="text-sm text-muted">No students enrolled yet.</p> : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">{data.enrolments.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 rounded-xl bg-brand-light/60 px-4 py-2 text-sm">
                  <span className="font-semibold">{e.students?.full_name} <span className="font-normal text-muted">({e.students?.student_id})</span></span>
                  <button disabled={busy} onClick={() => void act(() => removeEnrolment(e.id), 'Enrolment removed.')} aria-label={`Remove ${e.students?.full_name} from course`} className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600"><UserMinus className="h-4 w-4" /></button>
                </li>))}</ul>)}
            <p className="mt-2 text-xs text-muted">An enrolment cannot be removed once attendance has been recorded for that student in this course.</p>
          </section>
        </div>)}
    </Modal>
  )
}
