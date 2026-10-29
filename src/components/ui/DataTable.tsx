import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortable?: boolean
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (r: T) => string
  onRowClick?: (r: T) => void
  sort?: { key: string; asc: boolean }
  onSort?: (key: string) => void
  caption: string
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, sort, onSort, caption }: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-indigo-50 text-xs uppercase tracking-wide text-muted">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`px-6 py-3 font-bold ${c.className ?? ''}`}
                aria-sort={sort?.key === c.key ? (sort.asc ? 'ascending' : 'descending') : undefined}>
                {c.sortable && onSort ? (
                  <button onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 rounded hover:text-ink">
                    {c.header}
                    {sort?.key === c.key ? (sort.asc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />}
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-indigo-50/70 last:border-0 hover:bg-brand-light/60">
              {columns.map((c, i) => (
                <td key={c.key} className={`px-6 py-3.5 align-middle ${c.className ?? ''}`}>
                  {i === 0 && onRowClick ? (
                    <button onClick={() => onRowClick(r)} className="text-left font-bold text-ink hover:text-brand focus-visible:underline">{c.render(r)}</button>
                  ) : c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
