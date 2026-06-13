'use client'

/**
 * FORGE -- StreamingOutput
 * Rewritten: consumes useSSEStream for live mode (streamUrl prop),
 * falls back to static content/done props for read-only display.
 *
 * SessionPage passes streamUrl. CodeReview passes content + done.
 * Both paths share the same render output.
 */

import { useEffect, useRef, useState } from 'react'
import { useSSEStream } from '@/lib/hooks/useSSEStream'

// ─── CURSOR ------------------------------------------------------------------
function Cursor() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setVisible(v => !v), 530)
    return () => clearInterval(t)
  }, [])
  return visible
    ? <span className="inline-block w-2 h-3.5 ml-0.5 align-text-bottom" style={{ background: 'var(--accent)' }} />
    : null
}

// ─── RETRY BANNER ------------------------------------------------------------
function RetryBanner({ retryCount, maxRetries }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-xs font-mono"
      style={{
        background: 'rgba(232,103,26,0.06)',
        borderBottom: '1px solid rgba(232,103,26,0.15)',
        color: 'var(--accent)',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: 'var(--accent)', animation: 'forge-pulse 1.5s ease-in-out infinite' }}
      />
      Reconnecting... (attempt {retryCount}/{maxRetries})
    </div>
  )
}

// ─── COMPONENT ---------------------------------------------------------------
export default function StreamingOutput({
  streamUrl = null,
  content:  staticContent = '',
  done:     staticDone    = false,
  title     = 'output',
}) {
  const MAX_RETRIES = 10

  // Live mode: hook manages the connection
  const {
    content:   streamedContent,
    done:      streamedDone,
    error:     streamError,
    retrying,
    retryCount,
  } = useSSEStream(streamUrl)

  // Which content/done to render depends on mode
  const isLive    = Boolean(streamUrl)
  const content   = isLive ? streamedContent : staticContent
  const isDone    = isLive ? streamedDone    : staticDone
  const error     = isLive ? streamError     : null

  const bottomRef = useRef(null)

  // Auto-scroll on new content
  useEffect(() => {
    if (content) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [content])

  return (
    <div
      className="relative flex flex-col rounded-lg overflow-hidden h-full"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--bg-border)', background: 'var(--bg-elevated)' }}
      >
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--error)',   opacity: 0.6 }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--warning)', opacity: 0.6 }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--success)', opacity: 0.6 }} />
        </div>
        <span className="font-mono text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
          {isDone ? title : (isLive ? 'streaming...' : title)}
        </span>
        {isLive && !isDone && !error && (
          <span
            className="ml-auto w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--success)', animation: 'forge-pulse 2s ease-in-out infinite' }}
          />
        )}
        {isDone && (
          <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Retry banner */}
      {retrying && <RetryBanner retryCount={retryCount} maxRetries={MAX_RETRIES} />}

      {/* Content */}
      <div className="flex-1 px-4 py-4 overflow-y-auto overflow-x-auto">
        {error && !retrying && (
          <div
            className="flex items-start gap-2 p-3 rounded mb-4"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
              <path d="M7 2L12.5 11H1.5L7 2Z" stroke="var(--error)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 5.5v3M7 10h.01" stroke="var(--error)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <p className="font-mono text-xs" style={{ color: 'var(--error)' }}>{error}</p>
          </div>
        )}

        {!content && !error && (
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--success)', animation: 'forge-pulse 2s ease-in-out infinite' }}
            />
            <span className="text-xs font-mono">Connecting to model...</span>
          </div>
        )}

        {content && (
          <pre className="font-mono text-xs text-secondary leading-relaxed whitespace-pre-wrap break-words">
            {content}
            {!isDone && <Cursor />}
          </pre>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
