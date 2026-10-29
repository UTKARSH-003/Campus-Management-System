import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useListState, useViewParam } from '../hooks/useListState'
import { useToast } from '../hooks/useToast'
import { createAnnouncement, deleteAnnouncement, getAnnouncement, listAnnouncements, updateAnnouncement, type AnnouncementInput } from '../services/announcements'
import { errorText } from '../lib/errors'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader, FilterBar } from '../components/ui/PageHeader'
import { SearchField } from '../components/ui/SearchField'
import { Field, Select, inputCls } from '../components/ui/forms'
import { Button } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, ErrorState, Skeleton, TableSkeleton } from '../components/ui/feedback'
import { PriorityBadge, StatusPill } from '../components/ui/StatusBadge'
import { RowActions } from '../components/ui/RowActions'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { FormModal } from '../components/ui/FormModal'
import { ANNOUNCEMENT_CATEGORIES, PRIORITIES, label } from '../utils/constants'
import { formatDateTime, toLocalInput } from '../utils/date'
import type { Announcement } from '../types'

const SIZE = 6

function AnnouncementForm({ item, onClose, onSaved }: { item: Announcement | null; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({ title: item?.title ?? '', description: item?.description ?? '', category: item?.category ?? 'general', priority: item?.priority ?? 'informational', status: item?.status ?? 'published', published_at: toLocalInput(item?.published_at ?? new Date().toISOString()) })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))
  const submit = async () => {
    const e: Record<string, string> = {}
    if (!v.title.trim()) e.title = 'Title is required.'
    if (!v.description.trim()) e.description = 'Description is required.'
    if (!v.published_at || Number.isNaN(new Date(v.published_at).getTime())) e.published_at = 'Enter a valid publishing date.'
    setErrs(e)
    if (Object.keys(e).length) return false
    const payload: AnnouncementInput = { title: v.title.trim(), description: v.description.trim(), category: v.category as Announcement['category'], priority: v.priority as Announcement['priority'], status: v.status as Announcement['status'], published_at: new Date(v.published_at).toISOString() }
    if (item) await updateAnnouncement(item.id, payload); else await createAnnouncement(payload)
    onSaved()
  }
  return (
    <FormModal title={item ? 'Edit announcement' : 'New announcement'} onClose={onClose} onSubmit={submit} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Title" required error={errs.title} htmlFor="ntitle"><input id="ntitle" className={inputCls} value={v.title} onChange={set('title')} /></Field></div>
        <div className="sm:col-span-2"><Field label="Description" required error={errs.description} htmlFor="ndesc"><textarea id="ndesc" rows={4} className={inputCls} value={v.description} onChange={set('description')} /></Field></div>
        <Field label="Category" htmlFor="ncat"><Select id="ncat" value={v.category} onChange={set('category')} options={ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c, label: label(c) }))} /></Field>
        <Field label="Priority" htmlFor="npri"><Select id="npri" value={v.priority} onChange={set('priority')} options={PRIORITIES.map((p) => ({ value: p, label: label(p) }))} /></Field>
        <Field label="Status" htmlFor="nstat"><Select id="nstat" value={v.status} onChange={set('status')} options={['draft', 'published', 'archived'].map((s) => ({ value: s, label: label(s) }))} /></Field>
        <Field label="Publishing date" error={errs.published_at} htmlFor="ndate"><input id="ndate" type="datetime-local" className={inputCls} value={v.published_at} onChange={set('published_at')} /></Field>
      </div>
    </FormModal>
  )
}

function AnnouncementDetail({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (a: Announcement) => void }) {
  const { data, error, loading, reload } = useAsync(() => getAnnouncement(id), [id])
  return (
    <Modal title="Announcement" onClose={onClose} footer={data && <Button onClick={() => onEdit(data)} className="w-full sm:w-auto">Edit announcement</Button>}>
      {loading && <Skeleton className="h-32 w-full" />}
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {data && (<div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2"><PriorityBadge priority={data.priority} /><StatusPill status={data.status} /><span className="text-xs font-semibold capitalize text-muted">{data.category}</span></div>
        <h3 className="font-display text-2xl font-extrabold text-ink">{data.title}</h3>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{data.description}</p>
        <p className="text-xs text-muted">Posted by {data.profiles?.full_name ?? 'Administration'} · {formatDateTime(data.published_at)}</p>
      </div>)}
    </Modal>
  )
}

