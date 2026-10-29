export type Role = 'admin' | 'viewer'
export type AttendanceStatus = 'present' | 'absent' | 'late'
export type Priority = 'informational' | 'important' | 'urgent'

export interface Profile {
  id: string
  full_name: string | null
  role: Role
}

export interface Settings {
  id: number
  institution_name: string
  academic_year: string
  attendance_threshold: number
  attendance_critical_threshold: number
  timezone: string
}

export interface Student {
  id: string
  student_id: string
  full_name: string
  email: string
  phone: string | null
  department: string
  program: string | null
  semester: number
  section: string | null
  enrollment_date: string
  status: 'active' | 'inactive' | 'graduated' | 'suspended'
}

export interface Faculty {
  id: string
  faculty_id: string
  full_name: string
  email: string
  phone: string | null
  department: string
  designation: string | null
  specialization: string | null
  status: 'active' | 'on_leave' | 'retired' | 'inactive'
}

export interface Course {
  id: string
  course_code: string
  title: string
  description: string | null
  department: string
  semester: number
  credits: number
  faculty_id: string | null
  status: 'active' | 'inactive' | 'archived'
  faculty?: { id: string; full_name: string } | null
  student_courses?: { count: number }[]
}

export interface Enrolment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  students?: Pick<Student, 'id' | 'student_id' | 'full_name' | 'department' | 'semester' | 'status'>
  courses?: Pick<Course, 'id' | 'course_code' | 'title'>
}

export interface AttendanceRecord {
  id: string
  student_id: string
  course_id: string
  attendance_date: string
  status: AttendanceStatus
  students?: Pick<Student, 'student_id' | 'full_name'>
  courses?: Pick<Course, 'course_code' | 'title'>
}

export interface TimetableEntry {
  id: string
  course_id: string
  faculty_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
  room: string
  section: string | null
  courses?: Pick<Course, 'id' | 'course_code' | 'title'>
  faculty?: { id: string; full_name: string } | null
}

export interface Assignment {
  id: string
  title: string
  description: string | null
  course_id: string
  faculty_id: string | null
  due_date: string
  max_marks: number
  status: 'draft' | 'published' | 'closed'
  created_at: string
  courses?: Pick<Course, 'id' | 'course_code' | 'title'>
  faculty?: { id: string; full_name: string } | null
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  submitted_at: string
  status: 'submitted' | 'late' | 'graded' | 'missing'
  marks_obtained: number | null
  feedback: string | null
  students?: Pick<Student, 'student_id' | 'full_name'>
}

export interface Announcement {
  id: string
  title: string
  description: string
  category: 'general' | 'academic' | 'exams' | 'events' | 'administrative'
  priority: Priority
  author_id: string | null
  published_at: string
  status: 'draft' | 'published' | 'archived'
  profiles?: { full_name: string | null } | null
}

export interface AttendanceSummary {
  recorded: number
  attended: number
  late: number
  absent: number
  percentage: number | null
}

export interface InsightItem {
  id: string
  title: string
  description: string
  priority: 'urgent' | 'warning' | 'info'
  timestamp: string
  link: string
}
