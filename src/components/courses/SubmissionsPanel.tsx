import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../hooks/useToast'
import { deleteSubmission, listSubmissions, saveSubmission } from '../../services/assignments'
import { listEnrolments } from '../../services/courses'
import { errorText } from '../../lib/errors'
import { Button } from '../ui/Button'
import { Field, Select, inputCls } from '../ui/forms'
import { ErrorState, Skeleton } from '../ui/feedback'
import { StatusPill } from '../ui/StatusBadge'
import { SUBMISSION_STATUSES, label } from '../../utils/constants'
import type { Assignment } from '../../types'

export function SubmissionsPanel({ assignment }: { assignment: Assignment }) {
  const toast = useToast()
  const { data, error, loading, reload } = useAsync(async () => ({ subs: await listSubmissions(assignment.id), enrol: await listEnrolments(assignment.course_id) }), [assignment.id])
  const [v, setV] = useState({ student_id: '', status: 'submitted', marks: '', feedback: '' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setErr(null)
    if (!v.student_id) { setErr('Select a student.'); return }
    const marks = v.marks === '' ? null : Number(v.marks)
    if (marks !== null && (Number.isNaN(marks) || marks < 0)) { setErr('Marks must be a non-negative number.'); return }
    if (marks !== null && marks > assignment.max_marks) { setErr(`Marks cannot exceed the maximum of ${assignment.max_marks}.`); return }
    setBusy(true)
    try {
      await saveSubmission({ assignment_id: assignment.id, student_id: v.student_id, status: v.status as never, marks_obtained: marks, feedback: v.feedback.trim() || null })
      toast.success('Submission saved.'); setV({ student_id: '', status: 'submitted', marks: '', feedback: '' }); await reload()
    } catch (e) { setErr(errorText(e)) } finally { setBusy(false) }
  }
  const remove = async (id: string) => { try { await deleteSubmission(id); toast.success('Submission removed.'); await reload() } catch (e) { toast.error(errorText(e)) } }

  if (loading && !data) return <Skeleton className="h-32 w-full" />
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />
  const students = (data?.enrol ?? []).flatMap((e) => (e.students ? [e.students] : []))

  return (
    <section aria-label="Submissions">
      <h3 className="mb-3 text-sm font-bold text-ink">Submissions ({data?.subs.length ?? 0} of {students.length} enrolled)</h3>
      {(data?.subs.length ?? 0) === 0 ? <p className="mb-4 text-sm text-muted">No submissions recorded yet.</p> : (
        <div className="mb-4 overflow-x-auto rounded-2xl border border-indigo-50"><table className="w-full min-w-[520px] text-sm">
          <thead><tr className="text-left text-xs uppercase text-muted"><th className="px-4 py-2">Student</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Marks</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody>{data?.subs.map((s) => (
            <tr key={s.id} className="border-t border-indigo-50"><td className="px-4 py-2 font-semibold">{s.students?.full_name}<span className="block text-xs font-normal text-muted">{s.students?.student_id}</span></td>
              <td className="px-4 py-2"><StatusPill status={s.status} /></td><td className="px-4 py-2">{s.marks_obtained ?? '-'} / {assignment.max_marks}</td>
              <td className="px-4 py-2 text-right whitespace-nowrap">
                <button aria-label={`Edit submission of ${s.students?.full_name}`} className="rounded-lg p-2 text-muted hover:bg-brand-light hover:text-brand" onClick={() => setV({ student_id: s.student_id, status: s.status, marks: s.marks_obtained === null ? '' : String(s.marks_obtained), feedback: s.feedback ?? '' })}><Pencil className="h-4 w-4" /></button>
                <button aria-label={`Delete submission of ${s.students?.full_name}`} className="rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600" onClick={() => void remove(s.id)}><Trash2 className="h-4 w-4" /></button></td></tr>))}</tbody></table></div>)}
      <div className="space-y-3 rounded-2xl bg-brand-light/60 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Add or update a submission</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Student" htmlFor="sub-student"><Select id="sub-student" value={v.student_id} onChange={(e) => setV({ ...v, student_id: e.target.value })} placeholder="Select student" options={students.map((s) => ({ value: s.id, label: `${s.full_name} (${s.student_id})` }))} /></Field>
          <Field label="Status" htmlFor="sub-status"><Select id="sub-status" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })} options={SUBMISSION_STATUSES.map((s) => ({ value: s, label: label(s) }))} /></Field>
          <Field label={`Marks (max ${assignment.max_marks})`} htmlFor="sub-marks"><input id="sub-marks" type="number" min={0} max={assignment.max_marks} step="0.5" className={inputCls} value={v.marks} onChange={(e) => setV({ ...v, marks: e.target.value })} /></Field>
          <Field label="Feedback" htmlFor="sub-fb"><input id="sub-fb" className={inputCls} value={v.feedback} onChange={(e) => setV({ ...v, feedback: e.target.value })} /></Field>
        </div>
        {err && <p role="alert" className="text-sm font-semibold text-rose-600">{err}</p>}
        <Button onClick={() => void save()} loading={busy} className="w-full sm:w-auto">Save submission</Button>
      </div>
    </section>
  )
}
