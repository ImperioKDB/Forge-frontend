
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/supabase/api'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

function Section({ title, description, children }) {
  return (
    <div className="flex flex-col gap-4 py-6 border-b border-border last:border-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-secondary">{title}</h2>
        {description && (
          <p className="text-xs text-muted leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function SaveStatus({ status }) {
  if (!status) return null
  return (
    <span className={`
      text-xs font-mono animate-fade-in
      ${status === 'saved' ? 'text-success' : ''}
      ${status === 'saving' ? 'text-muted' : ''}
      ${status === 'error' ? 'text-danger' : ''}
    `}>
      {status === 'saving' && '○ Saving…'}
      {status === 'saved' && '✓ Saved'}
      {status === 'error' && '✕ Failed to save'}
    </span>
  )
}

function OpenRouterSection() {
  const [apiKey, setApiKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [loading, setLoading] = useState(true)

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
    return <div className="h-10 bg-surface border border-border rounded animate-pulse" />
  }

  return (
    <div className="flex flex-col gap-4">
      {hasKey && (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-success/5 border border-success/20 rounded">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#06b6d4" strokeWidth="1.2" />
            <path d="M3.5 6L5.5 8L8.5 4" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs text-success font-mono">API key saved and encrypted</span>
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
            className="text-xs text-muted hover:text-secondary transition-colors duration-150"
          >
            {revealing ? 'Hide' : 'Show'} key
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

      <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="#555" strokeWidth="1.2" />
          <path d="M5 4.5V7M5 3.5V3" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="text-xs text-muted">
          {'Get your key at '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {'openrouter.ai/keys'}
          </a>
        </span>
      </div>
    </div>
  )
}

function GitHubPatSection() {
  return (
    <div className="flex flex-col gap-3">
      <div className="px-3 py-3 bg-surface border border-border rounded flex flex-col gap-2">
        <p className="text-xs text-secondary font-medium">
          GitHub PAT is stored per repository
        </p>
        <p className="text-xs text-muted leading-relaxed">
          When you add a repository from the new task screen, you enter
          your GitHub Personal Access Token at that point. It is encrypted
          and stored against that repo. You do not need to enter it here.
        </p>
        <p className="text-xs text-muted leading-relaxed">
          {'Your PAT needs '}
          <span className="font-mono text-secondary">{'contents: read & write'}</span>
          {' and '}
          <span className="font-mono text-secondary">{'metadata: read'}</span>
          {' permissions on the target repo.'}
        </p>
      </div>
      <a
        href="https://github.com/settings/personal-access-tokens/new"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs text-accent hover:underline"
      >
        {'Create a fine-grained token on GitHub →'}
      </a>
    </div>
  )
}

function AccountSection({ user }) {
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwStatus, setPwStatus] = useState(null)
  const [pwError, setPwError] = useState(null)

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError(null)

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters')
      return
    }

    setPwStatus('saving')

    try {
      const supabase = createClient()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        setPwError('Current password is incorrect')
        setPwStatus(null)
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        setPwError(error.message)
        setPwStatus(null)
        return
      }

      setPwStatus('saved')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setChangingPassword(false)
      setTimeout(() => setPwStatus(null), 3000)
    } catch (err) {
      setPwError(err.message)
      setPwStatus(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wider">
          Email
        </label>
        <div className="px-3 py-2.5 bg-surface border border-border rounded">
          <span className="text-sm text-secondary font-mono">{user?.email}</span>
        </div>
      </div>

      {!changingPassword ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setChangingPassword(true)}
          className="self-start"
        >
          Change password
        </Button>
      ) : (
        <form
          onSubmit={handleChangePassword}
          className="flex flex-col gap-3 p-4 bg-surface border border-border rounded"
        >
          <p className="text-xs font-medium text-secondary">Change Password</p>

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={
              confirmPassword && newPassword !== confirmPassword
                ? 'Passwords do not match'
                : null
            }
          />

          {pwError && (
            <p className="text-xs text-danger">{pwError}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={pwStatus === 'saving'}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Update Password
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setChangingPassword(false)
                  setPwError(null)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
              >
                Cancel
              </Button>
            </div>
            <SaveStatus status={pwStatus} />
          </div>
        </form>
      )}
    </div>
  )
}

function DangerZone() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  async function handleDeleteAccount() {
    if (confirmText !== 'delete my account') return
    setDeleting(true)
    setError(null)
    try {
      // Call backend to permanently delete all data and the auth user
      await apiFetch('/settings/account', { method: 'DELETE' })
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!confirming ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-secondary font-medium">Delete Account</p>
            <p className="text-xs text-muted leading-relaxed">
              Permanently delete your account, all repos, sessions, and memory.
              This cannot be undone.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirming(true)}
            className="shrink-0"
          >
            Delete
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4 bg-danger/5 border border-danger/20 rounded">
          <p className="text-xs font-medium text-danger">
            This will permanently delete your account
          </p>
          <p className="text-xs text-muted">
            {'Type '}
            <span className="font-mono text-secondary">delete my account</span>
            {' to confirm'}
          </p>

          <Input
            type="text"
            placeholder="delete my account"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
          />

          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              loading={deleting}
              disabled={confirmText !== 'delete my account'}
            >
              Permanently Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConfirming(false)
                setConfirmText('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <span className="w-4 h-4 border border-muted border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <div className="px-6 py-5 border-b border-border shrink-0">
        <h1 className="text-base font-semibold text-secondary">Settings</h1>
        <p className="text-xs text-muted mt-0.5">
          Manage your credentials and account
        </p>
      </div>

      <div className="flex-1 px-6 max-w-xl w-full">
        <Section
          title="OpenRouter"
          description="Your API key is used for all LLM calls. Each user brings their own key."
        >
          <OpenRouterSection />
        </Section>

        <Section
          title="GitHub Access"
          description="Personal access tokens are managed per repository."
        >
          <GitHubPatSection />
        </Section>

        <Section
          title="Account"
          description="Manage your login credentials."
        >
          <AccountSection user={user} />
        </Section>

        <Section title="Danger Zone">
          <DangerZone />
        </Section>
      </div>
    </div>
  )
}
