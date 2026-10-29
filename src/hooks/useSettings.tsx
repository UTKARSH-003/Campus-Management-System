import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSettings } from '../services/settings'
import type { Settings } from '../types'

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  institution_name: 'Demo University',
  academic_year: '2026-2027',
  attendance_threshold: 75,
  attendance_critical_threshold: 60,
  timezone: 'Asia/Kolkata',
}

interface SettingsState {
  settings: Settings
  loading: boolean
  reload: () => Promise<void>
}
const SettingsContext = createContext<SettingsState | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      setSettings(await getSettings())
    } catch {
      /* keep defaults; the Settings page surfaces errors explicitly */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const value = useMemo(() => ({ settings, loading, reload }), [settings, loading, reload])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
