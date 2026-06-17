"use client"

import { useRef, useEffect, useMemo, useState } from "react"
import DependencyGraph from "@/components/graph/DependencyGraph"
import { usePlannerTrace } from "@/lib/hooks/usePlannerTrace"

const ACCENT   = "var(--accent)"  // was a hardcoded green (#3DBA6F), unrelated to
                                   // the blue --accent used everywhere else for the
                                   // same "part of the graph" meaning -- now shared.
const VB_W     = 420
const VB_H     = 300
const CX       = VB_W / 2        // 210
const CY       = 110              // upper third -- fan nodes go below

// Five fan positions radiating downward from the anchor
const GHOST_ANGLES = [
  Math.PI * 0.58,
  Math.PI * 0.74,
  Math.PI * 0.90,
  Math.PI * 1.10,
  Math.PI * 1.26,
]
const GHOST_R = 130

function ghostPos(angle) {
  return {
    x: Math.round(CX + Math.cos(angle) * GHOST_R),
    y: Math.round(CY + Math.sin(angle) * GHOST_R),
  }
}

function cubicD(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  return `M${x1},${y1} C${Math.round(x1+dx*0.35-dy*0.12)},${Math.round(y1+dy*0.35+dx*0.12)} ${Math.round(x1+dx*0.7-dy*0.12)},${Math.round(y1+dy*0.7+dx*0.12)} ${x2},${y2}`
}

function shortLabel(path) {
  if (!path) return ""
  const parts = path.split("/")
  return parts.length > 1 ? `${parts[parts.length-2]}/${parts[parts.length-1]}` : path
}

/**
 * GhostGraph
 *
 * Renders the planning loading state entirely in SVG with hard-coded
 * accent colours so no CSS variable lookup is needed. Five ghost nodes
 * fan below the anchor with a pulsing ring animation.
 *
 * Replaced by the real DependencyGraph once file paths arrive.
 */
function GhostGraph() {
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-full" aria-hidden="true">
      {/* Ghost edges */}
      {GHOST_ANGLES.map((angle, i) => {
        const { x, y } = ghostPos(angle)
        return (
          <path
            key={i}
            d={cubicD(CX, CY, x, y)}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1.2}
            opacity={0.25}
          />
        )
      })}

      {/* Ghost nodes */}
      {GHOST_ANGLES.map((angle, i) => {
        const { x, y } = ghostPos(angle)
        return (
          <circle
            key={i}
            cx={x} cy={y} r={11}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1.5}
            opacity={0.35}
            style={{ animation: `forge-ghost-pulse 2.2s ease-in-out ${i * 0.22}s infinite` }}
          />
        )
      })}

      {/* Anchor pulsing outer ring */}
      <circle
        cx={CX} cy={CY} r={32}
        fill="none"
        stroke={ACCENT}
        strokeWidth={1}
        opacity={0.2}
        style={{ animation: "forge-ghost-pulse 1.8s ease-in-out infinite" }}
      />

      {/* Anchor filled circle */}
      <circle cx={CX} cy={CY} r={22} fill={ACCENT} opacity={0.9} />

      {/* "PRIMARY" label above anchor */}
      <text
        x={CX} y={CY - 30}
        textAnchor="middle"
        fontFamily="monospace"
        fontSize={9}
        letterSpacing="0.14em"
        fill="var(--text-muted)"
      >
        PRIMARY
      </text>

      {/* "analysing..." label below anchor */}
      <text
        x={CX} y={CY + 38}
        textAnchor="middle"
        fontFamily="monospace"
        fontSize={10}
        fill="var(--text-secondary)"
      >
        analysing…
      </text>

      <style>{`
        @keyframes forge-ghost-pulse {
          0%,100% { opacity: 0.35; }
          50%      { opacity: 0.08; }
        }
      `}</style>
    </svg>
  )
}

function buildLiveLayout(files) {
  const cap = Math.min(files.length, 5)
  return files.slice(0, cap).map((path, i) => {
    const angle = GHOST_ANGLES[i] ?? (Math.PI * 0.6 + i * 0.35)
    const { x, y } = ghostPos(angle)
    return {
      id:    `live-${i}`,
      x, y, r: 14,
      label: shortLabel(path),
      path:  cubicD(CX, CY, x, y),
    }
  })
}

/**
 * FORGE — PlanningScreen
 *
 * Full-bleed planning state visualiser.
 *
 * Top 60%: GhostGraph while no files named yet; switches to real
 *          DependencyGraph as file paths arrive from the SSE stream.
 * Bottom:  Scrolling mono trace log with blinking cursor.
 */
export default function PlanningScreen({ streamUrl }) {
  const { text, files, done } = usePlannerTrace(streamUrl)
  const logRef  = useRef(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [text])

  // Animate the "tracing..." dot to cycle through 1, 2, 3 dots
  useEffect(() => {
    if (done) return
    const t = setInterval(() => setTick(p => (p + 1) % 3), 600)
    return () => clearInterval(t)
  }, [done])

  const affected = useMemo(
    () => files.length > 0 ? buildLiveLayout(files) : [],
    [files]
  )

  const liveChanged = {
    id: "forge-anchor", x: CX, y: CY, r: 22,
    label: done ? "plan ready" : "analysing…",
  }

  const showGhost = files.length === 0

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header bar ── */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-2.5 border-b border-border">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            background: ACCENT,
            animation: done ? "none" : "forge-pulse 1.2s ease-in-out infinite",
          }}
        />
        <span className="font-mono text-xs tracking-widest uppercase text-muted">
          {done ? "Impact map" : `Tracing${".".repeat(tick + 1)}`}
        </span>
        {files.length > 0 && (
          <span className="ml-auto font-mono text-[10px] text-muted">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Graph area ── */}
      <div
        className="shrink-0 bg-surface flex items-center justify-center"
        style={{ height: "52%", minHeight: "220px" }}
      >
        {showGhost ? (
          <div className="w-full h-full p-2">
            <GhostGraph />
          </div>
        ) : (
          <DependencyGraph
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            changed={liveChanged}
            affected={affected}
            untouched={[]}
            once={false}
            showAnchorLabel={false}
            className="w-full h-full"
          />
        )}
      </div>

      {/* ── Trace log ── */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-elevated border-t border-border">
        <div className="flex shrink-0 items-center gap-2 px-4 py-2 border-b border-border">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{
              background: ACCENT,
              animation: done ? "none" : "forge-pulse 1.4s ease-in-out infinite",
            }}
          />
          <span className="font-mono text-[11px] text-secondary">
            {done ? "Planning complete" : "planning…"}
          </span>
        </div>

        <div
          ref={logRef}
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{ scrollBehavior: "smooth" }}
        >
          {!text ? (
            <span className="font-mono text-xs text-secondary opacity-60">
              Connecting to planner…
            </span>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-secondary">
              {text}
              {!done && (
                <span
                  className="ml-0.5 inline-block h-3 w-[5px] align-text-bottom"
                  style={{
                    background: ACCENT,
                    animation: "forge-blink 530ms step-end infinite",
                  }}
                />
              )}
            </pre>
          )}
        </div>
      </div>

      <style>{`
        @keyframes forge-pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes forge-blink  { 0%,100%{opacity:1} 50%{opacity:0}   }
      `}</style>
    </div>
  )
}
