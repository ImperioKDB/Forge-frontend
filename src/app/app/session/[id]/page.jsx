"use client"

import React from "react"

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
/**
 * SessionSkeleton
 *
 * Placeholder that mirrors the real session page layout.
 * Shown while the initial session fetch is in-flight.
 * Uses pulse animation only — no spinners.
 */
function SessionSkeleton() {
  return (
    <div data-theme="workshop" className="flex min-h-screen flex-col bg-base">
      {/* Header bar */}
      <div className="flex h-[58px] shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="h-4 w-24 animate-pulse rounded bg-elevated" />
        <div className="ml-auto h-7 w-32 animate-pulse rounded-lg bg-elevated" />
        <div className="h-7 w-7 animate-pulse rounded-full bg-elevated" />
      </div>
      {/* Stepper */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="h-7 w-7 animate-pulse rounded-full bg-elevated" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
        <div className="ml-auto h-7 w-20 animate-pulse rounded-lg bg-elevated" />
      </div>
      {/* Main content area */}
      <div className="flex flex-1 flex-col gap-4 px-4 py-6">
        <div className="h-6 w-40 animate-pulse rounded bg-elevated" />
        <div className="h-4 w-56 animate-pulse rounded bg-elevated" />
        <div className="mt-2 h-48 w-full animate-pulse rounded-lg bg-elevated" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-elevated" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-elevated" />
      </div>
    </div>
  )
}

/**
 * SessionError
 *
 * Shown when the session fetch fails or the session is not found.
 * Gives the user a readable message and a retry button.
 */
function SessionError({ message, onRetry }) {
  return (
    <div data-theme="workshop" className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <circle cx="20" cy="20" r="19" stroke="var(--color-error,#e55)" strokeWidth="1.5" strokeOpacity="0.5" />
          <path d="M20 12v10M20 26v2" stroke="var(--color-error,#e55)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="font-display text-lg font-medium text-primary">
          {message === "Session not found" ? "Session not found" : "Failed to load session"}
        </p>
        <p className="max-w-xs font-body text-sm text-muted">
          {message || "Something went wrong loading this session."}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="rounded-lg border border-border bg-surface px-5 py-2.5 font-mono text-sm text-primary transition-colors hover:border-accent-line hover:text-accent"
      >
        Try again
      </button>
    </div>
  )
}

/**
 * PlanningStallBanner
 *
 * Shown after STALL_THRESHOLD ms if the planning SSE stream has not
 * delivered any content yet. Tells the user the likely cause (model
 * slowness or OpenRouter quota) without killing the stream.
 */
const STALL_THRESHOLD_MS = 30000

function PlanningStallBanner({ streamUrl, hasContent }) {
  const [stalled, setStalled] = React.useState(false)

  React.useEffect(() => {
    if (!streamUrl || hasContent) {
      setStalled(false)
      return
    }
    const t = setTimeout(() => setStalled(true), STALL_THRESHOLD_MS)
    return () => clearTimeout(t)
  }, [streamUrl, hasContent])

  if (!stalled) return null

  return (
    <div className="mx-4 mt-3 flex items-start gap-3 rounded-lg border border-border bg-elevated px-4 py-3">
      <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="var(--text-muted)" strokeWidth="1.2" />
        <path d="M8 5v4M8 11v1" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <div className="flex flex-col gap-0.5">
        <p className="font-mono text-xs font-semibold text-secondary">Planner is taking longer than usual</p>
        <p className="font-body text-xs text-muted">
          This can happen if the selected model is slow or your OpenRouter quota is under load.
          You can change models via the <span className="font-semibold text-secondary">Models</span> button above and start a new task.
        </p>
      </div>
    </div>
  )
}


export default function SessionPage() {
  const { id } = useParams()
  const { session, loading, error, refetch, stopPolling } = useSessionPolling(id)

  const [splitPercent, setSplitPercent] = useState(60)
  const [activeTask, setActiveTask] = useState(null)
  const [plannerModel, setPlannerModel] = useState("anthropic/claude-3.5-sonnet")
  const [coderModel, setCoderModel] = useState("poolside/laguna-m.1:free")
  const [showModels, setShowModels] = useState(false)
  const [planStreamUrl, setPlanStreamUrl] = useState(null)
  const [planStreamContent, setPlanStreamContent] = useState(false)
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

  // After approve-plan POST, poll every 500ms until status leaves plan_review.
  // This handles Supabase read-after-write lag without any manual navigation.
  function handlePlanApproved() {
    let attempts = 0
    const MAX_ATTEMPTS = 20  // 10 seconds max
    const poll = setInterval(async () => {
      attempts++
      await refetch()
      // refetch updates the session state; when status != plan_review
      // the component will re-render and PlanReview will unmount naturally.
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(poll)
      }
    }, 500)
  }

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
      setPlanStreamContent(false)
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

  if (loading) return <SessionSkeleton />

  if (error || !session) return <SessionError message={error || "Session not found"} onRetry={refetch} />

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
          <PlanReview session={session} onApproved={handlePlanApproved} onReplanned={() => refetch()} stopPolling={stopPolling} />
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
