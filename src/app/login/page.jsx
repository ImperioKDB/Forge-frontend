'use client'

/**
 * FORGE - Login Page
 * Phase 3: paper-themed auth. Uses surface="paper" on Input + Button
 * so fields render on the cream surface correctly.
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
        <GraphFragment variant="settled" />
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        <h2
          className="font-display font-semibold leading-tight"
          style={{ fontSize: 'clamp(1.4rem, 2vw, 1.9rem)', letterSpacing: '-0.02em', color: 'var(--ink)' }}
        >
          Understands your codebase.{' '}
          <em className="italic" style={{ color: 'var(--accent)' }}>
            Plans. Codes. Ships.
          </em>
        </h2>
        <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--ink-soft)', maxWidth: '34ch' }}>
          Repository-aware AI that reads every import, export, and dependency before writing a single line.
        </p>
        <div className="flex flex-col gap-2.5 mt-1">
          {[
            'Connect your GitHub repo',
            'Describe what you want',
            'Review the plan',
            'Approve the code',
            'Merge your branch',
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className="font-mono text-xs w-5 shrink-0" style={{ color: 'var(--accent)', opacity: 0.6 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-body text-xs" style={{ color: 'var(--ink-faint)' }}>{step}</span>
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

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [notice,   setNotice]   = useState(null)

  useEffect(() => {
    if (searchParams.get('signup') === 'success') setNotice('Account created - sign in to continue.')
    if (searchParams.get('error') === 'auth_failed') setError('Authentication failed. Please try again.')
  }, [searchParams])

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : error.message)
      setLoading(false)
      return
    }
    router.push('/app')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="lg:hidden mb-2">
          <Logo size="sm" style={{ color: 'var(--ink)' }} />
        </div>
        <h1 className="font-display font-semibold" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          Welcome back
        </h1>
        <p className="font-body text-sm" style={{ color: 'var(--ink-soft)' }}>
          Sign in to your Forge account.
        </p>
      </div>

      {notice && (
        <div className="px-4 py-3 rounded-md text-xs font-body" style={{ background: 'var(--success-soft)', border: '1px solid rgba(111,191,139,0.3)', color: 'var(--success)' }}>
          {notice}
        </div>
      )}

      {error && (
        <div className="panel-rule px-4 py-3 flex flex-col gap-1" style={{ background: 'var(--error-soft)', borderColor: 'rgba(224,139,125,0.3)' }} role="alert">
          <p className="font-body text-xs font-medium" style={{ color: 'var(--error)' }}>Sign-in failed</p>
          <p className="font-body text-xs" style={{ color: 'var(--ink-soft)' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input surface="paper" label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <Input surface="paper" label="Password" type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        <Button surface="paper" type="submit" variant="primary" size="lg" loading={loading} disabled={!email || !password} fullWidth className="mt-2">
          Sign In
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
        <span className="font-mono text-xs" style={{ color: 'var(--ink-faint)' }}>FORGE</span>
        <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
      </div>

      <p className="font-body text-xs text-center" style={{ color: 'var(--ink-soft)' }}>
        Don&apos;t have an account?{' '}
        <button type="button" onClick={() => router.push('/signup')} className="transition-colors duration-fast hover:underline" style={{ color: 'var(--accent)' }}>
          Create one
        </button>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--paper)' }}>
      <LeftPanel />
      <div className="flex items-center justify-center px-8 py-16" style={{ background: 'var(--paper)' }}>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
