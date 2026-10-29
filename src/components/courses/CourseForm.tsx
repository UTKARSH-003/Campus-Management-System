import { useState } from 'react'
import { FormModal } from '../ui/FormModal'
import { Field, Select, inputCls } from '../ui/forms'
import { useAsync } from '../../hooks/useAsync'
import { listFacultyLite } from '../../services/faculty'
import { createCourse, updateCourse, type CourseInput } from '../../services/courses'
import { COURSE_CODE_RE, COURSE_STATUSES, DEPARTMENTS, SEMESTERS, label } from '../../utils/constants'
import type { Course } from '../../types'

type V = { course_code: string; title: string; description: string; department: string; semester: string; credits: string; faculty_id: string; status: string }

export function CourseForm({ course, onClose, onSaved }: { course: Course | null; onClose: () => void; onSaved: (c: Course) => void }) {
  const faculty = useAsync(listFacultyLite, [])
  const [v, setV] = useState<V>({
    course_code: course?.course_code ?? '', title: course?.title ?? '', description: course?.description ?? '', department: course?.department ?? '',
    semester: String(course?.semester ?? 1), credits: String(course?.credits ?? 3), faculty_id: course?.faculty_id ?? '', status: course?.status ?? 'active',
  })
  const [errs, setErrs] = useState<Partial<Record<keyof V, string>>>({})
  const set = (k: keyof V) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    const e: typeof errs = {}
    const code = v.course_code.trim().toUpperCase()
    if (!COURSE_CODE_RE.test(code)) e.course_code = 'Use letters then digits, e.g. CS101.'
    if (!v.title.trim()) e.title = 'Course title is required.'
    if (!v.department) e.department = 'Select a department.'
    const credits = Number(v.credits)
    if (!Number.isInteger(credits) || credits < 1 || credits > 10) e.credits = 'Credits must be a whole number from 1 to 10.'
    setErrs(e)
    if (Object.keys(e).length) return false
    const payload: CourseInput = {
      course_code: code, title: v.title.trim(), description: v.description.trim() || null, department: v.department,
      semester: Number(v.semester), credits, faculty_id: v.faculty_id || null, status: v.status as Course['status'],
    }
    onSaved(course ? await updateCourse(course.id, payload) : await createCourse(payload))
  }

  return (
    <FormModal title={course ? 'Edit course' : 'Add course'} onClose={onClose} onSubmit={submit} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course code" required error={errs.course_code} htmlFor="ccode"><input id="ccode" className={inputCls} value={v.course_code} onChange={set('course_code')} placeholder="CS101" /></Field>
        <Field label="Course title" required error={errs.title} htmlFor="ctitle"><input id="ctitle" className={inputCls} value={v.title} onChange={set('title')} /></Field>
        <Field label="Department" required error={errs.department} htmlFor="cdept"><Select id="cdept" value={v.department} onChange={set('department')} placeholder="Select department" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} /></Field>
        <Field label="Assigned faculty" htmlFor="cfac" hint={faculty.error ?? undefined}>
          <Select id="cfac" value={v.faculty_id} onChange={set('faculty_id')} placeholder="Unassigned" options={(faculty.data ?? []).map((f) => ({ value: f.id, label: `${f.full_name} (${f.faculty_id})${f.status !== 'active' ? ` - ${label(f.status)}` : ''}` }))} />
        </Field>
        <Field label="Semester" htmlFor="csem"><Select id="csem" value={v.semester} onChange={set('semester')} options={SEMESTERS.map((s) => ({ value: s, label: `Semester ${s}` }))} /></Field>
        <Field label="Credits" error={errs.credits} htmlFor="ccred"><input id="ccred" type="number" min={1} max={10} className={inputCls} value={v.credits} onChange={set('credits')} /></Field>
        <Field label="Status" htmlFor="cstat"><Select id="cstat" value={v.status} onChange={set('status')} options={COURSE_STATUSES.map((s) => ({ value: s, label: label(s) }))} /></Field>
        <div className="sm:col-span-2"><Field label="Description" htmlFor="cdesc"><textarea id="cdesc" rows={3} className={inputCls} value={v.description} onChange={set('description')} /></Field></div>
      </div>
    </FormModal>
  )
}
