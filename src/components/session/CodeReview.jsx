
'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/supabase/api'
import Button from '@/components/ui/Button'
import FeedbackInput from './FeedbackInput'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-muted hover:text-secondary border border-border rounded transition-all duration-150"
    >
      {copied ? (
        <>
          <span className="text-success">Copied</span>
        </>
      ) : (
        <>Copy</>
      )}
    </button>
  )
}

function LineNumbers({ content }) {
  const lines = content.split('\n')
  return (
    <div className="select-none pr-4 text-right shrink-0">
      {lines.map((_, i) => (
        <div key={i} className="text-xs font-mono text-muted/30 leading-5">
          {i + 1}
        </div>
      ))}
    </div>
  )
}

export default function CodeReview({ task, draft, onApproved, onFeedbackSent }) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [approving, setApproving] = useState(false)
  const [sendingFeedback, setSendingFeedback] = useState(false)
  const [error, setError] = useState(null)
  const [approved, setApproved] = useState(draft?.verdict === 'approved')
  const [githubUrl, setGithubUrl] = useState(null)

  async function handleApprove() {
    setError(null)
    setApproving(true)

    try {
      const data = await apiFetch('/agent/approve', {
        method: 'POST',
        body: JSON.stringify({ draft_id: draft.id }),
      })

      setApproved(true)
      // Backend now returns github_url; fall back to branch for backward compatibility
      const url = data.github_url || (data.branch ? `https://github.com` : null)
      setGithubUrl(url)
      onApproved?.(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setApproving(false)
    }
  }

  async function handleFeedback(feedback) {
    setError(null)
    setSendingFeedback(true)

    try {
      await apiFetch('/agent/feedback', {
        method: 'POST',
        body: JSON.stringify({
          draft_id: draft.id,
          feedback,
        }),
      })

      setShowFeedback(false)
      onFeedbackSent?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSendingFeedback(false)
    }
  }

  if (!draft) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        <p className="text-xs font-mono">No draft available</p>
      </div>
    )
  }

  const code = draft.new_content || ''
  const explanation = draft.explanation || ''

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0 bg-surface/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-muted truncate ml-1">
              {draft.file_path}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-muted/40">
              {code.split('\n').length} lines
            </span>
            <CopyButton text={code} />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex min-w-0 p-4">
            <LineNumbers content={code} />
            <pre className="flex-1 font-mono text-xs text-secondary leading-5 whitespace-pre overflow-x-auto">
              {code}
            </pre>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-surface/50">
        <div className="px-4 py-3 max-h-28 overflow-y-auto">
          <p className="text-sm text-secondary leading-relaxed">
            {explanation || (
              <span className="text-muted italic">No explanation available</span>
            )}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-base px-4 py-3 flex flex-col gap-3">
        {approved ? (
          <div className="flex items-center gap-3 py-1">
            <span className="text-sm font-medium text-success">
              Approved and pushed to branch
            </span>

            {githubUrl && githubUrl !== 'https://github.com' ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline font-mono"
              >
                View on GitHub →
              </a>
            ) : (
              <span className="text-xs text-muted font-mono">Branch pushed</span>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowFeedback(true)}
              className="flex-1"
              disabled={approving}
            >
              Give Feedback
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleApprove}
              loading={approving}
              className="flex-1"
            >
              Approve & Push
            </Button>
          </div>
        )}

        {showFeedback && (
          <FeedbackInput
            onSubmit={handleFeedback}
            onCancel={() => setShowFeedback(false)}
            loading={sendingFeedback}
          />
        )}

        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
      </div>
    </div>
  )
}
