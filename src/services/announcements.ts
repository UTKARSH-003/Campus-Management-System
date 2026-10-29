import { run, runPaged, supabase, type ListFilters } from './db'
import { sanitizeSearch } from '../utils/constants'
import type { Announcement } from '../types'

export interface AnnouncementFilters extends ListFilters { category: string; priority: string }
export type AnnouncementInput = Pick<Announcement, 'title' | 'description' | 'category' | 'priority' | 'status'> & { published_at?: string }

export async function listAnnouncements(f: AnnouncementFilters) {
  let q = supabase.from('announcements').select('*, profiles(full_name)', { count: 'exact' })
  const s = sanitizeSearch(f.search)
  if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`)
  if (f.category) q = q.eq('category', f.category)
  if (f.priority) q = q.eq('priority', f.priority)
  q = q.order(f.sort, { ascending: f.asc }).range((f.page - 1) * f.pageSize, f.page * f.pageSize - 1)
  return runPaged<Announcement>(q)
}

export const getAnnouncement = (id: string) =>
  run<Announcement>(supabase.from('announcements').select('*, profiles(full_name)').eq('id', id).single())
// author_id is filled by the database default (auth.uid()), so it cannot be spoofed from the client.
export const createAnnouncement = (v: AnnouncementInput) => run(supabase.from('announcements').insert(v))
export const updateAnnouncement = (id: string, v: AnnouncementInput) => run(supabase.from('announcements').update(v).eq('id', id))
export const deleteAnnouncement = (id: string) => run(supabase.from('announcements').delete().eq('id', id))
