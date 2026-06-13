'use client'

/**
 * FORGE — New Task Page
 * Phase 1: Core App Shell & New Task Flow
 *
 * Mobile-first task submission form. Repo selector + model selector + textarea.
 * Submits to POST /agent/start.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import RepoSelector from '@/components/ui/app/RepoSelector'
import ModelSelector from '@/components/ui/app/ModelSelector'
import { useToast } from '@/components/ui/Toast'

const DEFAULT_PLANNER = 'openai/gpt-oss-120b:free'
const DEFAULT_CODER   = 'qwen/qwen3-coder:free'

export default function NewTaskPage() {
  const router        = useRouter()
  const { addToast }  = useToast()
  const [repo,        setRepo]        = useState(null)
  const [task,        setTask]        = useState('')
  const [planner,     setPlanner]     = useState(DEFAULT_PLANNER)
  const [coder,       setCoder]       = useState(DEFAULT_CODER)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState(null)

  const canSubmit = repo && task.trim().length > 0 && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)

    try {
      const data = await apiFetch('/agent/start', {
        method: 'POST',
        body: JSON.stringify({
          repo_id:       repo.id,
          task:          task.trim(),
          planner_model: planner,
          coder_model:   coder,
        }),
      })
      addToast({ message: 'Task started — planning in progress', type: 'success' })
      router.push(`/app/session/${data.session_id}`)
    } catch (err) {
      setError(err.message)
      addToast({ message: `Failed to start task: ${err.message}`, type: 'error', duration: 6000 })
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1
          className="font-display font-bold"
          style={{ fontSize: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          New Task
        </h1>
        <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
          Describe what you want Forge to build, fix, or refactor.
        </p>
      </div>

      {/* Repo Selector */}
      <RepoSelector value={repo} onChange={setRepo} />

      {/* Task textarea */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="task"
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Task
        </label>
        <textarea
          id="task"
          value={task}
          onChange={e => setTask(e.target.value)}
          placeholder="e.g. Add a dark mode toggle to the settings page. It should persist across sessions using localStorage."
          rows={5}
          className="w-full px-3 py-2.5 rounded-md font-body text-sm resize-none transition-all duration-fast focus:outline-none"
          style={{
            background:   'var(--bg-surface)',
            border:       '1px solid var(--bg-border)',
            color:        'var(--text-primary)',
            fontSize:     '16px',
          }}
          onFocus={e  => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={e   => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
        />
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          {task.length} chars · Be specific — Forge reads your codebase before planning.
        </p>
      </div>

      {/* Model Selector */}
      <ModelSelector
        plannerModel={planner}
        coderModel={coder}
        onPlannerChange={setPlanner}
        onCoderChange={setCoder}
      />

      {/* Error */}
      {error && (
        <Card variant="danger" padding="sm">
          <p className="font-body text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        </Card>
      )}

      {/* Submit */}
      <Button
        variant="primary"
        size="lg"
        disabled={!canSubmit}
        loading={submitting}
        onClick={handleSubmit}
        fullWidth
      >
        {submitting ? 'Starting…' : 'Run Forge →'}
      </Button>

      {!repo && (
        <p className="font-mono text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Select a repository first
        </p>
      )}
    </div>
  )
}
