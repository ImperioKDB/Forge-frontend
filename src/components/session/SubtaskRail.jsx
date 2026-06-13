'use client'

import StatusDot from '@/components/ui/StatusDot'

export default function SubtaskRail({ tasks, activeDraftId, onSelectTask }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(232,103,26,0.08)',
              border: '1px solid var(--accent-dim)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-body text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              No subtasks yet
            </p>
            <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
              Subtasks will appear once the plan is approved
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-2.5 border-b border-border shrink-0">
        <span className="text-xs font-mono text-muted uppercase tracking-wider">Subtasks</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-1.5">
        {tasks.map((task, i) => {
          const draft    = task.code_drafts?.[0]
          const isActive = draft?.id === activeDraftId
          const isReady  = task.status === 'awaiting_approval'
          const isDone   = task.status === 'done'

          return (
            <button
              key={task.id}
              onClick={() => isReady && onSelectTask(task)}
              disabled={!isReady && !isDone}
              className={`
                w-full text-left p-3 rounded border transition-all duration-150
                ${isActive
                  ? 'border-accent/40 bg-accent/5 shadow-glow-sm'
                  : isReady
                  ? 'border-border hover:border-accent/30 bg-surface cursor-pointer'
                  : isDone
                  ? 'border-border bg-surface opacity-60 cursor-default'
                  : 'border-border bg-surface/50 cursor-default'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono text-accent/70 shrink-0 pt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                  <span className="text-xs font-mono text-secondary truncate">
                    {task.file_path || 'Unknown file'}
                  </span>
                  <p className="text-xs text-muted leading-snug line-clamp-2">
                    {task.instruction}
                  </p>
                  <StatusDot status={task.status} />
                </div>
              </div>

              {isReady && (
                <div className="mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-accent">Tap to review →</span>
                </div>
              )}

              {isDone && (
                <div className="mt-2 pt-2 border-t border-border flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
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
