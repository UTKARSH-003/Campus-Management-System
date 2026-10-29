import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import { NAV_ITEMS } from './nav'
import { Brand } from './Brand'
import { useAuth } from '../../hooks/useAuth'

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const name = profile?.full_name || 'Campus Administrator'
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="flex h-full flex-col p-5">
      <div className="mb-8 px-1"><Brand /></div>
      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition-all duration-200 ${
                isActive ? 'bg-brand font-bold text-white shadow-[0_10px_15px_-3px_rgba(99,102,241,0.3)]'
                         : 'font-semibold text-slate-600 hover:bg-brand-light hover:text-ink'}`}>
            <Icon className="h-5 w-5" aria-hidden />{label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 rounded-2xl bg-brand-light p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white" aria-hidden>{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{name}</p>
            <p className="text-xs text-muted">{profile?.role === 'admin' ? 'Administrator' : 'Viewer'}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => { navigate('/settings'); onNavigate?.() }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-xs font-bold text-ink hover:bg-indigo-50">
            <Settings className="h-3.5 w-3.5" aria-hidden />Profile
          </button>
          <button onClick={() => void signOut()} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
            <LogOut className="h-3.5 w-3.5" aria-hidden />Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-white/60 bg-white/90 backdrop-blur-[20px] lg:block">
      <SidebarContent />
    </aside>
  )
}
