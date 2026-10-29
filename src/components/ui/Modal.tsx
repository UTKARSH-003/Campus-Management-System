import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps { title: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }

export function Modal({ title, onClose, children, wide, footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
        if (f.length === 0) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector<HTMLElement>('input,select,textarea')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`}>
        <div className="flex items-center justify-between border-b border-indigo-50 px-6 py-4">
          <h2 className="font-display text-xl font-extrabold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-muted hover:bg-brand-light"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-indigo-50 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

interface ConfirmProps { title: string; message: ReactNode; confirmLabel?: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }: ConfirmProps) {
  return (
    <Modal title={title} onClose={onCancel}
      footer={<>
        <Button variant="secondary" onClick={onCancel} className="w-full sm:w-auto">Cancel</Button>
        <Button variant="danger" loading={busy} onClick={onConfirm} className="w-full sm:w-auto">{confirmLabel}</Button>
      </>}>
      <div className="text-sm text-slate-600">{message}</div>
    </Modal>
  )
}
