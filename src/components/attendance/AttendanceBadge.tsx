import { useSettings } from '../../hooks/useSettings'
import { attendanceTone } from '../../utils/attendance'
import { StatusBadge, type BadgeTone } from '../ui/StatusBadge'

const MAP: Record<string, BadgeTone> = { good: 'good', warn: 'warn', bad: 'bad', none: 'neutral' }

/** Green >= threshold, amber between critical and threshold, rose below critical. Always text + icon. */
export function AttendanceBadge({ value }: { value: number | null }) {
  const { settings } = useSettings()
  const tone = attendanceTone(value, settings)
  return <StatusBadge tone={MAP[tone]} icon={tone === 'bad' ? 'alert' : undefined}>{value === null ? 'No attendance data' : `${value}%`}</StatusBadge>
}
