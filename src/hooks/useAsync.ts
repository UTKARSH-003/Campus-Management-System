import { useCallback, useEffect, useRef, useState } from 'react'
import { errorText } from '../lib/errors'

/** Run an async loader when `deps` change; ignores out-of-date responses. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const ticket = useRef(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async () => {
    const mine = ++ticket.current
    setLoading(true)
    try {
      const result = await fnRef.current()
      if (mine === ticket.current) { setData(result); setError(null) }
    } catch (e) {
      if (mine === ticket.current) setError(errorText(e))
    } finally {
      if (mine === ticket.current) setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void run() }, deps)
  return { data, error, loading, reload: run }
}
