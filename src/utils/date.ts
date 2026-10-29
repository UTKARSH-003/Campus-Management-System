const ISO_DOW: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
export const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export interface NowParts {
  date: string // YYYY-MM-DD in the institution time zone
  time: string // HH:MM (24h) in the institution time zone
  isoDow: number // 1 = Monday ... 7 = Sunday
}

/** "Now" expressed in the institution's configured time zone. */
export function nowInTimezone(timeZone: string): NowParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    isoDow: ISO_DOW[get('weekday')] ?? 1,
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  // Plain dates (YYYY-MM-DD) are parsed as local noon to avoid off-by-one shifts.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function relativeTime(value: string): string {
  const diff = new Date(value).getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const hrs = Math.round(abs / 3600000)
  const days = Math.round(abs / 86400000)
  const text = mins < 60 ? `${Math.max(mins, 1)} min` : hrs < 48 ? `${hrs} hr` : `${days} days`
  return diff < 0 ? `${text} ago` : `in ${text}`
}

/** "09:00:00" -> "09:00" */
export const hhmm = (t: string) => t.slice(0, 5)

/** Convert an ISO timestamp to the value format of <input type="datetime-local">. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
