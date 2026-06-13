'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StreamingOutput from './StreamingOutput'
import { useToast } from '@/components/ui/Toast'

export default function CodeReview({ session, onApproved, onPushComplete }) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const subtask = session?.subtasks?.find(t => t.status === 'awaiting_approval')
  const draft = subtask?.code_drafts?.[0]

  if (!subtask || !draft) return null

  async function handleApprove() {
    setError(null)
    setLoading(true)
    try {
      const res = await apiFetch('/agent/approve', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id, draft_id: draft.id }),
      })
      if (res?.branch) {
        addToast({ message: `Pushed to ${res.branch}`, type: 'success', duration: 5000 })
        onPushComplete?.()
      } else {
        addToast({ message: 'Draft approved', type: 'success' })
        onApproved?.()
      }
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
      await apiFetch('/agent/reject', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id, draft_id: draft.id }),
      })
      addToast({ message: 'Draft rejected — agent will retry', type: 'warning' })
      onApproved?.()
    } catch (err) {
      setError(err.message)
      addToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="font-display font-semibold" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Review Code</h2>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{subtask.file_path}</p>
      </div>

      {draft.explanation && (
        <Card variant="accent" padding="sm">
          <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{draft.explanation}</p>
        </Card>
      )}

      <StreamingOutput content={draft.content} done={true} />

      {error && (
        <Card variant="danger" padding="sm">
          <p className="font-body text-sm" style={{ color: 'var(--error)' }}>{error}</p>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="primary" size="md" loading={loading} onClick={handleApprove} fullWidth>Approve & Push</Button>
        <Button variant="danger" size="md" loading={loading} onClick={handleReject}>Reject</Button>
      </div>
    </div>
  )
}
