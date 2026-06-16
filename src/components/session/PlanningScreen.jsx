"use client"

import { useRef, useEffect, useMemo } from "react"
import DependencyGraph from "@/components/graph/DependencyGraph"
import { usePlannerTrace } from "@/lib/hooks/usePlannerTrace"

function shortLabel(path) {
  if (!path) return ""
  const parts = path.split("/")
  return parts.length > 1 ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}` : path
}

// Ghost placeholder positions -- fixed so the graph isn't empty on load
const GHOST_POSITIONS = [
  { x: 100, y:  80 },
  { x: 320, y:  80 },
  { x:  70, y: 270 },
  { x: 350, y: 270 },
]

function buildLiveLayout(files, cx = 210, cy = 175, radius = 130) {
  const cap = Math.min(files.length, 7)
  return files.slice(0, cap).map((path, i) => {
    const angle = (i / Math.max(cap, 1)) * Math.PI * 1.6 - Math.PI * 0.3
    const x = Math.round(cx + Math.cos(angle) * radius)
    const y = Math.round(cy + Math.sin(angle) * radius)
    return {
      id:    `live-${i}`,
      x, y,
      r:     14,
      label: shortLabel(path),
      path:  `M${cx},${cy} C${cx + (x - cx) * 0.4},${cy + (y - cy) * 0.2} ${cx + (x - cx) * 0.7},${cy + (y - cy) * 0.6} ${x},${y}`,
    }
  })
}

function buildGhostNodes(cx = 210, cy = 175) {
  return GHOST_POSITIONS.map((pos, i) => ({
    id:      `ghost-${i}`,
    x:       pos.x,
    y:       pos.y,
    r:       12,
    label:   "",
    ghost:   true,
    path:    `M${cx},${cy} C${cx + (pos.x - cx) * 0.4},${cy + (pos.y - cy) * 0.2} ${cx + (pos.x - cx) * 0.7},${cy + (pos.y - cy) * 0.6} ${pos.x},${pos.y}`,
  }))
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

  const cx = 210
  const cy = 175

  // Use real nodes if we have them, ghost nodes while waiting
  const affected = useMemo(
    () => files.length > 0 ? buildLiveLayout(files, cx, cy) : buildGhostNodes(cx, cy),
    [files]
  )

  const changed = {
    id:    "forge-anchor",
    x:     cx,
    y:     cy,
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
          <div className={isShowingGhosts ? "opacity-30" : "opacity-100"} style={{ transition: "opacity 0.6s ease" }}>
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
