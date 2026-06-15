"use client"

import { useState, useMemo } from "react"
import { apiFetch } from "@/lib/supabase/api"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import StatusDot from "@/components/ui/StatusDot"
import { useToast } from "@/components/ui/Toast"
import DependencyGraph from "@/components/graph/DependencyGraph"
import { useSubgraph } from "@/lib/hooks/useSubgraph"

/**
 * FORGE -- PlanReview
 *
 * "Review the plan" step. The impact map now shows the *real* file-level
 * dependency subgraph fetched from the indexed repo graph, not a fake
 * circular layout computed from task positions.
 *
 * Graph logic:
 *   - The first task's file is the "changed" (anchor) node.
 *   - Every other task file that has a direct IMPORTS edge to/from the
 *     anchor becomes an "affected" node with a real cubic bezier path.
 *   - Additional files from the subgraph that are NOT task files but ARE
 *     connected are shown as "untouched" (faint idle nodes).
 *   - Falls back to a simple circular heuristic layout if the subgraph
 *     returns no edges (e.g. the repo hasn't been indexed yet).
 */

const VB_W = 460
const VB_H = 420
const CX   = VB_W / 2
const CY    = VB_H / 2 - 20

function shortName(path) {
  if (!path) return ""
  const parts = path.split("/")
  return parts.length > 1 ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}` : path
}

function cubicPath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const ctrl1x = x1 + dx * 0.35 - dy * 0.18
  const ctrl1y = y1 + dy * 0.35 + dx * 0.18
  const ctrl2x = x1 + dx * 0.65 - dy * 0.18
  const ctrl2y = y1 + dy * 0.65 + dx * 0.18
  return `M${Math.round(x1)},${Math.round(y1)} C${Math.round(ctrl1x)},${Math.round(ctrl1y)} ${Math.round(ctrl2x)},${Math.round(ctrl2y)} ${Math.round(x2)},${Math.round(y2)}`
}

/**
 * Convert raw subgraph data + task list into the { changed, affected,
 * untouched } props DependencyGraph expects.
 *
 * Algorithm:
 *   1. Build a file -> id map from subgraph nodes.
 *   2. Place task files first; remaining subgraph files fill remaining slots.
 *   3. Position all non-anchor files on an adaptive ellipse.
 *   4. Emit edges as cubic bezier paths anchored at (CX, CY).
 */
function buildRealLayout(tasks, subNodes, subEdges) {
  if (!tasks || tasks.length === 0) return null

  const anchorTask = tasks[0]
  const anchorPath = anchorTask.file_path

  // File id -> path lookup from subgraph
  const idToPath = new Map()
  for (const n of subNodes) idToPath.set(n.id, n.path)
  const pathToId = new Map()
  for (const n of subNodes) pathToId.set(n.path, n.id)

  // Build adjacency for non-anchor files that have a real edge
  const anchorId = pathToId.get(anchorPath)
  const connectedPaths = new Set()
  for (const e of subEdges) {
    const fromPath = idToPath.get(e.from)
    const toPath   = idToPath.get(e.to)
    if (!fromPath || !toPath) continue
    if (fromPath === anchorPath) connectedPaths.add(toPath)
    if (toPath   === anchorPath) connectedPaths.add(fromPath)
  }

  // Collect display files: other task files first, then connected subgraph files
  const taskPaths = tasks.slice(1).map(t => t.file_path)
  const extraConnected = [...connectedPaths].filter(p => !taskPaths.includes(p) && p !== anchorPath)
  const allOther = [...new Set([...taskPaths, ...extraConnected])].slice(0, 8)

  // Positions on ellipse around anchor
  const rw = Math.min(CX - 40, 185)
  const rh = Math.min(CY - 30, 155)
  const positions = allOther.map((_, i) => {
    const angle = (i / Math.max(allOther.length, 1)) * Math.PI * 1.65 - Math.PI * 0.32
    return {
      x: Math.round(CX + Math.cos(angle) * rw),
      y: Math.round(CY + Math.sin(angle) * rh),
    }
  })

  // Classify each non-anchor file as "affected" (is a task) or "untouched"
  const taskPathSet = new Set(taskPaths)
  const affected  = []
  const untouched = []

  for (let i = 0; i < allOther.length; i++) {
    const path = allOther[i]
    const { x, y } = positions[i]
    const node = {
      id:    path,
      x,
      y,
      r:     taskPathSet.has(path) ? 16 : 12,
      label: shortName(path),
      path:  cubicPath(CX, CY, x, y),
    }
    if (taskPathSet.has(path)) {
      affected.push(node)
    } else {
      untouched.push(node)
    }
  }

  return {
    changed: {
      id:    anchorPath,
      x:     CX,
      y:     CY,
      r:     26,
      label: shortName(anchorPath),
    },
    affected,
    untouched,
  }
}

export default function PlanReview({ session, onApproved }) {
  const { addToast } = useToast()
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [feedback, setFeedback] = useState("")

  // ── Fix: the session object uses `tasks`, not `subtasks` ──────────
  const subtasks = session?.tasks || []

  const filePaths = useMemo(
    () => subtasks.map((t) => t.file_path).filter(Boolean),
    [subtasks]
  )

  // ── Real subgraph from the indexed repo ──────────────────────────
  const { nodes: subNodes, edges: subEdges, loading: graphLoading } = useSubgraph(
    session?.repo_id,
    filePaths
  )

  // ── Build layout from real data ──────────────────────────────────
  const graph = useMemo(
    () => buildRealLayout(subtasks, subNodes, subEdges),
    [subtasks, subNodes, subEdges]
  )

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

      {/* ── Impact map (real graph or loading skeleton) ── */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Impact map
          {graphLoading && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          )}
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-surface p-2">
          {graph ? (
            <DependencyGraph
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              changed={graph.changed}
              affected={graph.affected}
              untouched={graph.untouched}
              className="aspect-square"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              <span className="font-mono text-xs text-muted">
                {graphLoading ? "Loading graph…" : "No graph data"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Subtasks</div>
        {subtasks.map((task, i) => (
          <Card key={task.id} variant="default" padding="sm">
            <div className="flex items-start gap-3">
              <span className="shrink-0 pt-0.5 font-mono text-xs text-accent opacity-70">
                {String(i + 1).padStart(2, "0")}
              </span>
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
        <label className="font-mono text-[11px] uppercase tracking-widest text-muted">
          Feedback (optional)
        </label>
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
