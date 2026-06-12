'use client'

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
