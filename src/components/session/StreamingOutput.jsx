'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StreamingOutput({ streamUrl, title, onComplete, onError }) {
  const [content, setContent] = useState('')
  const [done, setDone] = useState(false)
  const [cursor, setCursor] = useState(true)
  const bottomRef = useRef(null)
  const readerRef = useRef(null)

  useEffect(() => {
    if (!streamUrl) return

    let cancelled = false

    async function startStream() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${streamUrl}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        })

        if (!res.ok) {
          const err = await res.json()
          onError?.(err.error || 'Stream failed')
          return
        }

        const reader = res.body.getReader()
        readerRef.current = reader
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done: streamDone, value } = await reader.read()
          if (streamDone || cancelled) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() // keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue

            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()

              if (data === '[DONE]') {
                setDone(true)
                onComplete?.()
                return
              }

              try {
                const parsed = JSON.parse(data)

                if (parsed.error) {
                  onError?.(parsed.error)
                  return
                }

                if (parsed.token) {
                  setContent(prev => prev + parsed.token)
                }

                if (parsed.explanation) {
                  onComplete?.(parsed.explanation)
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }
      } catch (err) {
        if (!cancelled) onError?.(err.message)
      }
    }

    startStream()

    return () => {
      cancelled = true
      readerRef.current?.cancel()
    }
  }, [streamUrl])

  // Cursor blink
  useEffect(() => {
    if (done) { setCursor(false); return }
    const interval = setInterval(() => setCursor(p => !p), 500)
    return () => clearInterval(interval)
  }, [done])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [content])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/40" />
          </div>
          <span className="text-xs font-mono text-muted ml-1">{title}</span>
        </div>
        {!done && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-muted font-mono">streaming</span>
          </div>
        )}
        {done && (
          <div className="flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 3" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs text-success font-mono">done</span>
          </div>
        )}
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4">
        {!content && !done ? (
          <div className="flex items-center gap-2 text-muted">
            <span className="w-3 h-3 border border-muted border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Connecting to model…</span>
          </div>
        ) : (
          <pre className="font-mono text-xs text-secondary leading-relaxed whitespace-pre-wrap break-words">
            {content}
            {!done && cursor && (
              <span className="inline-block w-2 h-3.5 bg-accent ml-0.5 align-text-bottom" />
            )}
          </pre>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
