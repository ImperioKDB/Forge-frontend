'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import ForgeWordmark from '@/components/ui/ForgeWordmark'

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''

  // Detect likely mail provider from email domain
  const domain = email.split('@')[1] || ''
  let mailUrl = 'https://mail.google.com'
  let mailLabel = 'Open Gmail'
  if (domain.includes('yahoo')) {
    mailUrl = 'https://mail.yahoo.com'
    mailLabel = 'Open Yahoo Mail'
  } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    mailUrl = 'https://outlook.live.com'
    mailLabel = 'Open Outlook'
  } else if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
    mailUrl = 'https://www.icloud.com/mail'
    mailLabel = 'Open iCloud Mail'
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Subtle grid background */}
      <div className="forge-grid fixed inset-0 pointer-events-none" aria-hidden="true" />

      <div
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8 text-center"
      >
        {/* Wordmark */}
        <ForgeWordmark size="sm" />

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="var(--accent)" strokeWidth="1.5" />
            <path d="M2 8l10 6 10-6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-3">
          <h1
            className="font-display font-bold"
            style={{ fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Check your inbox
          </h1>
          <p
            className="font-body text-sm leading-relaxed"
            style={{ color: 'var(--text-secondary)', maxWidth: '30ch', margin: '0 auto' }}
          >
            We sent a confirmation link to{' '}
            {email
              ? <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{email}</span>
              : 'your email address'
            }.
            Click it to activate your account.
          </p>
        </div>

        {/* Open mail CTA */}
        <a
          href={mailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 rounded-lg font-body font-medium text-sm transition-all duration-150"
          style={{
            padding: '0.75rem 1.25rem',
            background: 'var(--accent)',
            color: '#fff',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {mailLabel}
        </a>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--bg-border)' }} />
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>OR</span>
          <div className="flex-1 h-px" style={{ background: 'var(--bg-border)' }} />
        </div>

        {/* Secondary actions */}
        <div className="flex flex-col gap-3 w-full">
          <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
            Didn't get the email? Check spam, or{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="transition-colors"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              try a different address
            </button>
            .
          </p>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="font-body text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Back to log in
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailContent />
    </Suspense>
  )
}
