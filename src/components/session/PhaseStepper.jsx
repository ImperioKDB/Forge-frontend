'use client'

/**
 * FORGE -- PhaseStepper
 * Phase 2: Dashboard Layout Refactor
 *
 * Shows the 5-phase session journey with visual progress.
 * Replaces the plain status dot + label in SessionHeader.
 *
 * Status -> phase mapping:
 *   planning          -> phase 0 (Planning) active
 *   plan_review       -> phase 1 (Review)   active
 *   coding            -> phase 2 (Coding)   active
 *   awaiting_approval -> phase 3 (Approval) active
 *   done              -> phase 4 (Complete) active
 *   failed            -> shows error state on current phase
 */

const PHASES = [
  { key: 'planning',          label: 'Plan',     short: 'P' },
  { key: 'plan_review',       label: 'Review',   short: 'R' },
  { key: 'coding',            label: 'Code',     short: 'C' },
  { key: 'awaiting_approval', label: 'Approve',  short: 'A' },
  { key: 'done',              label: 'Complete', short: '✓' },
]

const PHASE_INDEX = {
  planning:          0,
  plan_review:       1,
  coding:            2,
  awaiting_approval: 3,
  done:              4,
  failed:            -1,
}

export default function PhaseStepper({ status }) {
  const currentIndex = PHASE_INDEX[status] ?? 0
  const isFailed     = status === 'failed'

  return (
    <div className="flex items-center gap-0" style={{ minWidth: 0 }}>
      {PHASES.map((phase, i) => {
        const isComplete = !isFailed && i < currentIndex
        const isCurrent  = !isFailed && i === currentIndex
        const isFuture   = isFailed ? i > 0 : i > currentIndex
        const isLast     = i === PHASES.length - 1

        // Dot color
        let dotBg      = 'var(--bg-border)'
        let dotBorder  = 'var(--bg-border)'
        let dotColor   = 'var(--text-muted)'

        if (isComplete) {
          dotBg     = 'rgba(45,212,191,0.15)'
          dotBorder = 'var(--success)'
          dotColor  = 'var(--success)'
        } else if (isCurrent && isFailed) {
          dotBg     = 'rgba(248,113,113,0.12)'
          dotBorder = 'var(--error)'
          dotColor  = 'var(--error)'
        } else if (isCurrent) {
          dotBg     = 'var(--accent-dim)'
          dotBorder = 'var(--accent)'
          dotColor  = 'var(--accent)'
        }

        // Connector fill
        const connectorFilled = !isFailed && i < currentIndex

        return (
          <div key={phase.key} className="flex items-center" style={{ minWidth: 0 }}>
            {/* Step dot */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                style={{
                  width:        '22px',
                  height:       '22px',
                  borderRadius: '50%',
                  border:       `1.5px solid ${dotBorder}`,
                  background:   dotBg,
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  transition:   'all 250ms ease',
                }}
              >
                {isComplete ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5L4.5 7.5L8.5 3"
                      stroke="var(--success)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span
                    style={{
                      fontSize:   '8px',
                      fontFamily: 'var(--font-mono)',
                      color:      dotColor,
                      fontWeight: isCurrent ? '600' : '400',
                    }}
                  >
                    {isCurrent && isFailed ? '!' : String(i + 1)}
                  </span>
                )}
              </div>

              {/* Label -- hidden on very small screens */}
              <span
                className="hidden sm:block"
                style={{
                  fontSize:   '9px',
                  fontFamily: 'var(--font-mono)',
                  color:      isComplete
                    ? 'var(--success)'
                    : isCurrent && !isFailed
                    ? 'var(--accent)'
                    : isCurrent && isFailed
                    ? 'var(--error)'
                    : 'var(--text-muted)',
                  whiteSpace:  'nowrap',
                  fontWeight:  isCurrent ? '600' : '400',
                  transition:  'color 250ms ease',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {phase.label}
              </span>
            </div>

            {/* Connector line between steps */}
            {!isLast && (
              <div
                style={{
                  flex:         '1 1 12px',
                  minWidth:     '8px',
                  maxWidth:     '32px',
                  height:       '1.5px',
                  marginBottom: '14px',  /* aligns with dot center, above label */
                  background:   connectorFilled
                    ? 'var(--success)'
                    : 'var(--bg-border)',
                  transition:   'background 400ms ease',
                }}
              />
            )}
          </div>
        )
      })}

      {/* Failed label */}
      {isFailed && (
        <span
          style={{
            marginLeft:  '8px',
            fontSize:    '10px',
            fontFamily:  'var(--font-mono)',
            color:       'var(--error)',
            whiteSpace:  'nowrap',
          }}
        >
          Failed
        </span>
      )}
    </div>
  )
}
