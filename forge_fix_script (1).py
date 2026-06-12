#!/usr/bin/env python3
"""
FORGE Frontend — Complete Fix Script
====================================
Addresses all gaps from the 2026-06-12 Roadmap Status Report.
Run this in your project root to apply all fixes.
"""

import os
import shutil
from pathlib import Path

# CONFIGURATION
PROJECT_ROOT = Path("src")
BACKUP_DIR = Path(".forge-fix-backup")

# Files to remove (dead code)
DEAD_FILES = [
    "components/ui/app/Sidebar.jsx",
    "components/ui/app/TaskInput.jsx",
]

def backup_file(path):
    backup_path = BACKUP_DIR / path
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    src = PROJECT_ROOT / path
    if src.exists():
        shutil.copy2(src, backup_path)
        print(f"  📦 Backed up: {path}")

def write_file(path, content):
    full_path = PROJECT_ROOT / path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_text(content, encoding='utf-8')
    print(f"  ✅ Created: {path}")

def remove_file(path):
    full_path = PROJECT_ROOT / path
    if full_path.exists():
        backup_file(path)
        full_path.unlink()
        print(f"  🗑️  Removed: {path}")

def apply_color_fixes():
    fixes_applied = []
    color_fixes = {
        'components/session/StreamingOutput.jsx': [
            ('stroke="#06b6d4"', 'stroke="var(--success)"'),
        ],
        'components/session/SubtaskRail.jsx': [
            ('stroke="#06b6d4"', 'stroke="var(--success)"'),
        ],
        'components/ui/app/RepoSelector.jsx': [
            ('stroke="#2563EB"', 'stroke="var(--accent)"'),
        ],
    }

    for filename, replacements in color_fixes.items():
        path = PROJECT_ROOT / filename
        if path.exists():
            content = path.read_text(encoding='utf-8')
            original = content
            for old, new in replacements:
                content = content.replace(old, new)
            if content != original:
                backup_file(filename)
                path.write_text(content, encoding='utf-8')
                fixes_applied.append(filename)
    return fixes_applied

def main():
    print("=" * 60)
    print("FORGE Frontend — Complete Fix Script")
    print("=" * 60)

    BACKUP_DIR.mkdir(exist_ok=True)
    print(f"\n📁 Backup directory: {BACKUP_DIR}")

    # 1. Error Boundary
    print("\n🔴 1. Creating Error Boundary...")
    write_file('components/ui/ErrorBoundary.jsx', ERROR_BOUNDARY_JSX)

    # 2. Toast System
    print("\n🟠 2. Creating Toast Notification System...")
    write_file('components/ui/Toast.jsx', TOAST_JSX)

    # 3. Keyboard Shortcuts
    print("\n🟡 3. Creating Keyboard Shortcuts...")
    write_file('lib/hooks/useKeyboardShortcuts.js', KEYBOARD_JS)

    # 4. Scroll Reveal
    print("\n🟢 4. Creating Scroll Reveal Hook...")
    write_file('lib/hooks/useScrollReveal.js', SCROLL_REVEAL_JS)

    # 5. GitHub Colab Script
    print("\n🔵 5. Creating GitHub Colab Push Script...")
    with open('forge_github_push.py', 'w') as f:
        f.write(GITHUB_COLAB_PY)
    print("  ✅ Created: forge_github_push.py")

    # 6. AppShell Wrapper
    print("\n🟣 6. Creating AppShell Wrapper...")
    write_file('components/ui/app/AppShellWrapper.jsx', APPSHELL_WRAPPER_JSX)

    # 7. Remove dead code
    print("\n🗑️  7. Removing dead code...")
    for dead_file in DEAD_FILES:
        remove_file(dead_file)

    # 8. Apply color fixes
    print("\n🎨 8. Applying SVG color fixes...")
    fixed = apply_color_fixes()
    for f in fixed:
        print(f"     Fixed: {f}")

    print("\n" + "=" * 60)
    print("INTEGRATION STEPS")
    print("=" * 60)
    print(INTEGRATION_STEPS)
    print("\n✅ All fixes generated! Check .forge-fix-backup/ for originals.")

# ─────────────────────────────────────────────────────────────────
# COMPONENT TEMPLATES
# ─────────────────────────────────────────────────────────────────

