"use client"

import StatusDot from "@/components/ui/StatusDot"

/**
 * FORGE — SubtaskRail
 *
 * Bottom panel listing all subtasks with their status. Selected
 * state uses the accent border/background (no shadow-glow). Empty
 * state icon uses the "+" graph-node motif instead of the ember dot.
 */
export default function SubtaskRail({ tasks, activeDraftId, onSelectTask }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-line bg-accent-soft">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-body text-sm font-medium text-secondary">No subtasks yet</p>
            <p className="font-body text-xs text-muted">Subtasks will appear once the plan is approved</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="shrink-0 border-b border-border px-4 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Subtasks</span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 py-2">
        {tasks.map((task, i) => {
          const draft = task.code_drafts?.[0]
          const isActive = draft?.id === activeDraftId
          const isReady = task.status === "awaiting_approval"
          const isDone = task.status === "done"
          const interactive = isReady

          return (
            <button
              key={task.id}
              onClick={() => isReady && onSelectTask(task)}
              disabled={!isReady && !isDone}
              className={`w-full rounded-md border p-3 text-left transition-colors duration-fast ${
                isActive
                  ? "border-accent-line bg-accent-soft"
                  : isReady
                  ? "border-border bg-surface hover:border-accent-line cursor-pointer"
                  : isDone
                  ? "border-border bg-surface opacity-60 cursor-default"
                  : "border-border bg-surface/50 cursor-default"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="shrink-0 pt-0.5 font-mono text-xs text-accent/70">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate font-mono text-xs text-secondary">{task.file_path || "Unknown file"}</span>
                  <p className="line-clamp-2 text-xs leading-snug text-muted">{task.instruction}</p>
                  <StatusDot status={task.status} />
                </div>
              </div>
              {isReady && (
                <div className="mt-2 border-t border-border pt-2">
                  <span className="text-xs text-accent">Tap to review →</span>
                </div>
              )}
              {isDone && (
                <div className="mt-2 flex items-center gap-1 border-t border-border pt-2">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5L4 7L8 3" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs text-success">Approved</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
