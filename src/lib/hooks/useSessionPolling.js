/**
 * FORGE -- useSessionPolling
 * Fix: useRef for interval ID prevents stale-closure / multiple-interval
 * bug on rapid sessionId changes. Terminal states stop polling immediately.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/supabase/api'

const TERMINAL_STATES = new Set(['done', 'failed', 'partial_success'])
const POLL_MS = 3000

export function useSessionPolling(sessionId) {
  const [session,  setSession]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const intervalRef = useRef(null)

  const fetchSession = useCallback(async () => {
    if (!sessionId) return
    try {
      const data = await apiFetch(`/agent/session/${sessionId}`)
      setSession(data.session)
      setError(null)

      // Stop polling on terminal state
      if (TERMINAL_STATES.has(data.session?.status)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const refetch = useCallback(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (!sessionId) return

    // Clear any existing interval before starting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setLoading(true)
    fetchSession()

    intervalRef.current = setInterval(fetchSession, POLL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [sessionId, fetchSession])

  return { session, loading, error, refetch }
}
