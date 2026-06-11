'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

// Inlined — no standalone ForgeWordmark component file exists
function ForgeWordmark() {
  return (
    <div className="font-mono font-semibold text-2xl tracking-[0.15em] relative inline-block select-none">
      <span className="text-secondary">F</span>
      <span className="text-accent">O</span>
      <span className="text-secondary">R</span>
      <span className="text-secondary">G</span>
      <span className="text-accent">E</span>
      <span
        className="absolute -bottom-1 left-0 w-full h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, #2563EB, transparent)',
        }}
      />
    </div>
  )
}

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''

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
    <div className="min-h-screen bg-base flex flex-col">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #2563eb08 0%, transparent 70%)',
        }}
      />

      {/* Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#2563EB 1px, transparent 1px),
            linear-gradient(90deg, #2563EB 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/50">
        <button
          onClick={() => router.push('/')}
          className="hover:opacity-70 transition-opacity duration-150"
        >
          <ForgeWordmark />
        </button>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">

          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', border: '1px solid var(--color-accent)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-accent" />
              <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" />
            </svg>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-secondary">
              Check your inbox
            </h1>
            <p className="text-sm text-muted leading-relaxed">
              We sent a confirmation link to{' '}
              {email
                ? <span className="text-secondary font-medium">{email}</span>
                : 'your email address'
              }.
              {' '}Click it to activate your account.
            </p>
          </div>

          {/* Open mail CTA */}
          <a
            href={mailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {mailLabel}
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted font-mono">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Secondary actions */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-xs text-muted">
              Didn't get the email? Check spam, or{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-accent hover:underline transition-colors"
              >
                try a different address
              </button>
              .
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-xs text-muted hover:text-secondary transition-colors"
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
