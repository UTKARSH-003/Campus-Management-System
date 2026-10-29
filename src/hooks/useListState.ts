import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from './useDebounce'

/** Search / filters / sort / page state shared by the list pages. Any change resets to page 1. */
export function useListState(defaultSort: string, defaultAsc = true, initialFilters: Record<string, string> = {}) {
  const [search, setSearchRaw] = useState('')
  const debounced = useDebounce(search)
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters)
  const [sort, setSort] = useState({ key: defaultSort, asc: defaultAsc })
  const [page, setPage] = useState(1)

  const setSearch = useCallback((v: string) => { setSearchRaw(v); setPage(1) }, [])
  const setFilter = useCallback((k: string, v: string) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1) }, [])
  const toggleSort = useCallback((key: string) => { setSort((s) => ({ key, asc: s.key === key ? !s.asc : true })); setPage(1) }, [])
  return { search, setSearch, debounced, filters, setFilter, sort, toggleSort, page, setPage }
}

/** `?view=<id>` opens a record's detail view; used by global search, notifications and dashboard links. */
export function useViewParam(): [string | null, (id: string | null) => void] {
  const [params, setParams] = useSearchParams()
  const set = useCallback((id: string | null) => {
    setParams((prev) => { const n = new URLSearchParams(prev); if (id) n.set('view', id); else n.delete('view'); return n }, { replace: false })
  }, [setParams])
  return [params.get('view'), set]
}