ERROR_BOUNDARY_JSX = r"""'use client'

/**
 * FORGE — Error Boundary
 * Phase 2: Code Quality & DX — CRITICAL FIX
 * 
 * Catches React rendering errors and prevents white-screen crashes.
 */

import { Component } from 'react'
import Button from './Button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('Forge ErrorBoundary caught:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6"
          style={{ background: 'var(--bg-base)' }}
        >
          <div className="max-w-md w-full flex flex-col items-center gap-6 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="var(--error)" strokeWidth="1.5" />
                <path d="M12 8v5M12 16h.01" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex flex-col gap-2">
              <h2
                className="font-display font-semibold"
                style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}
              >
                Something went wrong
              </h2>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Forge encountered an unexpected error. Your session data is safe.
                Try reloading the page or going back to the dashboard.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="w-full text-left">
                <summary className="font-mono text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                  Error details
                </summary>
                <pre
                  className="mt-2 p-3 rounded font-mono text-xs overflow-x-auto"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    color: 'var(--error)',
                  }}
                >
                  {this.state.error.toString()}\n{this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 w-full">
              <Button variant="primary" size="md" onClick={this.handleReload} fullWidth>
                Reload Page
              </Button>
              {this.props.fallbackReset && (
                <Button variant="ghost" size="md" onClick={this.handleReset} fullWidth>
                  Try Again
                </Button>
              )}
            </div>

            <button
              onClick={() => window.location.href = '/app'}
              className="font-body text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              ← Back to dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
"""

TOAST_JSX = r"""'use client'

/**
 * FORGE — Toast Notification System
 * Phase 2: Code Quality & DX
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({
    message,
    type = 'info',
    duration = 4000,
    id = Date.now() + Math.random(),
  }) => {
    setToasts(prev => [...prev, { id, message, type, duration, progress: 100 }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateToast = useCallback((id, updates) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: '380px' }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onRemove(toast.id)
      }
    }, 16)

    return () => clearInterval(interval)
  }, [toast.id, toast.duration, onRemove])

  const styles = {
    info:    { border: 'var(--info)',    bg: 'rgba(96,165,250,0.08)',  icon: InfoIcon },
    success: { border: 'var(--success)', bg: 'rgba(45,212,191,0.08)', icon: SuccessIcon },
    error:   { border: 'var(--error)',   bg: 'rgba(248,113,113,0.08)', icon: ErrorIcon },
    warning: { border: 'var(--warning)', bg: 'rgba(251,191,36,0.08)',  icon: WarningIcon },
  }

  const style = styles[toast.type] || styles.info
  const Icon = style.icon

  return (
    <div
      className="pointer-events-auto rounded-lg overflow-hidden shadow-lg animate-slide-up"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${style.border}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="shrink-0 mt-0.5">
          <Icon color={style.border} />
        </div>
        <p className="font-body text-sm leading-relaxed flex-1" style={{ color: 'var(--text-primary)' }}>
          {toast.message}
        </p>
        <button
          onClick={() => onRemove(toast.id)}
          className="shrink-0 text-muted hover:text-secondary transition-colors"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="h-0.5 w-full" style={{ background: 'var(--bg-border)' }}>
        <div
          className="h-full transition-all duration-100"
          style={{ width: `${progress}%`, background: style.border }}
        />
      </div>
    </div>
  )
}

function InfoIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
      <path d="M8 7v4M8 5h.01" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SuccessIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ErrorIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
      <path d="M6 6l4 4M10 6L6 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function WarningIcon({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2l6.5 11H1.5L8 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.5v3M8 11h.01" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
"""

KEYBOARD_JS = r"""'use client'

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
"""

SCROLL_REVEAL_JS = r"""'use client'

/**
 * FORGE — Scroll Reveal Hook
 * Phase 4: Polish & Landing Page
 */

import { useEffect, useRef } from 'react'

export function useScrollReveal(options = {}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const elements = container.querySelectorAll('.reveal')
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            if (options.once !== false) {
              observer.unobserve(entry.target)
            }
          } else if (options.once === false) {
            entry.target.classList.remove('visible')
          }
        })
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    )

    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin, options.once])

  return containerRef
}

export function RevealSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
"""

APPSHELL_WRAPPER_JSX = r"""'use client'

/**
 * FORGE — AppShell Wrapper (Enhanced)
 * Wraps AppShell with ErrorBoundary, ToastProvider, and Keyboard shortcuts.
 */

import AppShell from './AppShell'
import ErrorBoundary from '../ErrorBoundary'
import { ToastProvider } from '../Toast'
import { useKeyboardShortcuts, ShortcutHelp } from '../../hooks/useKeyboardShortcuts'
import { useState } from 'react'

export default function AppShellWrapper({ children }) {
  const [showHelp, setShowHelp] = useState(false)

  useKeyboardShortcuts({
    onSearch: () => {
      console.log('⌘+K: Search not yet implemented')
    },
    onHelp: () => setShowHelp(true),
    onEscape: () => setShowHelp(false),
  })

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppShell>{children}</AppShell>
        <ShortcutHelp open={showHelp} onClose={() => setShowHelp(false)} />
      </ToastProvider>
    </ErrorBoundary>
  )
}
"""

GITHUB_COLAB_PY = r