/**
 * FORGE -- useSSEStream
 * fetch-based SSE hook with Bearer auth, token accumulation,
 * [DONE] detection, and exponential backoff reconnection.
 *
 * Why not EventSource: the browser's native EventSource cannot send
 * Authorization headers. fetch + ReadableStream is the correct workaround.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const API_BASE     = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const MAX_RETRIES  = 10
const BASE_DELAY   = 1000   // 1s
const MAX_DELAY    = 30000  // 30s cap

async function getToken() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * Parse a raw SSE chunk (may contain multiple events separated by blank lines).
 * Returns array of { eventType, data } objects.
 * Handles both named (event: token) and unnamed (data only) formats.
 */
function parseSSEChunk(text) {
  const events = []
  const blocks = text.split(/\n\n+/)

  for (const block of blocks) {
    if (!block.trim()) continue
    let eventType = 'message'
    let dataLines = []

    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
      // ignore id: and retry: lines
    }

    if (dataLines.length > 0) {
      events.push({ eventType, data: dataLines.join('\n') })
    }
  }

  return events
}

/**
 * Extract a text token from a parsed SSE data string.
 * Handles:
 *   - Plain string "[DONE]"
 *   - JSON { token: "..." }
 *   - JSON { type: "error", message: "..." }
 *   - JSON { explanation: "..." }  (used during coding phase)
 * Returns { token, isDone, isError, errorMessage }
 */
function extractToken(rawData) {
  // DONE signal — either bare string or JSON wrapper
  if (rawData === '[DONE]') return { isDone: true }

  let parsed = null
  try {
    parsed = JSON.parse(rawData)
  } catch {
    // plain text token (unlikely but handle it)
    return { token: rawData }
  }

  if (parsed === '[DONE]') return { isDone: true }
  if (parsed?.type === 'done' || parsed?.done === true) return { isDone: true }
  if (parsed?.type === 'error') return { isError: true, errorMessage: parsed.message || 'Stream error' }

  // Token types: { token }, { text }, { explanation }
  const token = parsed?.token ?? parsed?.text ?? parsed?.explanation ?? null
  if (token !== null) return { token: String(token) }

  // Unknown shape — ignore silently
  return {}
}

/**
 * useSSEStream(streamPath)
 *
 * @param {string|null} streamPath  - relative path e.g. "/agent/session/123/stream-plan"
 *                                    Pass null to disconnect.
 * @returns {{ content, done, error, retrying, retryCount }}
 */
export function useSSEStream(streamPath) {
  const [content,    setContent]    = useState('')
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState(null)
  const [retrying,   setRetrying]   = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Stable refs so the async loop sees current values without re-creating
  const abortRef     = useRef(null)
  const retryRef     = useRef(0)
  const mountedRef   = useRef(true)
  const streamRef    = useRef(streamPath)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const connect = useCallback(async (path, attempt) => {
    if (!path || !mountedRef.current) return

    // Cancel any previous connection
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const token = await getToken()
      if (!mountedRef.current) return

      const res = await fetch(`${API_BASE}${path}`, {
        headers: {
          'Accept':        'text/event-stream',
          'Cache-Control': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      })

      if (!res.ok) {
        const msg = `SSE connection failed: HTTP ${res.status}`
        if (mountedRef.current) setError(msg)
        scheduleRetry(path, attempt)
        return
      }

      if (!res.body) {
        if (mountedRef.current) setError('Browser does not support streaming responses')
        return
      }

      // Reset error + retry state on successful connection
      if (mountedRef.current) {
        setError(null)
        setRetrying(false)
        setRetryCount(0)
        retryRef.current = 0
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { value, done: streamDone } = await reader.read()
        if (!mountedRef.current) { reader.cancel(); return }

        if (streamDone) {
          // Stream closed by server without [DONE] -- treat as done
          if (mountedRef.current) setDone(true)
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE events (terminated by blank line)
        // Keep incomplete trailing data in buffer
        const lastBlank = buffer.lastIndexOf('\n\n')
        if (lastBlank === -1) continue

        const toProcess = buffer.slice(0, lastBlank + 2)
        buffer = buffer.slice(lastBlank + 2)

        const events = parseSSEChunk(toProcess)

        for (const { eventType, data } of events) {
          if (!mountedRef.current) break

          // Named "done" event
          if (eventType === 'done') { setDone(true); return }

          const { token, isDone, isError, errorMessage } = extractToken(data)

          if (isDone) { setDone(true); return }
          if (isError) { setError(errorMessage); return }
          if (token) setContent(prev => prev + token)
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return  // intentional cancel
      if (!mountedRef.current) return
      setError(err.message)
      scheduleRetry(path, attempt)
    }
  }, [])

  function scheduleRetry(path, attempt) {
    if (!mountedRef.current) return
    if (attempt >= MAX_RETRIES) {
      setError(`Stream failed after ${MAX_RETRIES} attempts. Refresh to retry.`)
      setRetrying(false)
      return
    }

    const delay = Math.min(BASE_DELAY * 2 ** attempt, MAX_DELAY)
    setRetrying(true)
    setRetryCount(attempt + 1)

    setTimeout(() => {
      if (mountedRef.current && streamRef.current === path) {
        connect(path, attempt + 1)
      }
    }, delay)
  }

  // Re-run whenever streamPath changes
  useEffect(() => {
    streamRef.current = streamPath

    // Reset state for new stream
    setContent('')
    setDone(false)
    setError(null)
    setRetrying(false)
    setRetryCount(0)
    retryRef.current = 0

    if (!streamPath) {
      if (abortRef.current) abortRef.current.abort()
      return
    }

    connect(streamPath, 0)

    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [streamPath, connect])

  return { content, done, error, retrying, retryCount }
}
