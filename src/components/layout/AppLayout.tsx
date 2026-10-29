import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sidebar, SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'
import { CampusAssistant } from '../assistant/CampusAssistant'

export function AppLayout() {
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => { setDrawer(false); window.scrollTo(0, 0) }, [pathname])
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawer])

  return (
    <div className="animated-background min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold">Skip to content</a>
      <Sidebar />
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-2xl">
            <button onClick={() => setDrawer(false)} aria-label="Close navigation menu" className="absolute right-3 top-5 z-10 rounded-lg p-1.5 text-muted hover:bg-brand-light"><X className="h-5 w-5" /></button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}
      <div className="lg:pl-[280px]">
        <Topbar onMenu={() => setDrawer(true)} />
        <main id="main" className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8"><Outlet /></main>
      </div>
      <CampusAssistant />
    </div>
  )
}
