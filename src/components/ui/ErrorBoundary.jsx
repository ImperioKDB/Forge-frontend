'use client'

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
