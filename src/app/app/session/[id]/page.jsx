"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSessionPolling } from "@/lib/hooks/useSessionPolling"
import StreamingOutput from "@/components/session/StreamingOutput"
import PlanningScreen from "@/components/session/PlanningScreen"
import PlanReview from "@/components/session/PlanReview"
import SubtaskRail from "@/components/session/SubtaskRail"
import PhaseStepper from "@/components/session/PhaseStepper"
import ModelSelector from "@/components/ui/app/ModelSelector"
import CodeReview from "@/components/session/CodeReview"
import { apiFetch } from "@/lib/supabase/api"

/* ─── Drag handle (split panel resizer) ─────────────────────────── */
function DragHandle({ onDrag }) {
  function handleMouseDown(e) {
    e.preventDefault()
    const startTouch = e.touches?.[0]?.clientY ?? e.clientY

    function onMove(ev) {
      const currentY = ev.touches?.[0]?.clientY ?? ev.clientY
      onDrag(currentY - startTouch)
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("touchmove", onMove)
    window.addEventListener("touchend", onUp)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      className="group relative h-1 shrink-0 cursor-row-resize bg-border transition-colors duration-fast hover:bg-accent-line"
    >
      <div className="absolute inset-x-0 -top-2 -bottom-2" />
      <div className="absolute left-1/2 top-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border-2" />
    </div>
  )
}

/* ─── Session header ─────────────────────────────────────────────── */
function SessionHeader({ session, plannerModel, coderModel, onPlannerChange, onCoderChange, showModels, onToggleModels }) {
  return (
    <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
      <div className="min-w-0 flex-1 overflow-hidden">
        <PhaseStepper status={session.status} />
      </div>

      <span className="hidden max-w-[180px] shrink truncate font-body text-xs text-muted sm:block">{session.task}</span>

      <button
        onClick={onToggleModels}
        className="shrink-0 rounded-pill border border-border px-3 py-1 font-mono text-xs text-muted transition-colors duration-fast hover:border-accent-line hover:text-accent"
      >
        Models
      </button>

      {showModels && (
        <div className="absolute right-4 top-14 z-50 w-72 rounded-lg border border-border bg-surface p-4 shadow-panel">
          <ModelSelector plannerModel={plannerModel} coderModel={coderModel} onPlannerChange={onPlannerChange} onCoderChange={onCoderChange} />
        </div>
      )}
    </div>
  )
}

/* ─── Fallback states ─────────────────────────────────────────────── */
// PlanningFallback replaced by PlanningScreen

function CodingFallback({ tasks }) {
  const runningTask = tasks?.find((t) => t.status === "running")
  const doneCount = tasks?.filter((t) => t.status === "done" || t.status === "awaiting_approval").length || 0
  const total = tasks?.length || 0

  if (!runningTask) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm text-muted">No active coding task</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">Progress</span>
          <span className="font-mono text-xs text-muted">
            {doneCount}/{total}
          </span>
        </div>
        <div className="h-px overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: total ? `${(doneCount / total) * 100}%` : "0%" }} />
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-accent-line bg-surface p-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <span className="font-mono text-xs text-accent">Coding</span>
        </div>
        <span className="font-mono text-xs text-secondary">{runningTask.file_path}</span>
        <p className="line-clamp-3 text-xs leading-relaxed text-muted">{runningTask.instruction}</p>
      </div>
    </div>
  )
}

function FailedState() {
  const router = useRouter()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-error/30 bg-error-soft">
        <span className="text-[1.1rem] text-error">✕</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-secondary">Session failed</p>
        <p className="text-xs text-muted">The agent encountered an error. Check your OpenRouter key and try again.</p>
      </div>
      <button onClick={() => router.push("/app")} className="text-xs text-accent">
        Start new task
      </button>
    </div>
  )
}

