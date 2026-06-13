'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CATALOGUE = {
  INSUFFICIENT_CREDITS: {
    title: 'Insufficient API credits',
    why: 'Your OpenRouter balance has run out. The AI model could not be called because there are no credits left on your key.',
    next: [
      { label: 'Top up on OpenRouter', href: 'https://openrouter.ai/credits', external: true, primary: true },
      { label: 'Use a different key', href: '/app/settings', primary: false },
    ],
    severity: 'warning',
  },
  GITHUB_AUTH_FAILED: {
    title: 'GitHub access token rejected',
    why: 'Your Personal Access Token (PAT) was refused by GitHub. It may have expired, been revoked, or lack required permissions.',
    next: [{ label: 'Create a new PAT on GitHub', href: 'https://github.com/settings/personal-access-tokens/new', external: true, primary: true }],
    severity: 'error', showPatGuide: true,
  },
  RATE_LIMIT: {
    title: 'Too many requests',
    why: 'You have sent too many requests in a short period. The server needs a moment to recover.',
    next: [{ label: 'Try again in a moment', action: 'retry', primary: true }],
    severity: 'warning',
  },
  BAD_GATEWAY: {
    title: 'Upstream service unavailable',
    why: 'OpenRouter or GitHub returned an unexpected response. This is usually temporary.',
    next: [{ label: 'Retry', action: 'retry', primary: true }],
    severity: 'warning',
  },
  TIMEOUT: {
    title: 'Request timed out',
    why: 'The operation took too long. This can happen under heavy AI load or with very large repos.',
    next: [{ label: 'Try again', action: 'retry', primary: true }],
    severity: 'warning',
  },
  UNAUTHORIZED: {
    title: 'Session expired',
    why: 'You have been signed out. This happens automatically after a period of inactivity.',
    next: [{ label: 'Sign in again', href: '/login', primary: true }],
    severity: 'error',
  },
  NOT_FOUND: {
    title: 'Not found',
    why: 'This resource does not exist or you do not have access to it.',
    next: [{ label: 'Go to dashboard', href: '/app', primary: true }],
    severity: 'error',
  },
  INDEXING_FAILED: {
    title: 'Repository indexing failed',
    why: 'Forge could not read or index your repository. Check that your PAT has contents: read & write and metadata: read permissions.',
    next: [{ label: 'Create a new PAT on GitHub', href: 'https://github.com/settings/personal-access-tokens/new', external: true, primary: true }],
    severity: 'error', showPatGuide: true,
  },
  INTERNAL_ERROR: {
    title: 'Something went wrong on our end',
    why: 'An unexpected server error occurred.',
    next: [{ label: 'Retry', action: 'retry', primary: true }],
    severity: 'error',
  },
}

function fallback(msg) {
  return { title: 'An error occurred', why: msg || 'An unexpected error happened. Please try again.', next: [{ label: 'Try again', action: 'retry', primary: true }], severity: 'error' }
}

export function PATGuide({ compact = false }) {
  const steps = [
    { n: '01', title: 'Open GitHub settings', detail: 'Go to github.com, click your profile photo, then Settings' },
    { n: '02', title: 'Developer Settings', detail: 'Scroll to the bottom of the sidebar and click "Developer settings"' },
    { n: '03', title: 'Fine-grained tokens', detail: 'Click "Personal access tokens", then "Fine-grained tokens"' },
    { n: '04', title: 'Generate new token', detail: 'Click "Generate new token", give it a name and set an expiry' },
    { n: '05', title: 'Set permissions', detail: 'Repository permissions: Contents = Read and write, Metadata = Read' },
    { n: '06', title: 'Copy your token', detail: 'Click "Generate token" and copy immediately. It will not be shown again.' },
  ]

  if (compact) {
    return (
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
        Create a PAT on GitHub →
      </a>
    )
  }

  return (
    <div className="rounded-lg flex flex-col gap-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', padding: '16px' }}
      role="region" aria-label="How to create a GitHub PAT">
      <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>How to create a GitHub PAT</p>
      <div className="flex flex-col gap-3">
        {steps.map(({ n, title, detail }) => (
          <div key={n} className="flex gap-3">
            <span className="font-mono text-xs shrink-0 w-6 mt-0.5" style={{ color: 'var(--accent)', opacity: 0.7 }}>{n}</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-body text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</span>
              <span className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{detail}</span>
            </div>
          </div>
        ))}
      </div>
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 self-start"
        style={{ background: 'var(--accent)', color: '#fff' }}>
        Open GitHub token page →
      </a>
    </div>
  )
}

export default function ErrorDisplay({ code, message, onRetry, compact = false, retryAfter = null }) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(retryAfter)

  useEffect(() => {
    if (!retryAfter) return
    setCountdown(retryAfter)
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
    return () => clearInterval(t)
  }, [retryAfter])

  const info = CATALOGUE[code] || fallback(message)
  const colors = { warning: { border: 'var(--warning)', bg: 'rgba(251,191,36,0.06)' }, error: { border: 'var(--error)', bg: 'rgba(248,113,113,0.06)' } }[info.severity] || { border: 'var(--error)', bg: 'rgba(248,113,113,0.06)' }

  const actions = info.next.map((action, i) =>
    action.href ? (
      <a key={i} href={action.href}
        target={action.external ? '_blank' : undefined}
        rel={action.external ? 'noopener noreferrer' : undefined}
        onClick={!action.external ? e => { e.preventDefault(); router.push(action.href) } : undefined}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
        style={{ background: action.primary ? 'var(--accent)' : 'var(--bg-elevated)', color: action.primary ? '#fff' : 'var(--text-secondary)', border: action.primary ? 'none' : '1px solid var(--bg-border)' }}>
        {action.label}{action.external && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 8L8 2M8 2H5M8 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
      </a>
    ) : (
      <button key={i} onClick={() => { if (action.action === 'retry' && onRetry) onRetry() }}
        disabled={action.action === 'retry' && countdown > 0}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
        style={{ background: action.primary ? 'var(--accent)' : 'var(--bg-elevated)', color: action.primary ? '#fff' : 'var(--text-secondary)', border: action.primary ? 'none' : '1px solid var(--bg-border)' }}>
        {action.action === 'retry' && countdown > 0 ? `Retry in ${countdown}s` : action.label}
      </button>
    )
  )

  if (compact) {
    return (
      <div className="flex flex-col gap-3 rounded-lg px-4 py-3"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }} role="alert">
        <div className="flex flex-col gap-1">
          <p className="font-body text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{info.title}</p>
          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{info.why}</p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
        {info.showPatGuide && <PATGuide compact />}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10 text-center max-w-md mx-auto" role="alert">
      <div className="flex flex-col gap-2">
        <h2 className="font-display font-semibold" style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>{info.title}</h2>
        <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '36ch', margin: '0 auto' }}>{info.why}</p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">{actions}</div>
      {info.showPatGuide && <div className="w-full text-left"><PATGuide /></div>}
      {code && <p className="font-mono text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Error code: {code}</p>}
    </div>
  )
}
