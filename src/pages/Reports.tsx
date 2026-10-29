import { useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../hooks/useToast'
import { loadReports, type ReportFilters, type Slice } from '../services/reports'
import { listCoursesLite } from '../services/courses'
import { downloadCsv } from '../utils/csv'
import { DEPARTMENTS, SEMESTERS } from '../utils/constants'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Field, Select, inputCls } from '../components/ui/forms'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/feedback'

const PALETTE = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#ec4899']
const ATT_COLORS: Record<string, string> = { Present: '#10b981', Late: '#f59e0b', Absent: '#f43f5e' }

function ChartCard({ title, description, data, csvName, csvHeader, children }: { title: string; description: string; data: Slice[]; csvName: string; csvHeader: string; children: ReactNode }) {
  const toast = useToast()
  const empty = data.length === 0 || data.every((d) => d.value === 0)
  const total = data.reduce((s, d) => s + d.value, 0)
  const exportIt = () => { if (!downloadCsv(csvName, data.map((d) => ({ [csvHeader]: d.name, Count: d.value })))) toast.error('There is no data to export for the current filters.') }
  return (
    <GlassCard>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-bold text-ink">{title}</h2><p className="text-xs text-muted">{description}</p></div>
        <Button size="sm" variant="secondary" onClick={exportIt} aria-label={`Export ${title} as CSV`}><Download className="h-4 w-4" aria-hidden />CSV</Button>
      </div>
      {empty ? <EmptyState title="No data for these filters" message="Adjust the filters or add records to see this chart." /> : (
        <>
          <div role="img" aria-label={`${title}. ${data.map((d) => `${d.name}: ${d.value}`).join('; ')}. Total ${total}.`} className="h-64 w-full">{children}</div>
          <table className="sr-only"><caption>{title}</caption><thead><tr><th>{csvHeader}</th><th>Count</th></tr></thead><tbody>{data.map((d) => <tr key={d.name}><td>{d.name}</td><td>{d.value}</td></tr>)}</tbody></table>
        </>)}
    </GlassCard>
  )
}

const BarBlock = ({ data, color = '#6366f1' }: { data: Slice[]; color?: string }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} tickLine={false} />
      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
      <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
      <Bar dataKey="value" name="Count" fill={color} radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
)

const PieBlock = ({ data, colorFor }: { data: Slice[]; colorFor: (name: string, i: number) => string }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} label={({ name, value }) => `${name}: ${value}`}>
        {data.map((d, i) => <Cell key={d.name} fill={colorFor(d.name, i)} />)}
      </Pie>
      <Tooltip /><Legend />
    </PieChart>
  </ResponsiveContainer>
)

export default function Reports() {
  const [f, setF] = useState<ReportFilters>({ department: '', semester: '', courseId: '', from: '', to: '' })
  const set = (k: keyof ReportFilters) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))
  const courses = useAsync(listCoursesLite, [])
  const { data, error, loading, reload } = useAsync(() => loadReports(f), [f])
  const att = data?.attendance ?? []
  const attTotal = att.reduce((s, a) => s + a.value, 0)
  const attPct = attTotal ? Math.round(((att.filter((a) => a.name !== 'Absent').reduce((s, a) => s + a.value, 0)) / attTotal) * 1000) / 10 : null

  return (
    <>
      <PageHeader title="Reports" subtitle="Charts calculated live from your campus records. CSV exports match the active filters." />
      <GlassCard className="mb-6 !p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Department" htmlFor="rdept"><Select id="rdept" value={f.department} onChange={set('department')} placeholder="All departments" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} /></Field>
          <Field label="Semester" htmlFor="rsem"><Select id="rsem" value={f.semester} onChange={set('semester')} placeholder="All semesters" options={SEMESTERS.map((s) => ({ value: s, label: `Semester ${s}` }))} /></Field>
          <Field label="Course (attendance, assignments)" htmlFor="rcourse"><Select id="rcourse" value={f.courseId} onChange={set('courseId')} placeholder="All courses" options={(courses.data ?? []).map((c) => ({ value: c.id, label: c.course_code }))} /></Field>
          <Field label="Attendance from" htmlFor="rfrom"><input id="rfrom" type="date" className={inputCls} value={f.from} onChange={set('from')} /></Field>
          <Field label="Attendance to" htmlFor="rto"><input id="rto" type="date" className={inputCls} value={f.to} onChange={set('to')} /></Field>
        </div>
        <p className="mt-3 text-xs text-muted">Department and semester apply to students, courses and faculty; the attendance chart uses the course and date range. The attendance chart is not affected by department/semester.</p>
      </GlassCard>
      {error ? <GlassCard><ErrorState message={error} onRetry={() => void reload()} /></GlassCard>
        : loading && !data ? <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <GlassCard key={i}><Skeleton className="h-72 w-full" /></GlassCard>)}</div>
        : data && (
          <div className={`grid gap-6 lg:grid-cols-2 ${loading ? 'opacity-60 transition-opacity' : ''}`}>
            <ChartCard title="Student enrolment by department" description="Number of students in each department." data={data.enrollmentByDepartment} csvName="students-by-department.csv" csvHeader="Department"><BarBlock data={data.enrollmentByDepartment} /></ChartCard>
            <ChartCard title="Attendance distribution" description={attPct === null ? 'No attendance recorded.' : `Present + late = ${attPct}% of ${attTotal} recorded entries.`} data={att} csvName="attendance-distribution.csv" csvHeader="Status"><PieBlock data={att} colorFor={(n) => ATT_COLORS[n]} /></ChartCard>
            <ChartCard title="Course enrolment" description="Students enrolled per course." data={data.courseEnrollment.map(({ name, value }) => ({ name, value }))} csvName="course-enrolment.csv" csvHeader="Course"><BarBlock data={data.courseEnrollment} color="#8b5cf6" /></ChartCard>
            <ChartCard title="Faculty distribution" description="Faculty members per department." data={data.facultyByDepartment} csvName="faculty-by-department.csv" csvHeader="Department"><PieBlock data={data.facultyByDepartment} colorFor={(_, i) => PALETTE[i % PALETTE.length]} /></ChartCard>
            <div className="lg:col-span-2"><ChartCard title="Assignment status" description="Published assignments are 'Overdue (open)' once the due date has passed." data={data.assignmentStatus} csvName="assignment-status.csv" csvHeader="Status"><BarBlock data={data.assignmentStatus} color="#f59e0b" /></ChartCard></div>
          </div>)}
    </>
  )
}
