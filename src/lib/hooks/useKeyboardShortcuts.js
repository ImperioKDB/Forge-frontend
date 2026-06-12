'use client'

/**
 * FORGE — Global Keyboard Shortcuts
 * Phase 2: Code Quality & DX
 */

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useKeyboardShortcuts({
  onSearch,
  onHelp,
  onSubmit,
  onEscape,
} = {}) {
  const router = useRouter()

  const handleKeyDown = useCallback((e) => {
    const isMeta = e.metaKey || e.ctrlKey
    const isShift = e.shiftKey
    const target = e.target

    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    if (isMeta && e.key === 'k' && !isShift) {
      e.preventDefault()
      onSearch?.()
    }

    if (isMeta && e.key === '/') {
      e.preventDefault()
      onHelp?.()
    }

    if (isMeta && e.key === 'Enter' && isTyping) {
      onSubmit?.()
    }

    if (e.key === 'Escape' && !isTyping) {
      onEscape?.()
    }

    if (!isTyping) {
      if (e.key === 'n' && window.__lastKey === 'g') {
        e.preventDefault()
        router.push('/app')
      }
      if (e.key === 's' && window.__lastKey === 'g') {
        e.preventDefault()
        router.push('/app/settings')
      }
      if (e.key === 'h' && window.__lastKey === 'g') {
        e.preventDefault()
        router.push('/')
      }
    }

    window.__lastKey = e.key
    setTimeout(() => { window.__lastKey = null }, 500)
  }, [onSearch, onHelp, onSubmit, onEscape, router])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function ShortcutHelp({ open, onClose }) {
  if (!open) return null

  const shortcuts = [
    { keys: ['⌘', 'K'], action: 'Search sessions' },
    { keys: ['⌘', '↵'], action: 'Submit form / Run Forge' },
    { keys: ['G', 'N'], action: 'Go to New Task' },
    { keys: ['G', 'S'], action: 'Go to Settings' },
    { keys: ['Esc'], action: 'Close modal / dropdown' },
    { keys: ['⌘', '/'], action: 'Show this help' },
  ]

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
            Keyboard Shortcuts
          </h2>
          <button onClick={onClose} className="text-muted hover:text-secondary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {shortcuts.map(({ keys, action }) => (
            <div key={action} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>{action}</span>
              <div className="flex gap-1">
                {keys.map(k => (
                  <kbd
                    key={k}
                    className="font-mono text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--bg-border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
