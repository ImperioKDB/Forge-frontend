'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignup(e) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Go to login with success message
    router.push(`/confirm-email?email=${encodeURIComponent(email)}`)
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
        <button
          onClick={() => router.push('/login')}
          className="text-xs text-muted hover:text-secondary transition-colors duration-150"
        >
          Already have an account?{' '}
          <span className="text-accent">Sign in</span>
        </button>
      </nav>

      {/* Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-secondary">
              Create your account
            </h1>
            <p className="text-sm text-muted">
              Start shipping code from anywhere.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match'
                  : null
              }
            />

            {error && (
              <div className="px-3 py-2 bg-danger/10 border border-danger/20 rounded">
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!email || !password || !confirmPassword}
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted font-mono">FORGE</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Footer note */}
          <p className="text-xs text-muted text-center leading-relaxed">
            By creating an account you agree to use Forge
            responsibly. Your GitHub credentials are encrypted
            and never shared.
          </p>
        </div>
      </div>
    </div>
  )
}
