'use client'

/**
 * FORGE - Signup Page
 * Phase 3: paper-themed auth. Uses surface="paper" on Input + Button.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import GraphFragment from '@/components/graph/GraphFragment'

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: 'var(--paper-2)', borderRight: '1px solid var(--line)' }}
    >
      <div className="blueprint-grid" aria-hidden="true" />
      <Logo size="sm" className="relative z-10" style={{ color: 'var(--ink)' }} />

      <div className="relative z-10 w-full max-w-[280px] mx-auto opacity-80">
        <GraphFragment variant="trace" />
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        <h2
          className="font-display font-semibold leading-tight"
          style={{ fontSize: 'clamp(1.4rem, 2vw, 1.9rem)', letterSpacing: '-0.02em', color: 'var(--ink)' }}
        >
          Your codebase,{' '}
          <em className="italic" style={{ color: 'var(--accent)' }}>finally understood.</em>
        </h2>
        <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--ink-soft)', maxWidth: '34ch' }}>
          Connect a repo, describe what you want to build, and let Forge plan, code, and ship it - with your approval at every step.
        </p>
        <div className="flex flex-col gap-2 mt-1">
          {[
            'Your API key - encrypted at rest',
            'Your PAT - never logged',
            'Your main branch - always untouched',
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="var(--success)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-body text-xs" style={{ color: 'var(--ink-faint)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="font-mono text-xs relative z-10" style={{ color: 'var(--ink-faint)' }}>
        Works on web, tablet, and mobile.
      </p>
    </div>
  )
}

function SignupForm() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const passwordMismatch = confirm && password !== confirm

  async function handleSignup(e) {
    e.preventDefault()
    if (passwordMismatch) return
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push(`/confirm-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="lg:hidden mb-2">
          <Logo size="sm" style={{ color: 'var(--ink)' }} />
        </div>
        <h1 className="font-display font-semibold" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          Create your account
        </h1>
        <p className="font-body text-sm" style={{ color: 'var(--ink-soft)' }}>
          Start building from anywhere.
        </p>
      </div>

      {error && (
        <div className="panel-rule px-4 py-3 flex flex-col gap-1" style={{ background: 'var(--error-soft)', borderColor: 'rgba(224,139,125,0.3)' }} role="alert">
          <p className="font-body text-xs font-medium" style={{ color: 'var(--error)' }}>Could not create account</p>
          <p className="font-body text-xs" style={{ color: 'var(--ink-soft)' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <Input surface="paper" label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <Input surface="paper" label="Password" type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
        <Input surface="paper" label="Confirm Password" type="password" placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" error={passwordMismatch ? 'Passwords do not match' : undefined} />

        <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
          By creating an account you agree to our{' '}
          <span style={{ color: 'var(--ink-soft)' }}>Terms of Service</span>{' '}
          and <span style={{ color: 'var(--ink-soft)' }}>Privacy Policy</span>.
        </p>

        <Button surface="paper" type="submit" variant="primary" size="lg" loading={loading} disabled={!email || !password || !confirm || !!passwordMismatch} fullWidth className="mt-1">
          Create Account
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
        <span className="font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>FORGE</span>
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
      </div>

      <p className="font-body text-xs text-center" style={{ color: 'var(--ink-soft)' }}>
        Already have an account?{' '}
        <button type="button" onClick={() => router.push('/login')} className="transition-colors duration-fast hover:underline" style={{ color: 'var(--accent)' }}>
          Log in
        </button>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--paper)' }}>
      <LeftPanel />
      <div className="flex items-center justify-center px-8 py-16" style={{ background: 'var(--paper)' }}>
        <SignupForm />
      </div>
    </div>
  )
}
