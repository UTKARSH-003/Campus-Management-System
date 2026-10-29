import { useState } from 'react'
import { FormModal } from '../ui/FormModal'
import { Field, Select, inputCls } from '../ui/forms'
import { createStudent, updateStudent, type StudentInput } from '../../services/students'
import { DEPARTMENTS, EMAIL_RE, SEMESTERS, STUDENT_STATUSES, label } from '../../utils/constants'
import type { Student } from '../../types'

type V = { student_id: string; full_name: string; email: string; phone: string; department: string; program: string; semester: string; section: string; enrollment_date: string; status: string }
const today = () => new Date().toISOString().slice(0, 10)

export function StudentForm({ student, onClose, onSaved }: { student: Student | null; onClose: () => void; onSaved: (s: Student) => void }) {
  const [v, setV] = useState<V>({
    student_id: student?.student_id ?? '', full_name: student?.full_name ?? '', email: student?.email ?? '', phone: student?.phone ?? '',
    department: student?.department ?? '', program: student?.program ?? '', semester: String(student?.semester ?? 1), section: student?.section ?? '',
    enrollment_date: student?.enrollment_date ?? today(), status: student?.status ?? 'active',
  })
  const [errs, setErrs] = useState<Partial<Record<keyof V, string>>>({})
  const set = (k: keyof V) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    const e: typeof errs = {}
    if (!v.full_name.trim()) e.full_name = 'Full name is required.'
    if (!v.student_id.trim()) e.student_id = 'Student ID is required.'
    if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.'
    if (!v.department) e.department = 'Select a department.'
    const sem = Number(v.semester)
    if (!Number.isInteger(sem) || sem < 1 || sem > 12) e.semester = 'Semester must be between 1 and 12.'
    if (v.phone && !/^[+()\-\d\s]{7,20}$/.test(v.phone)) e.phone = 'Enter a valid phone number.'
    if (!v.enrollment_date) e.enrollment_date = 'Enrollment date is required.'
    setErrs(e)
    if (Object.keys(e).length) return false

    const payload: StudentInput = {
      student_id: v.student_id.trim(), full_name: v.full_name.trim(), email: v.email.trim(), phone: v.phone.trim() || null,
      department: v.department, program: v.program.trim() || null, semester: sem, section: v.section.trim() || null,
      enrollment_date: v.enrollment_date, status: v.status as Student['status'],
    }
    const saved = student ? await updateStudent(student.id, payload) : await createStudent(payload)
    onSaved(saved)
  }

  return (
    <FormModal title={student ? 'Edit student' : 'Add student'} onClose={onClose} onSubmit={submit} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Student ID" required error={errs.student_id} htmlFor="sid"><input id="sid" className={inputCls} value={v.student_id} onChange={set('student_id')} /></Field>
        <Field label="Full name" required error={errs.full_name} htmlFor="sname"><input id="sname" className={inputCls} value={v.full_name} onChange={set('full_name')} /></Field>
        <Field label="Email" required error={errs.email} htmlFor="semail"><input id="semail" type="email" className={inputCls} value={v.email} onChange={set('email')} /></Field>
        <Field label="Phone" error={errs.phone} htmlFor="sphone"><input id="sphone" className={inputCls} value={v.phone} onChange={set('phone')} /></Field>
        <Field label="Department" required error={errs.department} htmlFor="sdept"><Select id="sdept" value={v.department} onChange={set('department')} placeholder="Select department" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} /></Field>
        <Field label="Program" htmlFor="sprog"><input id="sprog" className={inputCls} value={v.program} onChange={set('program')} placeholder="e.g. B.Tech CSE" /></Field>
        <Field label="Semester" required error={errs.semester} htmlFor="ssem"><Select id="ssem" value={v.semester} onChange={set('semester')} options={SEMESTERS.map((s) => ({ value: s, label: `Semester ${s}` }))} /></Field>
        <Field label="Section" htmlFor="ssec"><input id="ssec" className={inputCls} value={v.section} onChange={set('section')} maxLength={5} /></Field>
        <Field label="Enrollment date" required error={errs.enrollment_date} htmlFor="sdate"><input id="sdate" type="date" className={inputCls} value={v.enrollment_date} onChange={set('enrollment_date')} /></Field>
        <Field label="Status" htmlFor="sstatus"><Select id="sstatus" value={v.status} onChange={set('status')} options={STUDENT_STATUSES.map((s) => ({ value: s, label: label(s) }))} /></Field>
      </div>
    </FormModal>
  )
}
