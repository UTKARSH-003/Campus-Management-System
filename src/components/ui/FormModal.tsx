import { useState, type FormEvent, type ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { errorText } from '../../lib/errors'

interface Props {
  title: string
  submitLabel?: string
  onClose: () => void
  /** Validate and save. Return false to keep the dialog open (e.g. validation errors); throw to show a server error. */
  onSubmit: () => Promise<boolean | void>
  children: ReactNode
  wide?: boolean
}

export function FormModal({ title, submitLabel = 'Save', onClose, onSubmit, children, wide }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try { await onSubmit() } catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }

  return (
    <Modal title={title} onClose={onClose} wide={wide}
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
        <Button type="submit" form="modal-form" loading={busy} className="w-full sm:w-auto">{submitLabel}</Button>
      </>}>
      <form id="modal-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
        {children}
      </form>
    </Modal>
  )
}

/** Small helper for forms: bind inputs to a values object. */
export const bind = <T extends object>(values: T, set: (v: T) => void) =>
  (key: keyof T) => ({
    value: (values[key] ?? '') as string | number,
    onChange: (e: { target: { value: string } }) => set({ ...values, [key]: e.target.value }),
  })
