import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { toError } from '../lib/errors'

export { supabase }

interface Res { data: unknown; error: PostgrestError | null; count?: number | null }

/** Await a Supabase query; throw a readable AppError on failure. */
export async function run<T>(q: PromiseLike<Res>): Promise<T> {
  const { data, error } = await q
  if (error) throw toError(error)
  return data as T
}

export async function runPaged<T>(q: PromiseLike<Res>): Promise<{ rows: T[]; total: number }> {
  const { data, error, count } = await q
  if (error) throw toError(error)
  return { rows: (data ?? []) as T[], total: count ?? 0 }
}

export async function countOf(q: PromiseLike<Res>): Promise<number> {
  const { error, count } = await q
  if (error) throw toError(error)
  return count ?? 0
}

/** PostgREST caps each response (1000 rows by default), so aggregate reads page through everything. */
export async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<Res>): Promise<T[]> {
  const size = 1000
  const out: T[] = []
  for (let from = 0; ; from += size) {
    const rows = await run<T[]>(build(from, from + size - 1))
    out.push(...rows)
    if (rows.length < size) break
  }
  return out
}

export interface ListFilters {
  search: string
  sort: string
  asc: boolean
  page: number
  pageSize: number
}
