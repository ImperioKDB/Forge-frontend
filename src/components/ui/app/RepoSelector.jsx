'use client'

import { useState, useEffect } from 'react'
import { useRepos } from '@/lib/hooks/useRepos'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PATGuide } from '@/components/ui/ErrorDisplay'

function PATField({ value, onChange }) {
  const [showGuide, setShowGuide] = useState(false)
  const isValid = !value || value.startsWith('ghp_') || value.startsWith('github_pat_')
  return (
    <div className="flex flex-col gap-2">
      <Input label="GitHub Personal Access Token" type="password" placeholder="ghp_xxxxxxxxxxxx"
        value={value} onChange={onChange} required autoComplete="off"
        error={!isValid ? 'PAT should start with ghp_ or github_pat_' : undefined}
        hint="Needs contents: read & write and metadata: read permissions" />
      <button type="button" onClick={() => setShowGuide(v => !v)}
        className="flex items-center gap-1.5 text-xs transition-colors duration-150 self-start"
        style={{ color: showGuide ? 'var(--accent)' : 'var(--text-muted)' }}
        aria-expanded={showGuide}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M6 4.5c0-.83.67-1.5 1.5-1.5S9 3.67 9 4.5c0 .67-.4 1.25-1 1.5-.6.25-1 .83-1 1.5M6 9v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        {showGuide ? 'Hide guide' : 'How do I create a PAT?'}
      </button>
      {showGuide && <PATGuide />}
    </div>
  )
}

