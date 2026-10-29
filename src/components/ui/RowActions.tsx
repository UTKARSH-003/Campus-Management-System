import { Eye, Pencil, Trash2 } from 'lucide-react'

export function RowActions({ name, onView, onEdit, onDelete }: { name: string; onView?: () => void; onEdit?: () => void; onDelete?: () => void }) {
  const cls = 'rounded-lg p-2 text-muted hover:bg-brand-light hover:text-brand'
  return (
    <div className="flex items-center justify-end gap-1">
      {onView && <button className={cls} onClick={onView} aria-label={`View ${name}`}><Eye className="h-4 w-4" /></button>}
      {onEdit && <button className={cls} onClick={onEdit} aria-label={`Edit ${name}`}><Pencil className="h-4 w-4" /></button>}
      {onDelete && <button className={`${cls} hover:!bg-rose-50 hover:!text-rose-600`} onClick={onDelete} aria-label={`Delete ${name}`}><Trash2 className="h-4 w-4" /></button>}
    </div>
  )
}
