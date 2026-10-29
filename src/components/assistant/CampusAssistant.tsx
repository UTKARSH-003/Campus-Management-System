import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, Loader2, Send, X } from 'lucide-react'
import { askAssistant, SUGGESTIONS, type AssistantReply } from '../../services/assistant'
import { getInsights } from '../../services/insights'
import { useSettings } from '../../hooks/useSettings'
import { errorText } from '../../lib/errors'

interface Msg { from: 'user' | 'bot'; text: string; lines?: string[]; link?: AssistantReply['link']; error?: boolean }

export function CampusAssistant() {
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  const [badge, setBadge] = useState(0)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: 'Hi! I am the Campus Assistant. I answer a fixed set of questions using your live campus records (rule-based, not an AI model).', lines: SUGGESTIONS }])
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { getInsights(settings).then((i) => setBadge(i.length)).catch(() => setBadge(0)) }, [settings])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs, busy])
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const ask = async (q: string) => {
    const text = q.trim()
    if (!text || busy) return
    setMsgs((m) => [...m, { from: 'user', text }]); setInput(''); setBusy(true)
    try {
      const r = await askAssistant(text)
      setMsgs((m) => [...m, { from: 'bot', ...r }])
    } catch (e) {
      setMsgs((m) => [...m, { from: 'bot', text: `I could not load that data: ${errorText(e)}`, error: true }])
    } finally { setBusy(false) }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); void ask(input) }

  return (
    <>
      {open && (
        <section role="dialog" aria-label="Campus Assistant" className="fixed bottom-24 right-4 z-50 flex h-[min(540px,calc(100vh-8rem))] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-2xl sm:right-6">
          <header className="flex items-center justify-between bg-brand px-5 py-4 text-white">
            <div className="flex items-center gap-2"><BrainCircuit className="h-5 w-5" aria-hidden /><h2 className="font-bold">Campus Assistant</h2></div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-1 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm ${m.from === 'user' ? 'bg-brand text-white' : m.error ? 'bg-rose-50 text-rose-700' : 'bg-brand-light text-ink'}`}>
                  <p>{m.text}</p>
                  {m.lines && (m.from === 'bot' && m.text.startsWith('Hi') || m.text.startsWith('Sorry')
                    ? <div className="mt-2 flex flex-wrap gap-1.5">{m.lines.map((s) => <button key={s} onClick={() => void ask(s)} className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-dark hover:bg-indigo-50">{s}</button>)}</div>
                    : <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">{m.lines.map((l) => <li key={l}>{l}</li>)}</ul>)}
                  {m.link && <Link to={m.link.to} onClick={() => setOpen(false)} className="mt-2 inline-block text-xs font-bold text-brand underline">{m.link.label}</Link>}
                </div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Looking that up...</div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={submit} className="flex gap-2 border-t border-indigo-50 p-3">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} aria-label="Ask the assistant" placeholder="Ask about students, classes..."
              className="min-w-0 flex-1 rounded-xl border border-indigo-100 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30" />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send question" className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
        </section>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close Campus Assistant' : 'Open Campus Assistant'} aria-expanded={open}
        className="assistant-bounce fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_20px_25px_-5px_rgba(99,102,241,0.5)] transition-transform hover:scale-110 active:scale-95 sm:right-6">
        <BrainCircuit className="h-7 w-7" aria-hidden />
        {badge > 0 && !open && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-accent px-1 text-[10px] font-bold text-white">{badge > 9 ? '9+' : badge}</span>}
      </button>
    </>
  )
}