function RepoBadge({ repo }) {
  const cfg = {
    indexed:  { label:`${repo.file_count||0} files`, color:'var(--success)', bg:'rgba(45,212,191,0.08)', border:'rgba(45,212,191,0.2)' },
    indexing: { label:'indexing...', color:'var(--warning)', bg:'rgba(251,191,36,0.08)', border:'rgba(251,191,36,0.2)' },
    failed:   { label:'failed', color:'var(--error)', bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.2)' },
    pending:  { label:'pending', color:'var(--text-muted)', bg:'var(--bg-surface)', border:'var(--bg-border)' },
  }[repo.index_status] || { label:'pending', color:'var(--text-muted)', bg:'var(--bg-surface)', border:'var(--bg-border)' }
  return (
    <span className="font-mono text-xs px-2 py-0.5 rounded-full"
      style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`, animation: repo.index_status==='indexing' ? 'forge-pulse 2s ease-in-out infinite' : 'none' }}>
      {cfg.label}
    </span>
  )
}

function RepoItem({ repo, selected, onSelect }) {
  const isFailed = repo.index_status === 'failed'
  const isIndexing = repo.index_status === 'indexing'
  return (
    <div className="flex flex-col gap-0">
      <button onClick={() => { if (!isIndexing) onSelect(repo) }}
        className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left"
        style={{ background: selected ? 'rgba(232,103,26,0.05)' : 'var(--bg-surface)', border: selected ? '1px solid rgba(232,103,26,0.4)' : '1px solid var(--bg-border)', cursor: isIndexing ? 'default' : 'pointer' }}
        onMouseEnter={e => { if (!selected && !isIndexing) e.currentTarget.style.borderColor = 'rgba(232,103,26,0.25)' }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--bg-border)' }}
        aria-pressed={selected} disabled={isIndexing}>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-body text-xs font-medium truncate" style={{ color:'var(--text-secondary)' }}>{repo.name}</span>
          <span className="font-mono text-xs truncate" style={{ color:'var(--text-muted)' }}>{repo.url?.replace('https://github.com/','') || ''}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <RepoBadge repo={repo} />
          {selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6L5 9L10 3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      </button>
      {isFailed && (
        <div className="mt-2 px-3 py-2.5 rounded-lg flex flex-col gap-2"
          style={{ background:'rgba(248,113,113,0.05)', border:'1px solid rgba(248,113,113,0.2)' }} role="alert">
          <p className="font-body text-xs font-medium" style={{ color:'var(--error)' }}>Indexing failed</p>
          <p className="font-body text-xs leading-relaxed" style={{ color:'var(--text-muted)' }}>
            Forge could not index this repo. Your PAT may have expired or lacks <code style={{ color:'var(--text-secondary)' }}>contents: read</code> permission.
          </p>
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer"
            className="self-start text-xs font-medium" style={{ color:'var(--accent)' }}>Create a new PAT →</a>
        </div>
      )}
    </div>
  )
}

function AddRepoForm({ onAdded, onCancel }) {
  const [form, setForm] = useState({ name:'', url:'', github_pat:'', default_branch:'main' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)
  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    if (form.url.includes('github.com/')) {
      const name = form.url.split('/').pop()?.replace('.git','')
      if (name && !form.name) setForm(f => ({ ...f, name }))
    }
  }, [form.url])

  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setErrorCode(null); setSubmitting(true)
    try {
      const data = await apiFetch('/repos', { method:'POST', body:JSON.stringify({ name:form.name.trim(), url:form.url.trim(), github_pat:form.github_pat.trim(), default_branch:form.default_branch.trim()||'main' }) })
      onAdded(data.repo)
    } catch (err) { setError(err.message); setErrorCode(err.code) }
    finally { setSubmitting(false) }
  }

  const errorHint = errorCode === 'GITHUB_AUTH_FAILED' || errorCode === 'INVALID_PAT'
    ? 'Your PAT was rejected by GitHub. Make sure it has contents: read & write and metadata: read permissions.'
    : errorCode === 'INVALID_URL' ? 'The URL must be a valid github.com repository URL.' : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 rounded-xl"
      style={{ background:'var(--bg-surface)', border:'1px solid var(--bg-border)' }} noValidate>
      <div className="flex items-center justify-between">
        <p className="font-body text-xs font-semibold" style={{ color:'var(--text-secondary)' }}>Add Repository</p>
        <button type="button" onClick={onCancel} className="p-1 rounded" style={{ color:'var(--text-muted)' }} aria-label="Cancel">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
      <Input label="GitHub Repository URL" placeholder="https://github.com/owner/repo" value={form.url} onChange={set('url')} required type="url" autoComplete="off" />
      <Input label="Repository Name" placeholder="my-project" value={form.name} onChange={set('name')} required autoComplete="off" hint="Auto-filled from the URL above" />
      <PATField value={form.github_pat} onChange={set('github_pat')} />
      <Input label="Default Branch" placeholder="main" value={form.default_branch} onChange={set('default_branch')} autoComplete="off" />
      {error && (
        <div className="flex flex-col gap-2 px-3 py-3 rounded-lg"
          style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.2)' }} role="alert">
          <p className="font-body text-xs font-medium" style={{ color:'var(--error)' }}>{errorHint ? 'Could not add repository' : 'Something went wrong'}</p>
          <p className="font-body text-xs leading-relaxed" style={{ color:'var(--text-secondary)' }}>{errorHint || error}</p>
          {(errorCode==='GITHUB_AUTH_FAILED'||errorCode==='INVALID_PAT') && (
            <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer"
              className="self-start text-xs font-medium" style={{ color:'var(--accent)' }}>Create a new PAT →</a>
          )}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={!form.url.trim()||!form.github_pat.trim()}>Add &amp; Index</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>Cancel</Button>
      </div>
    </form>
  )
}

export default function RepoSelector({ value, onChange }) {
  const { repos, loading, refetch } = useRepos()
  const [adding, setAdding] = useState(false)
  function handleAdded(repo) { refetch(); onChange(repo); setAdding(false) }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium uppercase tracking-wider" style={{ color:'var(--text-muted)' }}>Repository</label>
        {[...Array(2)].map((_,i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background:'var(--bg-surface)', border:'1px solid var(--bg-border)' }} />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color:'var(--text-muted)' }}>Repository</label>
      {repos.length > 0 && !adding && (
        <div className="flex flex-col gap-2">
          {repos.map(repo => <RepoItem key={repo.id} repo={repo} selected={value?.id===repo.id} onSelect={onChange} />)}
        </div>
      )}
      {!adding ? (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-all duration-150"
          style={{ border:'1px dashed var(--bg-border)', color:'var(--text-muted)', background:'transparent', minHeight:'44px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(232,103,26,0.3)'; e.currentTarget.style.color='var(--text-secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--bg-border)'; e.currentTarget.style.color='var(--text-muted)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add repository
        </button>
      ) : (
        <AddRepoForm onAdded={handleAdded} onCancel={() => setAdding(false)} />
      )}
    </div>
  )
}
