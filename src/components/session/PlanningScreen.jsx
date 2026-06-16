"use client"

import { useRef, useEffect, useMemo } from "react"
import DependencyGraph from "@/components/graph/DependencyGraph"
import { usePlannerTrace } from "@/lib/hooks/usePlannerTrace"

function shortLabel(path) {
  if (!path) return ""
  const parts = path.split("/")
  return parts.length > 1 ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}` : path
}

// Anchor sits in the upper third. Ghost nodes fan below it in a wide arc
// so lines radiate downward -- no crossing, no X shape, no clipping.
const CX_PLAN = 210
const CY_PLAN = 120  // upper third of viewBox (0 0 420 350)
const GHOST_ANGLES = [
  Math.PI * 0.55,   // lower-left
  Math.PI * 0.72,   // left
  Math.PI * 0.88,   // lower-centre-left
  Math.PI * 1.12,   // lower-centre-right
  Math.PI * 1.28,   // right
]
const GHOST_RADIUS = 155

function buildLiveLayout(files, cx = CX_PLAN, cy = CY_PLAN, radius = GHOST_RADIUS) {
  const cap = Math.min(files.length, 5)
  return files.slice(0, cap).map((path, i) => {
    const angle = GHOST_ANGLES[i] ?? (Math.PI * 0.6 + i * 0.35)
    const x = Math.round(cx + Math.cos(angle) * radius)
    const y = Math.round(cy + Math.sin(angle) * radius)
    return {
      id:    `live-${i}`,
      x, y,
      r:     14,
      label: shortLabel(path),
      path:  `M${cx},${cy} C${Math.round(cx + (x - cx) * 0.35)},${Math.round(cy + (y - cy) * 0.15)} ${Math.round(cx + (x - cx) * 0.7)},${Math.round(cy + (y - cy) * 0.65)} ${x},${y}`,
    }
  })
}

function buildGhostNodes(cx = CX_PLAN, cy = CY_PLAN) {
  return GHOST_ANGLES.map((angle, i) => {
    const x = Math.round(cx + Math.cos(angle) * GHOST_RADIUS)
    const y = Math.round(cy + Math.sin(angle) * GHOST_RADIUS)
    return {
      id:    `ghost-${i}`,
      x, y,
      r:     12,
      label: "",
      ghost: true,
      path:  `M${cx},${cy} C${Math.round(cx + (x - cx) * 0.35)},${Math.round(cy + (y - cy) * 0.15)} ${Math.round(cx + (x - cx) * 0.7)},${Math.round(cy + (y - cy) * 0.65)} ${x},${y}`,
    }
  })
}

/**
 * FORGE -- PlanningScreen
 *
 * Full-bleed planning state visualiser.
 *
 * Top half:  live DependencyGraph. Shows ghost placeholder nodes while
 *            the planner stream hasn't named any files yet, then swaps
 *            them for real file nodes as they appear in the stream.
 * Bottom:    scrolling mono trace log of the raw plan text.
 */
export default function PlanningScreen({ streamUrl }) {
  const { text, files, done } = usePlannerTrace(streamUrl)
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [text])

  // Use real nodes if we have them, ghost nodes while waiting
  const affected = useMemo(
    () => files.length > 0 ? buildLiveLayout(files) : buildGhostNodes(),
    [files]
  )

  const changed = {
    id:    "forge-anchor",
    x:     CX_PLAN,
    y:     CY_PLAN,
    r:     22,
    label: done ? "plan ready" : "analysing…",
  }

  const isShowingGhosts = files.length === 0

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Live graph ── */}
      <div className="shrink-0 border-b border-border bg-surface" style={{ height: "52%" }}>
        <div className="mx-auto h-full max-w-lg px-4 py-3">
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {done ? "impact map" : "tracing…"}
            {isShowingGhosts && !done && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                style={{ animation: "forge-pulse 1.4s ease-in-out infinite" }}
              />
            )}
          </div>
          <div className={isShowingGhosts ? "opacity-45" : "opacity-100"} style={{ transition: "opacity 0.6s ease" }}>
            <DependencyGraph
              viewBox="0 0 420 350"
              changed={changed}
              affected={affected}
              untouched={[]}
              once={false}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>

      {/* ── Scrolling trace log ── */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-elevated">
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
            style={{ animation: done ? "none" : "forge-pulse 1.2s ease-in-out infinite" }}
          />
          <span className="font-mono text-[11px] text-muted">
            {done ? "planning complete" : "planning…"}
          </span>
          {files.length > 0 && (
            <span className="ml-auto font-mono text-[10px] text-muted">
              {files.length} file{files.length !== 1 ? "s" : ""} identified
            </span>
          )}
        </div>

        <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollBehavior: "smooth" }}>
          {!text && (
            <span className="font-mono text-xs text-muted">Connecting to planner…</span>
          )}
          {text && (
            <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-secondary">
              {text}
              {!done && (
                <span
                  className="ml-0.5 inline-block h-3 w-1.5 bg-accent align-text-bottom"
                  style={{ animation: "forge-blink 530ms step-end infinite" }}
                />
              )}
            </pre>
          )}
        </div>
      </div>

      <style>{`
        @keyframes forge-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes forge-blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
