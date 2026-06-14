"use client"

import { useState, useEffect } from "react"
import { useRepos } from "@/lib/hooks/useRepos"
import { apiFetch } from "@/lib/supabase/api"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { PATGuide } from "@/components/ui/PATGuide"

/**
 * FORGE — RepoConnectPanel
 *
 * (Formerly a second component also named RepoSelector — renamed to
 * avoid colliding with components/ui/app/RepoSelector.jsx, which is
 * the topbar repo switcher with a different prop contract.)
 *
 * Lets the user pick an existing repo or connect a new one via PAT.
 * Used on the New Task page.
 */

function PATField({ value, onChange }) {
  const [showGuide, setShowGuide] = useState(false)
  const isValid = !value || value.startsWith("ghp_") || value.startsWith("github_pat_")
  return (
    <div className="flex flex-col gap-2">
      <Input
        label="GitHub Personal Access Token"
        type="password"
        placeholder="ghp_xxxxxxxxxxxx"
        value={value}
        onChange={onChange}
        required
        autoComplete="off"
        error={!isValid ? "PAT should start with ghp_ or github_pat_" : undefined}
        hint="Needs contents: read & write and metadata: read permissions"
      />
      <button
        type="button"
        onClick={() => setShowGuide((v) => !v)}
        className={`flex items-center gap-1.5 self-start text-xs transition-colors duration-fast ${showGuide ? "text-accent" : "text-muted hover:text-secondary"}`}
        aria-expanded={showGuide}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6 4.5c0-.83.67-1.5 1.5-1.5S9 3.67 9 4.5c0 .67-.4 1.25-1 1.5-.6.25-1 .83-1 1.5M6 9v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {showGuide ? "Hide guide" : "How do I create a PAT?"}
      </button>
      {showGuide && <PATGuide />}
    </div>
  )
}

function RepoBadge({ repo }) {
  const cfg =
    {
      indexed: { label: `${repo.file_count || 0} files`, className: "text-success bg-success-soft border-success/30" },
      indexing: { label: "indexing…", className: "text-warning bg-warning-soft border-warning/30 animate-pulse" },
      failed: { label: "failed", className: "text-error bg-error-soft border-error/30" },
      pending: { label: "pending", className: "text-muted bg-surface border-border" },
    }[repo.index_status] || { label: "pending", className: "text-muted bg-surface border-border" }

  return <span className={`rounded-pill border px-2 py-0.5 font-mono text-xs ${cfg.className}`}>{cfg.label}</span>
}

function RepoItem({ repo, selected, onSelect }) {
  const isFailed = repo.index_status === "failed"
  const isIndexing = repo.index_status === "indexing"
  return (
    <div className="flex flex-col gap-0">
      <button
        onClick={() => {
          if (!isIndexing) onSelect(repo)
        }}
        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors duration-fast ${
          selected ? "border-accent-line bg-accent-soft" : "border-border bg-surface hover:border-accent-line"
        } ${isIndexing ? "cursor-default" : "cursor-pointer"}`}
        aria-pressed={selected}
        disabled={isIndexing}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-body text-xs font-medium text-secondary">{repo.name}</span>
          <span className="truncate font-mono text-xs text-muted">{repo.url?.replace("https://github.com/", "") || ""}</span>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          <RepoBadge repo={repo} />
          {selected && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6L5 9L10 3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </button>

      {isFailed && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-error/20 bg-error-soft px-3 py-2.5" role="alert">
          <p className="font-body text-xs font-medium text-error">Indexing failed</p>
          <p className="font-body text-xs leading-relaxed text-muted">
            Forge could not index this repo. Your PAT may have expired or lacks <code className="text-secondary">contents: read</code> permission.
          </p>
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer" className="self-start text-xs font-medium text-accent">
            Create a new PAT →
          </a>
        </div>
      )}
    </div>
  )
}

function AddRepoForm({ onAdded, onCancel }) {
  const [form, setForm] = useState({ name: "", url: "", github_pat: "", default_branch: "main" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (form.url.includes("github.com/")) {
      const name = form.url.split("/").pop()?.replace(".git", "")
      if (name && !form.name) setForm((f) => ({ ...f, name }))
    }
  }, [form.url])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setErrorCode(null)
    setSubmitting(true)
    try {
      const data = await apiFetch("/repos", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          url: form.url.trim(),
          github_pat: form.github_pat.trim(),
          default_branch: form.default_branch.trim() || "main",
        }),
      })
      onAdded(data.repo)
    } catch (err) {
      setError(err.message)
      setErrorCode(err.code)
    } finally {
      setSubmitting(false)
    }
  }

  const errorHint =
    errorCode === "GITHUB_AUTH_FAILED" || errorCode === "INVALID_PAT"
      ? "Your PAT was rejected by GitHub. Make sure it has contents: read & write and metadata: read permissions."
      : errorCode === "INVALID_URL"
      ? "The URL must be a valid github.com repository URL."
      : null

  return (
    <form onSubmit={handleSubmit} className="panel-rule flex flex-col gap-4 bg-surface p-4" noValidate>
      <div className="flex items-center justify-between">
        <p className="font-body text-xs font-semibold text-secondary">Add Repository</p>
        <button type="button" onClick={onCancel} className="rounded p-1 text-muted hover:text-secondary" aria-label="Cancel">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <Input label="GitHub Repository URL" placeholder="https://github.com/owner/repo" value={form.url} onChange={set("url")} required type="url" autoComplete="off" />
      <Input label="Repository Name" placeholder="my-project" value={form.name} onChange={set("name")} required autoComplete="off" hint="Auto-filled from the URL above" />
      <PATField value={form.github_pat} onChange={set("github_pat")} />
      <Input label="Default Branch" placeholder="main" value={form.default_branch} onChange={set("default_branch")} autoComplete="off" />

      {error && (
        <div className="flex flex-col gap-2 rounded-lg border border-error/20 bg-error-soft px-3 py-3" role="alert">
          <p className="font-body text-xs font-medium text-error">{errorHint ? "Could not add repository" : "Something went wrong"}</p>
          <p className="font-body text-xs leading-relaxed text-secondary">{errorHint || error}</p>
          {(errorCode === "GITHUB_AUTH_FAILED" || errorCode === "INVALID_PAT") && (
            <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer" className="self-start text-xs font-medium text-accent">
              Create a new PAT →
            </a>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={!form.url.trim() || !form.github_pat.trim()}>
          Add &amp; Index
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function RepoConnectPanel({ value, onChange }) {
  const { repos, loading, refetch } = useRepos()
  const [adding, setAdding] = useState(false)

  function handleAdded(repo) {
    refetch()
    onChange(repo)
    setAdding(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <label className="font-mono text-[11px] uppercase tracking-widest text-muted">Repository</label>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="font-mono text-[11px] uppercase tracking-widest text-muted">Repository</label>

      {repos.length > 0 && !adding && (
        <div className="flex flex-col gap-2">
          {repos.map((repo) => (
            <RepoItem key={repo.id} repo={repo} selected={value?.id === repo.id} onSelect={onChange} />
          ))}
        </div>
      )}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 font-mono text-xs text-muted transition-colors duration-fast hover:border-accent-line hover:text-secondary"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add repository
        </button>
      ) : (
        <AddRepoForm onAdded={handleAdded} onCancel={() => setAdding(false)} />
      )}
    </div>
  )
}
