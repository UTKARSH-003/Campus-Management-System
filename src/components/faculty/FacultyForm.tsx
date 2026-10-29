import { useState } from 'react'
import { FormModal } from '../ui/FormModal'
import { Field, Select, inputCls } from '../ui/forms'
import { createFaculty, updateFaculty, type FacultyInput } from '../../services/faculty'
import { DEPARTMENTS, DESIGNATIONS, EMAIL_RE, FACULTY_STATUSES, label } from '../../utils/constants'
import type { Faculty } from '../../types'

type V = { faculty_id: string; full_name: string; email: string; phone: string; department: string; designation: string; specialization: string; status: string }

export function FacultyForm({ faculty, onClose, onSaved }: { faculty: Faculty | null; onClose: () => void; onSaved: (f: Faculty) => void }) {
  const [v, setV] = useState<V>({
    faculty_id: faculty?.faculty_id ?? '', full_name: faculty?.full_name ?? '', email: faculty?.email ?? '', phone: faculty?.phone ?? '',
    department: faculty?.department ?? '', designation: faculty?.designation ?? '', specialization: faculty?.specialization ?? '', status: faculty?.status ?? 'active',
  })
  const [errs, setErrs] = useState<Partial<Record<keyof V, string>>>({})
  const set = (k: keyof V) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    const e: typeof errs = {}
    if (!v.faculty_id.trim()) e.faculty_id = 'Faculty ID is required.'
    if (!v.full_name.trim()) e.full_name = 'Full name is required.'
    if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.'
    if (!v.department) e.department = 'Select a department.'
    if (v.phone && !/^[+()\-\d\s]{7,20}$/.test(v.phone)) e.phone = 'Enter a valid phone number.'
    setErrs(e)
    if (Object.keys(e).length) return false
    const payload: FacultyInput = {
      faculty_id: v.faculty_id.trim(), full_name: v.full_name.trim(), email: v.email.trim(), phone: v.phone.trim() || null,
      department: v.department, designation: v.designation || null, specialization: v.specialization.trim() || null, status: v.status as Faculty['status'],
    }
    onSaved(faculty ? await updateFaculty(faculty.id, payload) : await createFaculty(payload))
  }

  return (
    <FormModal title={faculty ? 'Edit faculty member' : 'Add faculty member'} onClose={onClose} onSubmit={submit} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Faculty ID" required error={errs.faculty_id} htmlFor="fid"><input id="fid" className={inputCls} value={v.faculty_id} onChange={set('faculty_id')} /></Field>
        <Field label="Full name" required error={errs.full_name} htmlFor="fname"><input id="fname" className={inputCls} value={v.full_name} onChange={set('full_name')} /></Field>
        <Field label="Email" required error={errs.email} htmlFor="femail"><input id="femail" type="email" className={inputCls} value={v.email} onChange={set('email')} /></Field>
        <Field label="Phone" error={errs.phone} htmlFor="fphone"><input id="fphone" className={inputCls} value={v.phone} onChange={set('phone')} /></Field>
        <Field label="Department" required error={errs.department} htmlFor="fdept"><Select id="fdept" value={v.department} onChange={set('department')} placeholder="Select department" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} /></Field>
        <Field label="Designation" htmlFor="fdes"><Select id="fdes" value={v.designation} onChange={set('designation')} placeholder="Select designation" options={DESIGNATIONS.map((d) => ({ value: d, label: d }))} /></Field>
        <Field label="Specialization" htmlFor="fspec"><input id="fspec" className={inputCls} value={v.specialization} onChange={set('specialization')} /></Field>
        <Field label="Employment status" htmlFor="fstat"><Select id="fstat" value={v.status} onChange={set('status')} options={FACULTY_STATUSES.map((s) => ({ value: s, label: label(s) }))} /></Field>
      </div>
    </FormModal>
  )
}