export default function Announcements() {
  const ls = useListState('published_at', false)
  const toast = useToast()
  const [view, setView] = useViewParam()
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Announcement | null>(null)
  const [busy, setBusy] = useState(false)

  const { data, error, loading, reload } = useAsync(
    () => listAnnouncements({ search: ls.debounced, sort: ls.sort.key, asc: ls.sort.asc, page: ls.page, pageSize: SIZE, category: ls.filters.category ?? '', priority: ls.filters.priority ?? '' }),
    [ls.debounced, ls.filters, ls.sort, ls.page])

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try { await deleteAnnouncement(deleting.id); toast.success('Announcement deleted.'); setDeleting(null); await reload() }
    catch (e) { toast.error(errorText(e)); setDeleting(null) } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Announcements" subtitle="Publish notices and keep the campus informed."
        action={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden />New Announcement</Button>} />
      <FilterBar>
        <SearchField value={ls.search} onChange={ls.setSearch} placeholder="Search announcements" />
        <Select aria-label="Filter by category" value={ls.filters.category ?? ''} onChange={(e) => ls.setFilter('category', e.target.value)} placeholder="All categories" options={ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c, label: label(c) }))} />
        <Select aria-label="Filter by priority" value={ls.filters.priority ?? ''} onChange={(e) => ls.setFilter('priority', e.target.value)} placeholder="All priorities" options={PRIORITIES.map((p) => ({ value: p, label: label(p) }))} />
      </FilterBar>
      {loading && !data ? <GlassCard flush><TableSkeleton /></GlassCard> : error ? <GlassCard><ErrorState message={error} onRetry={() => void reload()} /></GlassCard>
        : !data || data.rows.length === 0 ? <GlassCard><EmptyState title="No announcements found" message="Try changing the filters or publish a new announcement." action={<Button onClick={() => setEditing('new')}>New Announcement</Button>} /></GlassCard>
        : (<>
          <ul className={`grid gap-4 md:grid-cols-2 ${loading ? 'opacity-60' : ''}`}>{data.rows.map((a) => (
            <li key={a.id}><GlassCard hover className="flex h-full flex-col">
              <div className="mb-2 flex flex-wrap items-center gap-2"><PriorityBadge priority={a.priority} /><StatusPill status={a.status} /><span className="text-xs font-semibold capitalize text-muted">{a.category}</span></div>
              <button onClick={() => setView(a.id)} className="text-left"><h2 className="text-lg font-bold text-ink hover:text-brand">{a.title}</h2></button>
              <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted">{a.description}</p>
              <div className="mt-3 flex items-center justify-between gap-2"><p className="text-xs text-muted">{a.profiles?.full_name ?? 'Administration'} · {formatDateTime(a.published_at)}</p><RowActions name={a.title} onView={() => setView(a.id)} onEdit={() => setEditing(a)} onDelete={() => setDeleting(a)} /></div>
            </GlassCard></li>))}</ul>
          <GlassCard flush className="mt-4"><Pagination page={ls.page} pageSize={SIZE} total={data.total} onPage={ls.setPage} /></GlassCard>
        </>)}
      {view && <AnnouncementDetail id={view} onClose={() => setView(null)} onEdit={(a) => { setView(null); setEditing(a) }} />}
      {editing && <AnnouncementForm item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { toast.success('Announcement saved.'); setEditing(null); void reload() }} />}
      {deleting && <ConfirmDialog title="Delete announcement" busy={busy} onConfirm={() => void confirmDelete()} onCancel={() => setDeleting(null)} message={<>Delete <b>{deleting.title}</b>? This cannot be undone.</>} />}
    </>
  )
}
