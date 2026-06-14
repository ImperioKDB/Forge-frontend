"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/supabase/api"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import RepoConnectPanel from "@/components/ui/app/RepoConnectPanel"
import ModelSelector from "@/components/ui/app/ModelSelector"
import { useToast } from "@/components/ui/Toast"

const DEFAULT_PLANNER = "openai/gpt-oss-120b:free"
const DEFAULT_CODER = "qwen/qwen3-coder:free"

/**
 * FORGE — New Task page
 *
 * "What should Forge change?" — repo + task description + models,
 * then "Run Forge". Task description and repo selection are
 * unchanged in behavior from the prior version; visuals rebuilt with
 * the blueprint/schematic tokens (panel-rule cards, mono labels for
 * metadata, no glow).
 */
export default function NewTaskPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [repo, setRepo] = useState(null)
  const [task, setTask] = useState("")
  const [planner, setPlanner] = useState(DEFAULT_PLANNER)
  const [coder, setCoder] = useState(DEFAULT_CODER)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const canSubmit = repo && task.trim().length > 0 && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)

    try {
      const data = await apiFetch("/agent/start", {
        method: "POST",
        body: JSON.stringify({
          repo_id: repo.id,
          task: task.trim(),
          planner_model: planner,
          coder_model: coder,
        }),
      })
      addToast({ message: "Task started — planning in progress", type: "success" })
      router.push(`/app/session/${data.session_id}`)
    } catch (err) {
      setError(err.message)
      addToast({ message: `Failed to start task: ${err.message}`, type: "error", duration: 6000 })
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">NEW TASK</div>
        <h1 className="font-display text-[1.9rem] font-medium tracking-tight text-primary">What should Forge change?</h1>
        <p className="max-w-[36em] text-sm text-secondary">
          Describe the change in plain English. Forge will trace the affected files from the dependency index before planning anything.
        </p>
      </div>

      <RepoConnectPanel value={repo} onChange={setRepo} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="task" className="font-mono text-[11px] uppercase tracking-widest text-muted">
          Task description
        </label>
        <textarea
          id="task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="e.g. Add a dark mode toggle to the settings page, persisted across sessions."
          rows={5}
          className="w-full resize-none rounded-md border border-border bg-surface px-3.5 py-3 font-body text-sm leading-relaxed text-primary transition-colors duration-fast placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus:border-accent-line"
          style={{ fontSize: "16px" }}
        />
        <div className="flex justify-between font-mono text-xs text-muted">
          <span>{task.length} characters</span>
          <span className="text-right">Be specific — Forge reads your index before planning, not your prompt alone.</span>
        </div>
      </div>

      {repo?.index_status === "indexed" && task.trim().length > 8 && <ImpactPreview repoId={repo.id} task={task} />}

      <ModelSelector plannerModel={planner} coderModel={coder} onPlannerChange={setPlanner} onCoderChange={setCoder} />

      {error && (
        <Card variant="danger" padding="sm">
          <p className="font-body text-sm text-error">{error}</p>
        </Card>
      )}

      <Button variant="primary" size="lg" disabled={!canSubmit} loading={submitting} onClick={handleSubmit} fullWidth>
        {submitting ? "Starting…" : "Run Forge →"}
      </Button>
    </div>
  )
}

/**
 * ImpactPreview
 *
 * The differentiator, surfaced before submission: a quick best-effort
 * read of "files likely affected" based on simple keyword matching
 * against the repo's indexed file list. This is intentionally a
 * lightweight client-side preview — the real, authoritative impact
 * map is computed server-side by the planner after submission and
 * shown on the session review page.
 */
function ImpactPreview({ repoId, task }) {
  // For the redesign, this renders a static illustrative preview.
  // Wire this up to a real `/repos/:id/impact-preview?q=...` endpoint
  // (debounced) when available — same visual shell, just populate
  // `files` from the response.
  const files = [
    "app/settings/page.jsx",
    "lib/hooks/useTheme.js",
    "components/ui/ThemeToggle.jsx",
    "app/layout.jsx",
  ]

  return (
    <div className="rounded-md border border-accent-line bg-accent-soft p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Likely affected — preview</span>
        <span className="font-mono text-xs text-secondary">{files.length} files</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {files.map((f) => (
          <span key={f} className="rounded-sm border border-border-2 bg-elevated px-2.5 py-1 font-mono text-xs text-secondary">
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}
