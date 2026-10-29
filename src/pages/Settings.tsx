import { useState } from 'react'
import { Save } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../hooks/useToast'
import { updateOwnName, updateSettings } from '../services/settings'
import { errorText } from '../lib/errors'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Field, Select, inputCls } from '../components/ui/forms'
import { Button } from '../components/ui/Button'

const zones: string[] = (() => {
  try { return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone') } catch { return ['Asia/Kolkata', 'UTC'] }
})()

export default function Settings() {
  const { settings, reload } = useSettings()
  const { profile, session, refreshProfile } = useAuth()
  const toast = useToast()
  const [v, setV] = useState({ institution_name: settings.institution_name, academic_year: settings.academic_year, attendance_threshold: String(settings.attendance_threshold), attendance_critical_threshold: String(settings.attendance_critical_threshold), timezone: settings.timezone })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [nameBusy, setNameBusy] = useState(false)
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    const e: Record<string, string> = {}
    const t = Number(v.attendance_threshold), c = Number(v.attendance_critical_threshold)
    if (!v.institution_name.trim()) e.institution_name = 'Institution name is required.'
    if (!/^\d{4}-\d{4}$/.test(v.academic_year.trim())) e.academic_year = 'Use the format 2026-2027.'
    if (v.attendance_threshold === '' || Number.isNaN(t) || t < 0 || t > 100) e.attendance_threshold = 'Enter a value from 0 to 100.'
    if (v.attendance_critical_threshold === '' || Number.isNaN(c) || c < 0 || c > 100) e.attendance_critical_threshold = 'Enter a value from 0 to 100.'
    else if (!e.attendance_threshold && c > t) e.attendance_critical_threshold = 'Critical threshold cannot be higher than the warning threshold.'
    setErrs(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      await updateSettings({ institution_name: v.institution_name.trim(), academic_year: v.academic_year.trim(), attendance_threshold: t, attendance_critical_threshold: c, timezone: v.timezone })
      await reload(); toast.success('Settings saved.')
    } catch (err) { toast.error(errorText(err)) } finally { setBusy(false) }
  }

  const saveName = async () => {
    if (!session || !name.trim()) { toast.error('Enter your name.'); return }
    setNameBusy(true)
    try { await updateOwnName(session.user.id, name.trim()); await refreshProfile(); toast.success('Profile updated.') }
    catch (err) { toast.error(errorText(err)) } finally { setNameBusy(false) }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Institution details, attendance thresholds and your profile." />
      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 text-lg font-bold text-ink">Institution &amp; attendance</h2>
          <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); void save() }}>
            <Field label="Institution name" required error={errs.institution_name} htmlFor="inst"><input id="inst" className={inputCls} value={v.institution_name} onChange={set('institution_name')} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Academic year" required error={errs.academic_year} htmlFor="year"><input id="year" className={inputCls} value={v.academic_year} onChange={set('academic_year')} /></Field>
              <Field label="Time zone" htmlFor="tz" hint="Used for today's schedule and dates."><Select id="tz" value={v.timezone} onChange={set('timezone')} options={zones.map((z) => ({ value: z, label: z }))} /></Field>
              <Field label="Attendance target (%)" error={errs.attendance_threshold} htmlFor="thr" hint="At or above = green."><input id="thr" type="number" min={0} max={100} className={inputCls} value={v.attendance_threshold} onChange={set('attendance_threshold')} /></Field>
              <Field label="Critical below (%)" error={errs.attendance_critical_threshold} htmlFor="crit" hint="Below = rose; in between = amber."><input id="crit" type="number" min={0} max={100} className={inputCls} value={v.attendance_critical_threshold} onChange={set('attendance_critical_threshold')} /></Field>
            </div>
            <Button type="submit" loading={busy}><Save className="h-4 w-4" aria-hidden />Save settings</Button>
          </form>
        </GlassCard>
        <div className="space-y-6">
          <GlassCard>
            <h2 className="mb-4 text-lg font-bold text-ink">Your profile</h2>
            <div className="space-y-4">
              <Field label="Email" htmlFor="pemail"><input id="pemail" className={inputCls} value={session?.user.email ?? ''} disabled /></Field>
              <Field label="Full name" htmlFor="pname"><input id="pname" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Role" htmlFor="prole" hint="Roles can only be changed by the project owner in the Supabase SQL Editor."><input id="prole" className={inputCls} value={profile?.role === 'admin' ? 'Administrator' : 'Viewer'} disabled /></Field>
              <Button onClick={() => void saveName()} loading={nameBusy} variant="secondary">Update name</Button>
            </div>
          </GlassCard>
          <GlassCard>
            <h2 className="mb-2 text-lg font-bold text-ink">Demonstration data</h2>
            <p className="text-sm text-slate-600">All records are fictional. For safety the browser can never wipe the database (that would need privileged credentials). To reset the demo data, open the Supabase <b>SQL Editor</b> and run the “Reset demo data” snippet from the README, then run <code className="rounded bg-brand-light px-1">supabase/seed.sql</code> again.</p>
          </GlassCard>
        </div>
      </div>
    </>
  )
}
