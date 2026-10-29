import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut, Menu, Settings as SettingsIcon } from 'lucide-react'
import { NAV_ITEMS } from './nav'
import { GlobalSearch } from './GlobalSearch'
import { Notifications } from './Notifications'
import { useAuth } from '../../hooks/useAuth'
import { useDismiss } from './useClickOutside'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const { profile, signOut } = useAuth()
  const [menu, setMenu] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, menu, () => setMenu(false))

  const current = NAV_ITEMS.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label ?? 'Dashboard'
  const name = profile?.full_name || 'Campus Administrator'
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const btn = 'flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-indigo-100 bg-white text-slate-600 hover:bg-brand-light'

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/40 px-4 py-3 backdrop-blur-md lg:px-8">
      <div className="flex min-h-[56px] items-center gap-3 lg:min-h-[56px]">
        <button onClick={onMenu} aria-label="Open navigation menu" className={`${btn} lg:hidden`}><Menu className="h-5 w-5" /></button>
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 truncate text-sm">
          <ol className="flex items-center gap-1.5 font-semibold">
            <li className="text-muted"><Link to="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden className="text-muted">/</li>
            <li aria-current="page" className="truncate text-ink">{current}</li>
          </ol>
        </nav>
        <GlobalSearch className="hidden md:block" />
        <Notifications />
        <Link to="/settings" aria-label="Settings" className={`${btn} hidden sm:flex`}><SettingsIcon className="h-5 w-5" aria-hidden /></Link>
        <div ref={ref} className="relative">
          <button onClick={() => setMenu((m) => !m)} aria-label="Profile menu" aria-expanded={menu}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{initials}</button>
          {menu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-indigo-100 bg-white p-2 shadow-xl">
              <div className="px-3 py-2"><p className="truncate text-sm font-bold text-ink">{name}</p><p className="text-xs text-muted">Administrator</p></div>
              <Link to="/settings" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink hover:bg-brand-light"><SettingsIcon className="h-4 w-4" aria-hidden />Settings</Link>
              <button onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" aria-hidden />Sign out</button>
            </div>
          )}
        </div>
      </div>
      <GlobalSearch className="mt-2 md:hidden" />
    </header>
  )
}
