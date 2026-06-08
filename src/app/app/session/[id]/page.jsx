
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSessionPolling } from '@/lib/hooks/useSessionPolling'
import StreamingOutput from '@/components/session/StreamingOutput'
import PlanReview from '@/components/session/PlanReview'
import SubtaskRail from '@/components/session/SubtaskRail'
import StatusDot from '@/components/ui/StatusDot'
import ModelSelector from '@/components/ui/app/ModelSelector'
import CodeReview from '@/components/session/CodeReview'
import { apiFetch } from '@/lib/supabase/api'

// ─── DRAG HANDLE ──────────────────────────────────────────────────
function DragHandle({ onDrag }) {
  function handleMouseDown(e) {
    e.preventDefault()
    const startY = e.clientY
    const startTouch = e.touches?.[0]?.clientY ?? startY

    function onMove(e) {
      const currentY = e.touches?.[0]?.clientY ?? e.clientY
      onDrag(currentY - startTouch)
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      className="h-1 bg-border hover:bg-accent/40 active:bg-accent transition-colors duration-150 cursor-row-resize shrink-0 relative group"
    >
      <div className="absolute inset-x-0 -top-2 -bottom-2" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-border group-hover:bg-accent/60 rounded-full transition-colors duration-150" />
    </div>
  )
}

// ─── STATUS BAR ───────────────────────────────────────────────────
function SessionHeader({ session, plannerModel, coderModel, onPlannerChange, onCoderChange, showModels, onToggleModels }) {
  return (
    <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 shrink-0 bg-surface/50">
      <div className="flex items-center gap-3 min-w-0">
        <StatusDot status={session.status} />
        <p className="text-xs text-secondary truncate font-medium">
          {session.task}
        </p>
      </div>
      <button
        onClick={onToggleModels}
        className="text-xs text-muted hover:text-accent transition-colors duration-150 shrink-0 font-mono"
      >
        models
      </button>

      {/* Model switcher dropdown */}
      {showModels && (
        <div className="absolute top-14 right-4 z-50 w-72 bg-surface border border-border rounded shadow-glow p-4">
          <ModelSelector
            plannerModel={plannerModel}
            coderModel={coderModel}
            onPlannerChange={onPlannerChange}
            onCoderChange={onCoderChange}
          />
        </div>
      )}
    </div>
  )
}

// ─── FALLBACK STATES (when no stream active) ──────────────────────
function PlanningFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted">
        <span className="w-4 h-4 border border-muted border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-mono">Planning…</span>
      </div>
    </div>
  )
}

function CodingFallback({ tasks }) {
  const runningTask = tasks?.find(t => t.status === 'running')
  const doneCount = tasks?.filter(t => t.status === 'done' || t.status === 'awaiting_approval').length || 0
  const total = tasks?.length || 0

  if (!runningTask) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted font-mono">No active coding task</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Progress
          </span>
          <span className="text-xs font-mono text-muted">
            {doneCount}/{total}
          </span>
        </div>
        <div className="h-px bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 rounded-full"
            style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-3 bg-surface border border-accent/20 rounded">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-mono text-accent">Coding</span>
        </div>
        <span className="text-xs font-mono text-secondary">
          {runningTask.file_path}
        </span>
        <p className="text-xs text-muted leading-relaxed line-clamp-3">
          {runningTask.instruction}
        </p>
      </div>
    </div>
  )
}

