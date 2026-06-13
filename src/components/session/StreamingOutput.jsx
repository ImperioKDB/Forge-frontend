'use client'

import { useEffect, useRef, useState } from 'react'

export default function StreamingOutput({ content = '', done = false }) {
  const bottomRef = useRef(null)
  const [cursor, setCursor] = useState(true)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [content])
  useEffect(() => {
    if (done) { setCursor(false); return }
    const t = setInterval(() => setCursor(v => !v), 530)
    return () => clearInterval(t)
  }, [done])

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--bg-border)', background: 'var(--bg-elevated)' }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--error)', opacity: 0.6 }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--warning)', opacity: 0.6 }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--success)', opacity: 0.6 }} />
        </div>
        <span className="font-mono text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{done ? 'output' : 'streaming…'}</span>
        {!done && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)', animation: 'forge-pulse 2s ease-in-out infinite' }} />}
      </div>
      <div className="px-4 py-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
        {!content ? (
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)', animation: 'forge-pulse 2s ease-in-out infinite' }} />
            <span className="text-xs font-mono">Connecting to model…</span>
          </div>
        ) : (
          <pre className="font-mono text-xs text-secondary leading-relaxed whitespace-pre-wrap break-words">
            {content}
            {!done && cursor && <span className="inline-block w-2 h-3.5 bg-accent ml-0.5 align-text-bottom" />}
          </pre>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
