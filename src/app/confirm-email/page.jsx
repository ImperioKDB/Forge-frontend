'use client'

/**
 * FORGE - Confirm Email Page
 * Phase 3: paper-themed auth.
 *
 * Centered message + spinner. No radial-gradient glow (banned in Phase 3).
 * Spinner uses animate-spin-slow + font-mono text-sm text-muted per spec.
 * Logo replaces ForgeWordmark.
 */

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const email        = searchParams.get('email') || ''

  const domain = email.split('@')[1] || ''
  let mailUrl   = 'https://mail.google.com'
  let mailLabel = 'Open Gmail'
  if (domain.includes('yahoo')) {
    mailUrl   = 'https://mail.yahoo.com'
    mailLabel = 'Open Yahoo Mail'
  } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    mailUrl   = 'https://outlook.live.com'
    mailLabel = 'Open Outlook'
  } else if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) {
    mailUrl   = 'https://www.icloud.com/mail'
    mailLabel = 'Open iCloud Mail'
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--paper)' }}
    >
      {/* Nav */}
      <nav
        className="flex items-center px-6 py-4"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <button
          onClick={() => router.push('/')}
          className="hover:opacity-70 transition-opacity duration-150"
          aria-label="Go to homepage"
        >
          <Logo size="sm" style={{ color: 'var(--ink)' }} />
        </button>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">

          {/* Spinner - animate-spin-slow per spec (globals.css) */}
          <span
            className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin-slow"
            aria-hidden="true"
          />

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h1
              className="font-display font-semibold"
              style={{
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
              }}
            >
              Check your inbox
            </h1>
            <p
              className="font-body text-sm leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              We sent a confirmation link to{' '}
              {email ? (
                <span
                  className="font-mono"
                  style={{ color: 'var(--ink)', fontWeight: 500 }}
                >
                  {email}
                </span>
              ) : (
                'your email address'
              )}
              . Click it to activate your account.
            </p>
          </div>

          {/* Status label - font-mono text-sm text-muted per spec */}
          <p className="font-mono text-sm" style={{ color: 'var(--ink-faint)' }}>
            Waiting for confirmation...
          </p>

          {/* Open mail CTA - .btn-primary from globals.css (paper context) */}
          <a
            href={mailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-lg w-full justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {mailLabel}
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
            <span className="font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>OR</span>
            <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
          </div>

          {/* Secondary actions */}
          <div className="flex flex-col gap-3 w-full">
            <p className="font-body text-xs" style={{ color: 'var(--ink-soft)' }}>
              Didn&apos;t get the email? Check spam, or{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="transition-colors hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                try a different address
              </button>
              .
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-body text-xs transition-colors hover:underline"
              style={{ color: 'var(--ink-faint)' }}
            >
              Back to log in
            </button>
          </div>

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
