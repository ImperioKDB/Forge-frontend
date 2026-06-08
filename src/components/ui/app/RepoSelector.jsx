
'use client'

import { useState } from 'react'
import { useRepos } from '@/lib/hooks/useRepos'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function RepoSelector({ value, onChange }) {
  const { repos, loading, refetch } = useRepos()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', github_pat: '', default_branch: 'main' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const data = await apiFetch('/repos', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      await refetch()
      onChange(data.repo)
      setAdding(false)
      setForm({ name: '', url: '', github_pat: '', default_branch: 'main' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-10 bg-surface border border-border rounded animate-pulse" />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium text-muted uppercase tracking-wider">
        Repository
      </label>

      {/* Repo list */}
      {repos.length > 0 && !adding && (
        <div className="flex flex-col gap-1.5">
          {repos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => onChange(repo)}
              className={`
                flex items-center justify-between px-3 py-2.5
                bg-surface border rounded text-sm
                transition-all duration-150 text-left
                ${value?.id === repo.id
                  ? 'border-accent/50 bg-accent/5 shadow-glow-sm'
                  : 'border-border hover:border-accent/30'
                }
              `}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-secondary font-medium text-xs">
                  {repo.name}
                </span>
                <span className="text-muted text-xs font-mono">
                  {repo.url.replace('https://github.com/', '')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Index status */}
                <span className={`
                  text-xs font-mono px-2 py-0.5 rounded-full border
                  ${repo.index_status === 'indexed'
                    ? 'text-success border-success/20 bg-success/5'
                    : repo.index_status === 'indexing'
                    ? 'text-accent border-accent/20 bg-accent/5'
                    : repo.index_status === 'failed'
                    ? 'text-danger border-danger/20 bg-danger/5'
                    : 'text-muted border-border'
                  }
                `}>
                  {repo.index_status === 'indexed'
                    ? `${repo.file_count || 0} files`
                    : repo.index_status === 'indexing'
                    ? 'indexing…'
                    : repo.index_status === 'failed'
                    ? 'failed'
                    : 'pending'
                  }
                </span>
                {value?.id === repo.id && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add repo button or form */}
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded text-xs text-muted hover:text-secondary hover:border-accent/30 transition-all duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add repository
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 p-3 bg-surface border border-border rounded"
        >
          <p className="text-xs font-medium text-secondary">Add Repository</p>

          <Input
            label="Name"
            placeholder="My Project"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />

          <Input
            label="GitHub URL"
            placeholder="https://github.com/owner/repo"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            required
          />

          <Input
            label="GitHub PAT"
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            hint="Needs contents: read & write permission"
            value={form.github_pat}
            onChange={e => setForm(f => ({ ...f, github_pat: e.target.value }))}
            required
          />

          <Input
            label="Default Branch"
            placeholder="main"
            value={form.default_branch}
            onChange={e => setForm(f => ({ ...f, default_branch: e.target.value }))}
          />

          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              Add & Index
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false)
                setError(null)
                setForm({ name: '', url: '', github_pat: '', default_branch: 'main' })
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
