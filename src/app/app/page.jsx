'use client'

/**
 * FORGE -- New Task Page
 * Phase 2: Prominent centered CTA hero + form reveal
 *
 * Shows a hero CTA when the user lands. Form appears after repo selection.
 * Recent sessions listed below as quick-resume links.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import RepoSelector from '@/components/ui/app/RepoSelector'
import ModelSelector from '@/components/ui/app/ModelSelector'
import { useToast } from '@/components/ui/Toast'
import { useSessions } from '@/lib/hooks/useSessions'

const DEFAULT_PLANNER = 'openai/gpt-oss-120b:free'
const DEFAULT_CODER   = 'qwen/qwen3-coder:free'

// Status badge colors
const STATUS_STYLES = {
  planning:          { color: 'var(--accent)',   label: 'Planning' },
  plan_review:       { color: 'var(--warning)',  label: 'Review' },
  coding:            { color: 'var(--accent)',   label: 'Coding' },
  awaiting_approval: { color: 'var(--warning)',  label: 'Approve' },
  done:              { color: 'var(--success)',  label: 'Done' },
  failed:            { color: 'var(--error)',    label: 'Failed' },
}

function RecentSessions({ sessions, onResume }) {
  if (!sessions?.length) return null

  const recent = sessions.slice(0, 5)

  return (
    <div className="flex flex-col gap-2 w-full max-w-lg mx-auto">
      <span
        className="font-mono text-xs uppercase tracking-widest px-1"
        style={{ color: 'var(--text-muted)' }}
      >
        Recent sessions
      </span>
      <div className="flex flex-col gap-1.5">
        {recent.map(s => {
          const st = STATUS_STYLES[s.status] || STATUS_STYLES.done
          return (
            <button
              key={s.id}
              onClick={() => onResume(s.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
              style={{
                background: 'var(--bg-surface)',
                border:     '1px solid var(--bg-border)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,103,26,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: st.color }}
              />
              <span
                className="font-body text-xs flex-1 truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {s.task}
              </span>
              <span
                className="font-mono text-xs shrink-0"
                style={{ color: st.color }}
              >
                {st.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function NewTaskPage() {
  const router       = useRouter()
  const { addToast } = useToast()
  const { sessions } = useSessions()

  const [repo,       setRepo]       = useState(null)
  const [task,       setTask]       = useState('')
  const [planner,    setPlanner]    = useState(DEFAULT_PLANNER)
  const [coder,      setCoder]      = useState(DEFAULT_CODER)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)
  const [showForm,   setShowForm]   = useState(false)

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

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-12 gap-10">

      {/* ── Hero CTA ─────────────────────────────────────────── */}
      {!showForm && (
        <div className="flex flex-col items-center text-center gap-6 pt-8 w-full max-w-lg">
          {/* Forge wordmark accent */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'var(--accent-dim)',
              border:     '1px solid rgba(232,103,26,0.25)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 4L24 10V18L14 24L4 18V10L14 4Z"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M14 4V24M4 10L24 18M24 10L4 18"
                stroke="var(--accent)"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h1
              className="font-display font-bold"
              style={{
                fontSize:      'clamp(1.6rem, 6vw, 2.2rem)',
                color:         'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight:    '1.15',
              }}
            >
              What should Forge build?
            </h1>
            <p className="font-body text-sm" style={{ color: 'var(--text-muted)', maxWidth: '340px' }}>
              Describe any task. Forge reads your codebase, plans the changes,
              and writes the code for your review.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowForm(true)}
            style={{ minWidth: '200px' }}
          >
            Begin New Session →
          </Button>

          <div className="flex items-center gap-5 pt-2">
            {['Reads your repo', 'Plans first', 'You approve'].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <span style={{ color: 'var(--accent)', fontSize: '10px' }}>✶</span>
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Task form ────────────────────────────────────────── */}
      {showForm && (
        <div className="flex flex-col gap-6 w-full max-w-2xl">
          {/* Back link */}
          <button
            onClick={() => setShowForm(false)}
            className="flex items-center gap-1.5 font-mono text-xs self-start transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          <div className="flex flex-col gap-1">
            <h1
              className="font-display font-bold"
              style={{ fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              New Session
            </h1>
            <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
              Select a repo and describe the task in detail.
            </p>
          </div>

          <RepoSelector value={repo} onChange={setRepo} />

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
              onKeyDown={handleKeyDown}
              placeholder="e.g. In src/app/login/page.tsx, add an email validation error message that appears below the input when the format is invalid."
              rows={5}
              className="w-full px-3 py-2.5 rounded-md font-body text-sm resize-none transition-all duration-150 focus:outline-none"
              style={{
                background: 'var(--bg-surface)',
                border:     '1px solid var(--bg-border)',
                color:      'var(--text-primary)',
                fontSize:   '16px',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
            />
            <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              {task.length} chars · Be specific — name files and describe outcomes.
              <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}> Cmd+Enter to submit.</span>
            </p>
          </div>

          <ModelSelector
            plannerModel={planner}
            coderModel={coder}
            onPlannerChange={setPlanner}
            onCoderChange={setCoder}
          />

          {error && (
            <Card variant="danger" padding="sm">
              <p className="font-body text-sm" style={{ color: 'var(--error)' }}>{error}</p>
            </Card>
          )}

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
      )}

      {/* ── Recent sessions ──────────────────────────────────── */}
      {!showForm && (
        <RecentSessions
          sessions={sessions}
          onResume={id => router.push(`/app/session/${id}`)}
        />
      )}
    </div>
  )
}
