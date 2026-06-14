'use client'

/**
 * FORGE - Settings Page
 * Phase 4: token-clean, Card sections, SettingsIcons, ModelSelector.
 *
 * Workshop theme (data-theme="workshop" from AppShell) - no paper tokens here.
 *
 * Rules applied:
 *  - Section headers: font-mono kicker (11px uppercase tracked) per roadmap §4
 *  - Section grouping: Card default variant (panel-rule) per roadmap §4
 *  - SettingsIcons: replaces stroke="#06b6d4" / stroke="#555" hardcoded hex SVGs
 *  - ModelSelector: reused as-is for planner/coder model preferences
 *  - No new components, no new tokens, no inline hex colors
 *  - Button variant="danger" for destructive actions (already correct)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/supabase/api'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import ModelSelector from '@/components/ui/app/ModelSelector'
import { CheckIcon, MutedIcon } from '@/components/ui/SettingsIcons'

// ─── KICKER / SECTION HEADER ───────────────────────────────────────────────
// Per roadmap §4: "Section headers in font-mono text-[11px] uppercase
// tracking-[0.18em] text-muted (the established kicker style)"
function SectionKicker({ children }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
      {children}
    </p>
  )
}

// ─── SECTION WRAPPER ───────────────────────────────────────────────────────
// Card default variant = panel-rule. Each settings group is one card.
function Section({ kicker, description, children }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <SectionKicker>{kicker}</SectionKicker>
        {description && (
          <p className="font-body text-xs leading-relaxed text-muted">{description}</p>
        )}
      </div>
      <Card variant="default" padding="lg">
        {children}
      </Card>
    </div>
  )
}

// ─── SAVE STATUS ───────────────────────────────────────────────────────────
function SaveStatus({ status }) {
  if (!status) return null
  return (
    <span className={`text-xs font-mono animate-fade-in ${
      status === 'saved'  ? 'text-success' :
      status === 'saving' ? 'text-muted'   : 'text-error'
    }`}>
      {status === 'saving' && 'Saving...'}
      {status === 'saved'  && 'Saved'}
      {status === 'error'  && 'Failed to save'}
    </span>
  )
}

// ─── OPENROUTER SECTION ────────────────────────────────────────────────────
function OpenRouterSection() {
  const [apiKey,     setApiKey]     = useState('')
  const [hasKey,     setHasKey]     = useState(false)
  const [revealing,  setRevealing]  = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    apiFetch('/settings')
      .then(data => setHasKey(data.settings.has_api_key))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!apiKey.trim()) return
    setSaveStatus('saving')
    try {
      await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify({ openrouter_api_key: apiKey.trim() }),
      })
      setHasKey(true)
      setApiKey('')
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    } finally {
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  if (loading) {
    return <div className="h-10 rounded-md border border-border bg-elevated animate-pulse" />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Key saved confirmation - CheckIcon from SettingsIcons (no hex) */}
      {hasKey && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-success/20 bg-success-soft">
          <CheckIcon size={12} />
          <span className="font-mono text-xs text-success">API key saved and encrypted</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Input
          label={hasKey ? 'Replace API Key' : 'API Key'}
          type={revealing ? 'text' : 'password'}
          placeholder="sk-or-v1-xxxxxxxxxxxx"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          hint="Your key is encrypted before storage and never exposed"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={() => setRevealing(p => !p)}
            className="font-body text-xs text-muted hover:text-secondary transition-colors duration-fast"
          >
            {revealing ? 'Hide key' : 'Show key'}
          </button>
          <div className="flex items-center gap-3">
            <SaveStatus status={saveStatus} />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!apiKey.trim()}
              loading={saveStatus === 'saving'}
            >
              {hasKey ? 'Update Key' : 'Save Key'}
            </Button>
          </div>
        </div>
      </div>

      {/* Info note - MutedIcon from SettingsIcons (no hex) */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-elevated">
        <MutedIcon size={12} />
        <span className="font-body text-xs text-muted">
          Get your key at{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            openrouter.ai/keys
          </a>
        </span>
      </div>
    </div>
  )
}

// ─── MODELS SECTION ────────────────────────────────────────────────────────
// Reuses ModelSelector as-is. Reads/writes from localStorage mirroring
// the pattern in session/[id]/page.jsx.
function ModelsSection() {
  const [plannerModel, setPlannerModel] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('planner_model') : null)
      || 'openai/gpt-oss-120b:free'
  )
  const [coderModel, setCoderModel] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('coder_model') : null)
      || 'qwen/qwen3-coder:free'
  )
  const [saved, setSaved] = useState(false)

  function handleSave() {
    localStorage.setItem('planner_model', plannerModel)
    localStorage.setItem('coder_model', coderModel)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <ModelSelector
        plannerModel={plannerModel}
        coderModel={coderModel}
        onPlannerChange={setPlannerModel}
        onCoderChange={setCoderModel}
      />
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-muted">
          Applied to all new sessions from this browser.
        </p>
        <div className="flex items-center gap-3">
          {saved && <span className="font-mono text-xs text-success animate-fade-in">Saved</span>}
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Models
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── GITHUB PAT SECTION ───────────────────────────────────────────────────
function GitHubPatSection() {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-xs text-secondary font-medium">
        GitHub PAT is stored per repository
      </p>
      <p className="font-body text-xs text-muted leading-relaxed">
        When you add a repository from the new task screen, you enter your GitHub
        Personal Access Token at that point. It is encrypted and stored against
        that repo. You do not need to enter it here.
      </p>
      <p className="font-body text-xs text-muted leading-relaxed">
        Your PAT needs{' '}
        <span className="font-mono text-secondary">contents: read &amp; write</span>
        {' '}and{' '}
        <span className="font-mono text-secondary">metadata: read</span>
        {' '}permissions on the target repo.
      </p>
      <a
        href="https://github.com/settings/personal-access-tokens/new"
        target="_blank"
        rel="noopener noreferrer"
        className="self-start font-body text-xs text-accent hover:underline"
      >
        Create a fine-grained token on GitHub &rarr;
      </a>
    </div>
  )
}

