import { run, supabase } from './db'
import type { Settings } from '../types'

export const getSettings = () => run<Settings>(supabase.from('settings').select('*').eq('id', 1).single())

export const updateSettings = (v: Omit<Settings, 'id'>) =>
  run<Settings>(supabase.from('settings').update(v).eq('id', 1).select().single())

export const updateOwnName = (userId: string, fullName: string) =>
  run(supabase.from('profiles').update({ full_name: fullName }).eq('id', userId))
