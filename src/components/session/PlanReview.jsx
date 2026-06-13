'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StatusDot from '@/components/ui/StatusDot'
import { useToast } from '@/components/ui/Toast'

export default function PlanReview({ session, onApproved }) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState('')
  const subtasks = session?.subtasks || []

  async function handleApprove() {
    setError(null)
    setLoading(true)
    try {
      if (feedback.trim()) {
        await apiFetch('/agent/edit-plan', {
          method: 'POST',
          body: JSON.stringify({ session_id: session.id, feedback: feedback.trim() }),
        })
      }
      await apiFetch('/agent/approve-plan', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id }),
      })
      addToast({ message: 'Plan approved — coding started', type: 'success' })
      onApproved()
    } catch (err) {
      setError(err.message)
      addToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    setError(null)
    setLoading(true)
    try {
      await apiFetch('/agent/reject-plan', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id }),
      })
      addToast({ message: 'Plan rejected', type: 'warning' })
      onApproved()
    } catch (err) {
      setError(err.message)
      addToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-semibold" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          Review the Plan
        </h2>
        <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
          Forge has broken your task into {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {subtasks.map((task, i) => (
          <Card key={task.id} variant="default" padding="sm">
            <div className="flex items-start gap-3">
              <span className="font-mono text-xs shrink-0 pt-0.5" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="font-mono text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{task.file_path}</span>
                <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{task.instruction}</p>
                <StatusDot status={task.status} size="xs" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Feedback (optional)</label>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Any adjustments to the plan before approving?"
          rows={3}
          className="w-full px-3 py-2.5 rounded-md font-body text-sm resize-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)', fontSize: '16px' }}
        />
      </div>

      {error && (
        <Card variant="danger" padding="sm">
          <p className="font-body text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="primary" size="md" loading={loading} onClick={handleApprove} fullWidth>
          Approve & Start Coding
        </Button>
        <Button variant="danger" size="md" loading={loading} onClick={handleReject}>
          Reject
        </Button>
      </div>
    </div>
  )
}
