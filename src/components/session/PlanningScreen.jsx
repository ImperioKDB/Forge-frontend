"use client"

import { useRef, useEffect, useMemo } from "react"
import DependencyGraph from "@/components/graph/DependencyGraph"
import { usePlannerTrace } from "@/lib/hooks/usePlannerTrace"

function shortLabel(path) {
  if (!path) return ""
  const parts = path.split("/")
  return parts.length > 1 ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}` : path
}

/**
 * Compute a stable circular layout for up to 7 file nodes around a
 * centre anchor. Each file path gets a deterministic x/y derived from
 * its index so the graph doesn't jump when a new node arrives.
 */
function buildLiveLayout(files, cx = 210, cy = 175, radius = 140) {
  const cap = Math.min(files.length, 7)
  const affected = files.slice(0, cap).map((path, i) => {
    const angle = (i / Math.max(cap, 1)) * Math.PI * 1.6 - Math.PI * 0.3
    const x = Math.round(cx + Math.cos(angle) * radius)
    const y = Math.round(cy + Math.sin(angle) * radius)
    return {
      id: `live-${i}`,
      x,
      y,
      r: 14,
      label: shortLabel(path),
      path: `M${cx},${cy} C${cx + (x - cx) * 0.4},${cy + (y - cy) * 0.2} ${cx + (x - cx) * 0.7},${cy + (y - cy) * 0.6} ${x},${y}`,
    }
  })
  return affected
}

/**
 * FORGE -- PlanningScreen
 *
 * Full-bleed planning state visualiser. Replaces the old PlanningFallback
 * spinner. Shows real-time planner output as it arrives over SSE:
 *
 *   - A live dependency graph that adds affected nodes as the planner
 *     names files in its output stream.
 *   - A scrolling mono trace log of the raw plan text.
 *
 * @param {string|null} streamUrl  SSE stream URL for the plan
 */
export default function PlanningScreen({ streamUrl }) {
  const { text, files, done } = usePlannerTrace(streamUrl)
  const logRef = useRef(null)

  // Auto-scroll the trace log as tokens arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [text])

  const affected = useMemo(() => buildLiveLayout(files), [files])

  const changed = {
    id: "forge-anchor",
    x: 210,
    y: 175,
    r: 22,
    label: done ? "plan ready" : "analysing…",
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Live graph ── */}
      <div className="shrink-0 border-b border-border bg-surface" style={{ height: "52%" }}>
        <div className="mx-auto h-full max-w-lg px-4 py-3">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {done ? "impact map" : "tracing…"}
          </div>
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

        <div
          ref={logRef}
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{ scrollBehavior: "smooth" }}
        >
          {!text && (
            <span className="font-mono text-xs text-muted">
              Connecting to planner…
            </span>
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
        @keyframes forge-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes forge-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