/* ─── Main page ───────────────────────────────────────────────────── */
export default function SessionPage() {
  const { id } = useParams()
  const { session, loading, error, refetch } = useSessionPolling(id)

  const [splitPercent, setSplitPercent] = useState(60)
  const [activeTask, setActiveTask] = useState(null)
  const [plannerModel, setPlannerModel] = useState("anthropic/claude-3.5-sonnet")
  const [coderModel, setCoderModel] = useState("poolside/laguna-m.1:free")
  const [showModels, setShowModels] = useState(false)
  const [planStreamUrl, setPlanStreamUrl] = useState(null)
  const [codeStreamUrl, setCodeStreamUrl] = useState(null)
  const [streamingTaskId, setStreamingTaskId] = useState(null)

  useEffect(() => {
    apiFetch("/settings")
      .then((data) => {
        if (data.settings?.planner_model) setPlannerModel(data.settings.planner_model)
        if (data.settings?.coder_model) setCoderModel(data.settings.coder_model)
      })
      .catch(() => {})
  }, [])

  function handlePlannerChange(model) {
    setPlannerModel(model)
    apiFetch("/settings", { method: "POST", body: JSON.stringify({ planner_model: model }) }).catch(() => {})
  }
  function handleCoderChange(model) {
    setCoderModel(model)
    apiFetch("/settings", { method: "POST", body: JSON.stringify({ coder_model: model }) }).catch(() => {})
  }

  useEffect(() => {
    if (!session?.tasks) return
    const firstReady = session.tasks.find((t) => t.status === "awaiting_approval")
    if (firstReady && !activeTask) setActiveTask(firstReady)
  }, [session?.tasks, activeTask])

  useEffect(() => {
    if (session?.status === "planning") {
      setPlanStreamUrl(`/agent/session/${id}/stream-plan`)
    } else {
      setPlanStreamUrl(null)
    }
  }, [session?.status, id])

  useEffect(() => {
    if (!session?.tasks) return
    const runningTask = session.tasks.find((t) => t.status === "running")
    if (runningTask && runningTask.id !== streamingTaskId) {
      setStreamingTaskId(runningTask.id)
      setCodeStreamUrl(`/agent/task/${runningTask.id}/stream-code`)
    }
    if (!runningTask && codeStreamUrl) {
      setCodeStreamUrl(null)
      setStreamingTaskId(null)
    }
  }, [session?.tasks, streamingTaskId, codeStreamUrl])

  function handleDrag(deltaY) {
    setSplitPercent((prev) => Math.min(80, Math.max(20, prev + (deltaY / window.innerHeight) * 100)))
  }

  if (loading) {
    return (
      <div data-theme="workshop" className="flex min-h-screen items-center justify-center bg-base">
        <div className="flex items-center gap-2 text-muted">
          <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-current border-t-transparent" />
          <span className="font-mono text-sm">Loading session…</span>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div data-theme="workshop" className="flex min-h-screen items-center justify-center bg-base">
        <p className="font-mono text-sm text-error">{error || "Session not found"}</p>
      </div>
    )
  }

  const isPlanReview = session.status === "plan_review"
  const isPlanning = session.status === "planning"
  const isCoding = session.status === "coding"
  const isAwaitingApproval = session.status === "awaiting_approval"
  const isDone = session.status === "done"
  const isFailed = session.status === "failed"
  const tasks = session.tasks || []

  return (
    <div data-theme="workshop" className="relative flex flex-col bg-base text-primary" style={{ height: "100dvh" }} onClick={() => showModels && setShowModels(false)}>
      <SessionHeader
        session={session}
        plannerModel={plannerModel}
        coderModel={coderModel}
        onPlannerChange={handlePlannerChange}
        onCoderChange={handleCoderChange}
        showModels={showModels}
        onToggleModels={() => setShowModels((p) => !p)}
      />

      {isPlanReview && (
        <div className="flex-1 overflow-hidden overflow-y-auto">
          <PlanReview session={session} onApproved={() => refetch()} onReplanned={() => refetch()} />
        </div>
      )}

      {(isPlanning || isCoding || isAwaitingApproval || isDone || isFailed) && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-hidden" style={{ height: `${splitPercent}%` }}>
            {isPlanning && <PlanningScreen streamUrl={planStreamUrl} />}
            {isCoding && (codeStreamUrl ? <StreamingOutput streamUrl={codeStreamUrl} title="Generating code…" language="typescript" /> : <CodingFallback tasks={tasks} />)}
            {(isAwaitingApproval || isDone) && (
              <CodeReview
                session={session}
                onApproved={() => {
                  setActiveTask(null)
                  refetch()
                }}
                onPushComplete={() => refetch()}
                onRefetch={() => refetch()}
              />
            )}
            {isFailed && <FailedState />}
          </div>

          {(isCoding || isAwaitingApproval || isDone || isFailed) && <DragHandle onDrag={handleDrag} />}

          {(isCoding || isAwaitingApproval || isDone) && (
            <div className="overflow-hidden border-t border-border" style={{ height: `${100 - splitPercent}%` }}>
              <SubtaskRail
                tasks={tasks.map((t) => ({
                  ...t,
                  code_drafts: session.code_drafts?.filter((d) => d.task_id === t.id) || [],
                }))}
                activeDraftId={activeTask?.code_drafts?.[0]?.id}
                onSelectTask={setActiveTask}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
