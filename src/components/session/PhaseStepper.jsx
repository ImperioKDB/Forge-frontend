"use client"

/**
 * FORGE — PhaseStepper
 *
 * Compact 5-phase session journey indicator. Rebuilt on status-color
 * tokens (success/accent/error/muted) instead of inline hex values —
 * same visual idea (dots + connectors + mono labels), no glow.
 */

const PHASES = [
  { key: "planning", label: "Plan" },
  { key: "plan_review", label: "Review" },
  { key: "coding", label: "Code" },
  { key: "awaiting_approval", label: "Approve" },
  { key: "done", label: "Complete" },
]

const PHASE_INDEX = {
  planning: 0,
  plan_review: 1,
  coding: 2,
  awaiting_approval: 3,
  done: 4,
  failed: -1,
}

export default function PhaseStepper({ status }) {
  const currentIndex = PHASE_INDEX[status] ?? 0
  const isFailed = status === "failed"

  return (
    <div className="flex min-w-0 items-center">
      {PHASES.map((phase, i) => {
        const isComplete = !isFailed && i < currentIndex
        const isCurrent = !isFailed && i === currentIndex
        const isCurrentFailed = isFailed && i === 0
        const isLast = i === PHASES.length - 1

        const dotClass = isComplete
          ? "border-success bg-success-soft text-success"
          : isCurrentFailed
          ? "border-error bg-error-soft text-error"
          : isCurrent
          ? "border-accent bg-accent-soft text-accent"
          : "border-border bg-transparent text-muted"

        const labelClass = isComplete
          ? "text-success"
          : isCurrentFailed
          ? "text-error"
          : isCurrent
          ? "text-accent"
          : "text-muted"

        const connectorClass = !isFailed && i < currentIndex ? "bg-success" : "bg-border"

        return (
          <div key={phase.key} className="flex min-w-0 items-center">
            <div className="flex shrink-0 flex-col items-center gap-1">
              <div className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-normal ${dotClass}`}>
                {isComplete ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5L4.5 7.5L8.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className={`font-mono text-[8px] ${isCurrent || isCurrentFailed ? "font-semibold" : ""}`}>
                    {isCurrentFailed ? "!" : String(i + 1)}
                  </span>
                )}
              </div>
              <span className={`hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.08em] transition-colors duration-normal sm:block ${labelClass} ${isCurrent || isCurrentFailed ? "font-semibold" : ""}`}>
                {phase.label}
              </span>
            </div>

            {!isLast && <div className={`mb-3.5 h-[1.5px] max-w-[32px] flex-1 min-w-[8px] transition-colors duration-slow ${connectorClass}`} />}
          </div>
        )
      })}

      {isFailed && <span className="ml-2 whitespace-nowrap font-mono text-[10px] text-error">Failed</span>}
    </div>
  )
}
