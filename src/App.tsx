import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Faculty from './pages/Faculty'
import Courses from './pages/Courses'
import Attendance from './pages/Attendance'
import Timetable from './pages/Timetable'
import Assignments from './pages/Assignments'
import Announcements from './pages/Announcements'
import Settings from './pages/Settings'

const Reports = lazy(() => import('./pages/Reports')) // Recharts is large; load it only when needed

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="faculty" element={<Faculty />} />
              <Route path="courses" element={<Courses />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="reports" element={<Suspense fallback={<Loader2 className="mx-auto mt-20 h-8 w-8 animate-spin text-brand" aria-label="Loading" />}><Reports /></Suspense>} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
