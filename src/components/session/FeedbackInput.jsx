'use client'

/**
 * FORGE -- FeedbackInput
 * Rebuilt from scratch (original was binary/corrupted in codebase dump).
 * Used inside CodeReview when user clicks "Request Changes".
 * Calls POST /agent/feedback with { draft_id, feedback }.
 */

import { useState } from 'react'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'

export default function FeedbackInput({ draftId, onSubmitted, onCancel }) {
  const [feedback,   setFeedback]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)

  const MAX_CHARS = 2000
  const canSubmit = feedback.trim().length > 0 && feedback.length <= MAX_CHARS && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      await apiFetch('/agent/feedback', {
        method: 'POST',
        body: JSON.stringify({ draft_id: draftId, feedback: feedback.trim() }),
      })
      onSubmitted?.()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') onCancel?.()
  }

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Request changes
        </span>
        <span
          className="font-mono text-xs"
          style={{ color: feedback.length > MAX_CHARS ? 'var(--error)' : 'var(--text-muted)' }}
        >
          {feedback.length} / {MAX_CHARS}
        </span>
      </div>

      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe what needs to change. Be specific -- Forge will re-read the file and try again."
        rows={4}
        autoFocus
        aria-label="Feedback for code revision"
        className="w-full px-3 py-2.5 rounded-md font-body text-sm resize-none transition-all duration-150 focus:outline-none"
        style={{
          background: 'var(--bg-elevated)',
          border:     '1px solid var(--bg-border)',
          color:      'var(--text-primary)',
          fontSize:   '16px',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e  => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
      />

      {error && (
        <p className="font-mono text-xs" style={{ color: 'var(--error)' }}>{error}</p>
      )}

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" disabled={!canSubmit} loading={submitting} onClick={handleSubmit}>
          {submitting ? 'Sending...' : 'Send feedback'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <span className="font-mono text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          Cmd+Enter
        </span>
      </div>
    </div>
  )
}
