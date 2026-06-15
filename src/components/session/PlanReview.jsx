"use client"

import { useState, useMemo } from "react"
import { apiFetch } from "@/lib/supabase/api"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import StatusDot from "@/components/ui/StatusDot"
import { useToast } from "@/components/ui/Toast"
import DependencyGraph from "@/components/graph/DependencyGraph"

/**
 * FORGE — PlanReview
 *
 * The "review the plan" step. Rebuilt with:
 *  - An impact graph generated from the subtasks' file paths — the
 *    first subtask is treated as the "changed" anchor, the rest as
 *    "affected" nodes radiating out. This is a layout heuristic for
 *    visualization; the actual dependency data lives in the subtask
 *    list itself.
 *  - panel-rule cards for each subtask (numbered ledger style).
 *  - Tokens instead of inline hex/styles throughout.
 */

function shortName(path) {
  const parts = path.split("/")
  return parts.length > 1 ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}` : path
}

function buildGraphLayout(subtasks) {
  if (subtasks.length === 0) return null

  const [anchor, ...rest] = subtasks
  const cx = 230
  const cy = 230
  const radius = 170

  const affected = rest.slice(0, 7).map((task, i) => {
    const angle = (i / Math.max(rest.length, 1)) * Math.PI * 1.6 - Math.PI * 0.3
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    return {
      id: task.id,
      x: Math.round(x),
      y: Math.round(y),
      r: 16,
      label: shortName(task.file_path),
      path: `M${cx},${cy} C${cx + (x - cx) * 0.4},${cy + (y - cy) * 0.2} ${cx + (x - cx) * 0.7},${cy + (y - cy) * 0.6} ${Math.round(x)},${Math.round(y)}`,
    }
  })

  return {
    changed: { id: anchor.id, x: cx, y: cy, r: 26, label: shortName(anchor.file_path) },
    affected,
  }
}

export default function PlanReview({ session, onApproved }) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState("")
  const subtasks = session?.tasks || []
  const graph = useMemo(() => buildGraphLayout(subtasks), [subtasks])

  async function handleApprove() {
    setError(null)
    setLoading(true)
    try {
      if (feedback.trim()) {
        await apiFetch("/agent/edit-plan", {
          method: "POST",
          body: JSON.stringify({ session_id: session.id, feedback: feedback.trim() }),
        })
      }
      await apiFetch("/agent/approve-plan", {
        method: "POST",
        body: JSON.stringify({ session_id: session.id }),
      })
      addToast({ message: "Plan approved — coding started", type: "success" })
      onApproved()
    } catch (err) {
      setError(err.message)
      addToast({ message: err.message, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    setError(null)
    setLoading(true)
    try {
      await apiFetch("/agent/reject-plan", {
        method: "POST",
        body: JSON.stringify({ session_id: session.id }),
      })
      addToast({ message: "Plan rejected", type: "warning" })
      onApproved()
    } catch (err) {
      setError(err.message)
      addToast({ message: err.message, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[1.3rem] font-medium text-primary">Review the plan</h2>
        <p className="font-body text-sm text-secondary">
          Forge has broken your task into {subtasks.length} subtask{subtasks.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {graph && (
        <div>
          <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Impact map</div>
          <div className="overflow-hidden rounded-lg border border-border bg-surface p-2">
            <DependencyGraph viewBox="0 0 460 460" changed={graph.changed} affected={graph.affected} untouched={[]} className="aspect-square" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Subtasks</div>
        {subtasks.map((task, i) => (
          <Card key={task.id} variant="default" padding="sm">
            <div className="flex items-start gap-3">
              <span className="shrink-0 pt-0.5 font-mono text-xs text-accent opacity-70">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-mono text-xs text-secondary">{task.file_path}</span>
                <p className="font-body text-xs leading-relaxed text-muted">{task.instruction}</p>
                <StatusDot status={task.status} size="xs" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[11px] uppercase tracking-widest text-muted">Feedback (optional)</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Any adjustments to the plan before approving?"
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 font-body text-sm text-primary transition-colors duration-fast placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus:border-accent-line"
          style={{ fontSize: "16px" }}
        />
      </div>

      {error && (
        <Card variant="danger" padding="sm">
          <p className="font-body text-sm text-error">{error}</p>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="primary" size="md" loading={loading} onClick={handleApprove} fullWidth>
          Approve &amp; Start Coding
        </Button>
        <Button variant="danger" size="md" loading={loading} onClick={handleReject}>
          Reject
        </Button>
      </div>
    </div>
  )
}
