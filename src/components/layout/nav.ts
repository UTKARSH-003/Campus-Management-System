import { BarChart3, Bell, BookOpen, CalendarDays, ClipboardCheck, ClipboardList, GraduationCap, LayoutDashboard, Settings, Users, type LucideIcon } from 'lucide-react'

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean }

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/students', label: 'Students', icon: GraduationCap },
  { to: '/faculty', label: 'Faculty', icon: Users },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/announcements', label: 'Announcements', icon: Bell },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]