// ─── ACCOUNT SECTION ──────────────────────────────────────────────────────
function AccountSection({ user }) {
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword,  setCurrentPassword]  = useState('')
  const [newPassword,      setNewPassword]      = useState('')
  const [confirmPassword,  setConfirmPassword]  = useState('')
  const [pwStatus,         setPwStatus]         = useState(null)
  const [pwError,          setPwError]          = useState(null)

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError(null)
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match'); return }
    if (newPassword.length < 8)          { setPwError('Password must be at least 8 characters'); return }
    setPwStatus('saving')
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email, password: currentPassword,
      })
      if (signInError) { setPwError('Current password is incorrect'); setPwStatus(null); return }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error)       { setPwError(error.message); setPwStatus(null); return }
      setPwStatus('saved')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setChangingPassword(false)
      setTimeout(() => setPwStatus(null), 3000)
    } catch (err) {
      setPwError(err.message); setPwStatus(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Email display - Card flat instead of ad-hoc bg-surface div */}
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Email</p>
        <Card variant="flat" padding="sm">
          <span className="font-mono text-sm text-secondary">{user?.email}</span>
        </Card>
      </div>

      {!changingPassword ? (
        <Button variant="ghost" size="sm" onClick={() => setChangingPassword(true)} className="self-start">
          Change password
        </Button>
      ) : (
        <div className="flex flex-col gap-3 p-4 rounded-md border border-border bg-elevated">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Change Password</p>
          <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
          <Input label="New Password" type="password" placeholder="Min. 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : null}
          />
          {pwError && <p className="font-body text-xs text-error">{pwError}</p>}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={pwStatus === 'saving'} disabled={!currentPassword || !newPassword || !confirmPassword} onClick={handleChangePassword}>
                Update Password
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setChangingPassword(false); setPwError(null); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}>
                Cancel
              </Button>
            </div>
            <SaveStatus status={pwStatus} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DANGER ZONE ───────────────────────────────────────────────────────────
function DangerZone() {
  const router = useRouter()
  const [confirming,   setConfirming]   = useState(false)
  const [confirmText,  setConfirmText]  = useState('')
  const [deleting,     setDeleting]     = useState(false)
  const [error,        setError]        = useState(null)

  async function handleDeleteAccount() {
    if (confirmText !== 'delete my account') return
    setDeleting(true); setError(null)
    try {
      await apiFetch('/settings/account', { method: 'DELETE' })
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      setError(err.message); setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!confirming ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-body text-xs text-secondary font-medium">Delete Account</p>
            <p className="font-body text-xs text-muted leading-relaxed">
              Permanently delete your account, all repos, sessions, and memory. This cannot be undone.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirming(true)} className="shrink-0">
            Delete
          </Button>
        </div>
      ) : (
        // bg-error-soft + border-error/20 - token-based, not bg-danger/5
        <div className="flex flex-col gap-3 p-4 rounded-md border bg-error-soft" style={{ borderColor: 'rgba(224,139,125,0.2)' }}>
          <p className="font-body text-xs font-medium text-error">
            This will permanently delete your account
          </p>
          <p className="font-body text-xs text-muted">
            Type{' '}
            <span className="font-mono text-secondary">delete my account</span>
            {' '}to confirm
          </p>
          <Input
            type="text"
            placeholder="delete my account"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
          />
          {error && <p className="font-body text-xs text-error">{error}</p>}
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={handleDeleteAccount} loading={deleting} disabled={confirmText !== 'delete my account'}>
              Permanently Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setConfirming(false); setConfirmText('') }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PAGE ───────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <span className="w-4 h-4 border border-muted border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Page header - Fraunces per §0.3 (this is the product voice) */}
      <div className="px-6 py-5 border-b border-border shrink-0">
        <h1 className="font-display font-semibold text-primary" style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
          Settings
        </h1>
        <p className="font-body text-xs text-muted mt-0.5">
          Manage your credentials and account
        </p>
      </div>

      <div className="flex-1 px-6 py-8 max-w-xl w-full flex flex-col gap-8">
        <Section
          kicker="OpenRouter"
          description="Your API key is used for all LLM calls. Each user brings their own key."
        >
          <OpenRouterSection />
        </Section>

        <Section
          kicker="Models"
          description="Default planner and coder models applied to new sessions."
        >
          <ModelsSection />
        </Section>

        <Section
          kicker="GitHub Access"
          description="Personal access tokens are managed per repository."
        >
          <GitHubPatSection />
        </Section>

        <Section
          kicker="Account"
          description="Manage your login credentials."
        >
          <AccountSection user={user} />
        </Section>

        <Section kicker="Danger Zone">
          <DangerZone />
        </Section>
      </div>
    </div>
  )
}
