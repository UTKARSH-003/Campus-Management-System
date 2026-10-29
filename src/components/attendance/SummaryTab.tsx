import { useAsync } from '../../hooks/useAsync'
import { courseSummaries, studentSummaries } from '../../services/attendance'
import { AttendanceBadge } from './AttendanceBadge'
import { EmptyState, ErrorState, Skeleton, TableSkeleton } from '../ui/feedback'

const th = 'px-4 py-3 font-bold lg:px-6'
const td = 'px-4 py-3 lg:px-6'

export function SummaryTab({ courseId, onSelectCourse, version }: { courseId: string; onSelectCourse: (id: string) => void; version: number }) {
  const courses = useAsync(courseSummaries, [version])
  const students = useAsync(() => (courseId ? studentSummaries(courseId) : Promise.resolve([])), [courseId, version])

  if (courses.loading && !courses.data) return <TableSkeleton />
  if (courses.error) return <ErrorState message={courses.error} onRetry={() => void courses.reload()} />

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Attendance summary by course</caption>
          <thead><tr className="border-b border-indigo-50 text-xs uppercase tracking-wide text-muted"><th className={th}>Course</th><th className={th}>Sessions</th><th className={th}>Recorded</th><th className={th}>Late</th><th className={th}>Absent</th><th className={th}>Attendance</th></tr></thead>
          <tbody>{(courses.data ?? []).map((c) => (
            <tr key={c.course.id} className={`border-b border-indigo-50/70 ${c.course.id === courseId ? 'bg-brand-light' : 'hover:bg-brand-light/60'}`}>
              <td className={td}><button onClick={() => onSelectCourse(c.course.id)} className="text-left font-bold text-ink hover:text-brand">{c.course.course_code}<span className="block text-xs font-medium text-muted">{c.course.title}</span></button></td>
              <td className={td}>{c.sessions}</td><td className={td}>{c.recorded}</td><td className={td}>{c.late}</td><td className={td}>{c.absent}</td><td className={td}><AttendanceBadge value={c.percentage} /></td>
            </tr>))}</tbody>
        </table>
      </div>
      {courseId && (
        <section aria-label="Student attendance for the selected course" className="border-t border-indigo-50 pt-4">
          <h3 className="px-4 pb-3 text-sm font-bold text-ink lg:px-6">Students in {courses.data?.find((c) => c.course.id === courseId)?.course.course_code ?? 'selected course'}</h3>
          {students.loading ? <div className="px-6"><Skeleton className="h-32 w-full" /></div> : students.error ? <ErrorState message={students.error} />
            : (students.data ?? []).length === 0 ? <EmptyState title="No students enrolled" /> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr className="border-b border-indigo-50 text-xs uppercase tracking-wide text-muted"><th className={th}>Student</th><th className={th}>Attended / recorded</th><th className={th}>Late</th><th className={th}>Absent</th><th className={th}>Attendance</th></tr></thead>
                <tbody>{(students.data ?? []).map((s) => (
                  <tr key={s.student.id} className="border-b border-indigo-50/70"><td className={`${td} font-semibold`}>{s.student.full_name}<span className="block text-xs font-normal text-muted">{s.student.student_id}</span></td>
                    <td className={td}>{s.attended} / {s.recorded}</td><td className={td}>{s.late}</td><td className={td}>{s.absent}</td><td className={td}><AttendanceBadge value={s.percentage} /></td></tr>))}</tbody>
              </table></div>)}
        </section>)}
      <p className="px-4 pb-4 text-xs text-muted lg:px-6">Attendance % = (present + late) ÷ recorded sessions × 100. Absent does not count; unrecorded sessions are excluded.</p>
    </div>
  )
}