function FailedState({ session }) {
  const router = useRouter()
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4 text-center">
      <div className="w-10 h-10 rounded-full border border-danger/30 bg-danger/10 flex items-center justify-center">
        <span className="text-danger text-lg">✕</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-secondary">Session failed</p>
        <p className="text-xs text-muted">
          The agent encountered an error. Check your OpenRouter key and try again.
        </p>
      </div>
      <button
        onClick={() => router.push('/app')}
        className="text-xs text-accent hover:underline"
      >
        Start new task
      </button>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function SessionPage() {
  const { id } = useParams()
  const { session, loading, error, refetch } = useSessionPolling(id)

  const [splitPercent, setSplitPercent] = useState(60)
  const [activeTask, setActiveTask] = useState(null)
  const [plannerModel, setPlannerModel] = useState('anthropic/claude-3.5-sonnet')
  const [coderModel, setCoderModel] = useState('poolside/laguna-m.1:free')
  const [showModels, setShowModels] = useState(false)

  // Load user's actual settings on mount so the model selector reflects reality
  useEffect(() => {
    apiFetch('/settings')
      .then(data => {
        if (data.settings?.planner_model) {
          setPlannerModel(data.settings.planner_model)
        }
        if (data.settings?.coder_model) {
          setCoderModel(data.settings.coder_model)
        }
      })
      .catch(() => {})
  }, [])

  // Sync model changes to backend settings so recovery / replanning uses the right models
  const handlePlannerChange = (model) => {
    setPlannerModel(model)
    apiFetch('/settings', {
      method: 'POST',
      body: JSON.stringify({ planner_model: model })
    }).catch(() => {})
  }

  const handleCoderChange = (model) => {
    setCoderModel(model)
    apiFetch('/settings', {
      method: 'POST',
      body: JSON.stringify({ coder_model: model })
    }).catch(() => {})
  }

  // Streaming state
  const [planStreamUrl, setPlanStreamUrl] = useState(null)
  const [planStreamStarted, setPlanStreamStarted] = useState(false)
  const [codeStreamUrl, setCodeStreamUrl] = useState(null)
  const [streamingTaskId, setStreamingTaskId] = useState(null)

  // Auto select first ready task (awaiting_approval)
  useEffect(() => {
    if (!session?.tasks) return
    const firstReady = session.tasks.find(t => t.status === 'awaiting_approval')
    if (firstReady && !activeTask) {
      setActiveTask(firstReady)
    }
  }, [session?.tasks, activeTask])

  // 1. Planning stream
  useEffect(() => {
    if (session?.status === 'planning' && !planStreamStarted) {
      setPlanStreamStarted(true)
      setPlanStreamUrl(`/agent/session/${id}/stream-plan`)
    }
    if (session?.status !== 'planning') {
      setPlanStreamStarted(false)
      setPlanStreamUrl(null)
    }
  }, [session?.status, id, planStreamStarted])

  // 2. Coding stream
  useEffect(() => {
    if (!session?.tasks) return
    const runningTask = session.tasks.find(t => t.status === 'running')
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
    setSplitPercent(prev => {
      const newVal = prev + (deltaY / window.innerHeight) * 100
      return Math.min(80, Math.max(20, newVal))
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted">
          <span className="w-4 h-4 border border-muted border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono">Loading session…</span>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-sm text-danger font-mono">
          {error || 'Session not found'}
        </p>
      </div>
    )
  }

  const isPlanReview = session.status === 'plan_review'
  const isPlanning = session.status === 'planning'
  const isCoding = session.status === 'coding'
  const isAwaitingApproval = session.status === 'awaiting_approval'
  const isDone = session.status === 'done'
  const isFailed = session.status === 'failed'

  const tasks = session.tasks || []

  return (
    <div
      className="flex flex-col bg-base relative"
      style={{ height: '100dvh' }}
      onClick={() => showModels && setShowModels(false)}
    >
      <SessionHeader
        session={session}
        plannerModel={plannerModel}
        coderModel={coderModel}
        onPlannerChange={handlePlannerChange}
        onCoderChange={handleCoderChange}
        showModels={showModels}
        onToggleModels={() => setShowModels(p => !p)}
      />

      {/* Plan review — full screen when in plan_review */}
      {isPlanReview && (
        <PlanReview
          session={session}
          onApproved={() => refetch()}
        />
      )}

      {/* Split panel — shown during all non‑plan_review states */}
      {(isPlanning || isCoding || isAwaitingApproval || isDone || isFailed) && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top panel — streaming output (plan or code) or static code draft */}
          <div
            className="overflow-hidden"
            style={{ height: `${splitPercent}%` }}
          >
            {/* Planning phase: stream the plan text */}
            {isPlanning && (
              planStreamUrl ? (
                <StreamingOutput
                  streamUrl={planStreamUrl}
                  title="Execution Plan"
                  language="markdown"
                />
              ) : (
                <PlanningFallback />
              )
            )}

            {/* Coding phase: stream the active task's code */}
            {isCoding && (
              codeStreamUrl ? (
                <StreamingOutput
                  streamUrl={codeStreamUrl}
                  title="Generating code..."
                  language="typescript"
                />
              ) : (
                <CodingFallback tasks={tasks} />
              )
            )}

            {/* Awaiting approval or done: show static code draft of selected task */}
            {(isAwaitingApproval || isDone) && activeTask ? (
              <CodeReview
                task={activeTask}
                draft={
                  session.code_drafts?.find(
                    d => d.task_id === activeTask.id &&
                    d.verdict === 'awaiting_approval'
                  ) ||
                  session.code_drafts?.find(
                    d => d.task_id === activeTask.id
                  )
                }
                onApproved={() => refetch()}
                onFeedbackSent={() => {
                  setActiveTask(null)
                  refetch()
                }}
              />
            ) : (isAwaitingApproval || isDone) && !activeTask ? (
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-8 h-8 rounded-full border border-accent/20 bg-accent/5 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1V13M1 7H13" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-xs font-mono text-muted">
                    Select a subtask from below to review
                  </p>
                </div>
              </div>
            ) : null}

            {isFailed && <FailedState session={session} />}
          </div>

          {/* Drag handle (only when bottom panel is present) */}
          {(isCoding || isAwaitingApproval || isDone || isFailed) && (
            <DragHandle onDrag={handleDrag} />
          )}

          {/* Bottom panel — subtask rail (only for coding & approval states) */}
          {(isCoding || isAwaitingApproval || isDone) && (
            <div
              className="overflow-hidden border-t border-border"
              style={{ height: `${100 - splitPercent}%` }}
            >
              <SubtaskRail
                tasks={tasks.map(t => ({
                  ...t,
                  code_drafts: session.code_drafts?.filter(d => d.task_id === t.id) || []
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
