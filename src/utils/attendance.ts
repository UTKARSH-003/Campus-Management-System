import type { AttendanceStatus, AttendanceSummary, Settings } from '../types'

/**
 * Attendance definition used across the whole app (and mirrored by the SQL views):
 *   attended   = present + late      absent does NOT count
 *   percentage = attended / recorded * 100
 *   no recorded sessions -> null (shown as "No attendance data"), never a division by zero
 */
export function percentage(attended: number, recorded: number): number | null {
  if (recorded <= 0) return null
  return Math.round((attended / recorded) * 1000) / 10
}

export function summarize(rows: { status: AttendanceStatus }[]): AttendanceSummary {
  const late = rows.filter((r) => r.status === 'late').length
  const present = rows.filter((r) => r.status === 'present').length
  const absent = rows.filter((r) => r.status === 'absent').length
  const attended = present + late
  return { recorded: rows.length, attended, late, absent, percentage: percentage(attended, rows.length) }
}

export type Tone = 'good' | 'warn' | 'bad' | 'none'

/** Green >= threshold, amber between critical and threshold, rose below critical. */
export function attendanceTone(
  p: number | null,
  s: Pick<Settings, 'attendance_threshold' | 'attendance_critical_threshold'>,
): Tone {
  if (p === null) return 'none'
  if (p >= s.attendance_threshold) return 'good'
  if (p >= s.attendance_critical_threshold) return 'warn'
  return 'bad'
}

export const fmtPct = (p: number | null | undefined) => (p === null || p === undefined ? 'No attendance data' : `${p}%`)

export const num = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v))
