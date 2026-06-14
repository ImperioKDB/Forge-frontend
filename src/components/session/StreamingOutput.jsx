"use client"

import { useEffect, useRef, useState } from "react"
import { useSSEStream } from "@/lib/hooks/useSSEStream"

function Cursor() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setVisible((v) => !v), 530)
    return () => clearInterval(t)
  }, [])
  return visible ? <span className="ml-0.5 inline-block h-3.5 w-2 bg-accent align-text-bottom" /> : null
}

function RetryBanner({ retryCount, maxRetries }) {
  return (
    <div className="flex items-center gap-2 border-b border-accent-line bg-accent-soft px-4 py-2 font-mono text-xs text-accent">
      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent" />
      Reconnecting… (attempt {retryCount}/{maxRetries})
    </div>
  )
}

/**
 * FORGE — StreamingOutput
 *
 * The "file header" treatment now reads as a mono filepath-style
 * label (matching the diff blocks elsewhere) rather than a faux
 * macOS window with traffic-light dots — fits the "this is code,
 * not chat" framing.
 */
export default function StreamingOutput({ streamUrl = null, content: staticContent = "", done: staticDone = false, title = "output" }) {
  const MAX_RETRIES = 10

  const { content: streamedContent, done: streamedDone, error: streamError, retrying, retryCount } = useSSEStream(streamUrl)

  const isLive = Boolean(streamUrl)
  const content = isLive ? streamedContent : staticContent
  const isDone = isLive ? streamedDone : staticDone
  const error = isLive ? streamError : null

  const bottomRef = useRef(null)

  useEffect(() => {
    if (content) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [content])

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-elevated px-4 py-2.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
        <span className="font-mono text-xs text-muted">{isDone ? title : isLive ? "streaming…" : title}</span>
        {isLive && !isDone && !error && <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-success" />}
        {isDone && (
          <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6L5 9L10 3" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {retrying && <RetryBanner retryCount={retryCount} maxRetries={MAX_RETRIES} />}

      <div className="flex-1 overflow-y-auto overflow-x-auto px-4 py-4">
        {error && !retrying && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-error/20 bg-error-soft p-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
              <path d="M7 2L12.5 11H1.5L7 2Z" stroke="var(--error)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 5.5v3M7 10h.01" stroke="var(--error)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <p className="font-mono text-xs text-error">{error}</p>
          </div>
        )}

        {!content && !error && (
          <div className="flex items-center gap-2 text-muted">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-success" />
            <span className="font-mono text-xs">Connecting to model…</span>
          </div>
        )}

        {content && (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-secondary">
            {content}
            {!isDone && <Cursor />}
          </pre>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
