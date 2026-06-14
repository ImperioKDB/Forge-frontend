'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

/**
 * FORGE — Toast
 *
 * Same provider/hook API as before. Visuals: removed shadow-glow-sm
 * (no glow anywhere in the new design language); toasts are flat
 * panels with a left-accent border in their status color, rendered
 * on the elevated surface so they read against either theme.
 */

const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, type = 'success', duration = 3000 }) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toneClasses = {
    success: 'border-l-success text-success',
    warning: 'border-l-warning text-warning',
    error:   'border-l-error text-error',
    info:    'border-l-info text-info',
  }

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ',
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-md border border-border border-l-2 bg-elevated p-3 shadow-panel animate-slide-up transition-all duration-normal ${toneClasses[toast.type] || toneClasses.success}`}
          >
            <span className="shrink-0 font-mono text-sm font-bold">{icons[toast.type]}</span>
            <p className="flex-1 font-body text-xs leading-relaxed text-primary">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="font-mono text-xs font-bold leading-none text-muted transition-colors hover:text-primary"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
