"use client"

import { useEffect, useId, useMemo, useRef } from "react"
import { motion, useAnimation, useInView, useReducedMotion } from "framer-motion"

/**
 * FORGE — DependencyGraph
 *
 * The recurring visual motif of the product: nodes are files, edges are
 * imports. A "changed" node sits at the centre of a small subgraph;
 * "affected" nodes are everything downstream that the change touches.
 *
 * MOTION LANGUAGE
 * ────────────────────────────────────────────────────────────────────
 * Idle (always running, very subtle, desynced per element):
 *   - Edges drift in opacity on a slow (4–6s) irregular cycle.
 *   - Unselected nodes breathe in scale on an even slower (~8s) cycle.
 *
 * Triggered sequence ("trace → pulse → reveal"), fires once per
 * viewport entry and resets on exit so it can replay:
 *   1. TRACE  — edge from the changed node draws itself outward
 *      (strokeDashoffset / pathLength), ease-out-expo.
 *   2. PULSE  — a small travelling dot runs along the edge as it
 *      completes, arriving at the downstream node.
 *   3. REVEAL — the node snaps into its highlighted state with a
 *      spring scale pop (0.9 → 1.05 → 1.0) and its label fades in.
 *   Staggered ~90ms per node so multi-file impact reads as a cascade.
 *
 * Respects prefers-reduced-motion: idle motion and the triggered
 * sequence are both disabled; affected state is shown immediately.
 *
 * USAGE
 *   <DependencyGraph
 *     viewBox="0 0 460 460"
 *     changed={{ id: 'settings', x: 230, y: 230, r: 28, label: 'settings/page.jsx' }}
 *     affected={[
 *       { id: 'theme-toggle', x: 90,  y: 360, r: 20, label: 'ThemeToggle.jsx',
 *         path: 'M230,230 C180,260 130,300 90,360' },
 *       ...
 *     ]}
 *     untouched={[
 *       { id: 'middleware', x: 90, y: 90, r: 20, label: 'middleware.js',
 *         path: 'M230,230 C170,210 130,140 90,90' },
 *     ]}
 *   />
 */

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]
const SPRING = { type: "spring", stiffness: 380, damping: 18 }

export default function DependencyGraph({
  changed,
  affected = [],
  untouched = [],
  viewBox = "0 0 460 460",
  className = "",
  once = false,        // false = re-trigger every time it scrolls into view
  showAnchorLabel = true, // set false to suppress the anchor file label
}) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const inView = useInView(ref, { once, margin: "-15% 0px" })
  const gradId = useId()

  // Idle breathing: a small set of pre-generated per-element timing
  // offsets so edges/nodes don't pulse in lockstep.
  const idleTimings = useMemo(() => {
    const seedFor = (i) => {
      const x = Math.sin(i * 12.9898) * 43758.5453
      return x - Math.floor(x)
    }
    return {
      edges: untouched.concat(affected).map((_, i) => ({
        duration: 4 + seedFor(i) * 2.4, // 4–6.4s
        delay: seedFor(i + 100) * 3,
      })),
      nodes: untouched.map((_, i) => ({
        duration: 7 + seedFor(i + 200) * 2.6, // 7–9.6s
        delay: seedFor(i + 300) * 4,
      })),
    }
  }, [untouched, affected])

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <svg viewBox={viewBox} className="w-full h-full block" aria-hidden="true">
        <defs>
          <radialGradient id={`${gradId}-pulse`}>
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ─── Untouched edges (idle breathing only) ─── */}
        {untouched.map((node, i) => (
          <motion.path
            key={`edge-untouched-${node.id}`}
            d={node.path}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth={1.4}
            className="graph-edge-untouched"
            initial={{ opacity: 0.22 }}
            animate={
              reduceMotion
                ? { opacity: 0.22 }
                : { opacity: [0.15, 0.32, 0.15] }
            }
            transition={
              reduceMotion
                ? {}
                : {
                    duration: idleTimings.edges[i]?.duration ?? 5,
                    delay: idleTimings.edges[i]?.delay ?? 0,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
        ))}

        {/* ─── Affected edges (trace → pulse) ─── */}
        {affected.map((node, i) => {
          const traceDelay = i * 0.09
          return (
            <g key={`edge-affected-${node.id}`}>
              {/* Idle base edge — always faintly present */}
              <path
                d={node.path}
                fill="none"
                stroke="var(--line-strong)"
                strokeWidth={1.4}
                opacity={0.25}
              />
              {/* Trace overlay — draws itself in on view */}
              <motion.path
                d={node.path}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="4 5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  inView
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={{
                  pathLength: {
                    duration: reduceMotion ? 0 : 0.6,
                    delay: reduceMotion ? 0 : traceDelay,
                    ease: EASE_OUT_EXPO,
                  },
                  opacity: { duration: 0.2, delay: reduceMotion ? 0 : traceDelay },
                }}
                style={{
                  // continued dash crawl once traced, very subtle
                  animation: reduceMotion
                    ? "none"
                    : inView
                    ? `forge-dash-crawl 1.4s linear ${0.6 + traceDelay}s infinite`
                    : "none",
                }}
              />
              {/* Pulse — travelling dot along the path */}
              {!reduceMotion && (
                <motion.circle
                  r={4}
                  fill={`url(#${gradId}-pulse)`}
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: [0, 1, 0] } : { opacity: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: traceDelay + 0.35,
                    times: [0, 0.4, 1],
                    ease: "easeOut",
                  }}
                  style={{ offsetPath: `path("${node.path}")`, offsetDistance: "100%" }}
                />
              )}
            </g>
          )
        })}

        {/* ─── Untouched nodes (idle breathing) ─── */}
        {untouched.map((node, i) => (
          <g key={`node-untouched-${node.id}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.r}
              fill="var(--bg-surface, var(--paper))"
              stroke="var(--line-strong)"
              strokeWidth={1.5}
              initial={{ scale: 1 }}
              animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.02, 1] }}
              transition={
                reduceMotion
                  ? {}
                  : {
                      duration: idleTimings.nodes[i]?.duration ?? 8,
                      delay: idleTimings.nodes[i]?.delay ?? 0,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
              style={{ transformOrigin: `${node.x}px ${node.y}px` }}
            />
            {node.label && (
              <text
                x={node.x}
                y={node.y + node.r + 18}
                textAnchor="middle"
                className="font-mono"
                fontSize={10}
                fill="var(--text-secondary, var(--ink-soft))"
              >
                {node.label}
              </text>
            )}
          </g>
        ))}

        {/* ─── Affected nodes (reveal on trace arrival) ─── */}
        {affected.map((node, i) => {
          const arriveDelay = i * 0.09 + 0.55
          return (
            <g key={`node-affected-${node.id}`}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="var(--accent, #3DBA6F)"
                fillOpacity={0.12}
                stroke="var(--accent, #3DBA6F)"
                strokeWidth={2}
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  inView
                    ? { scale: [0.9, 1.06, 1], opacity: 1 }
                    : { scale: 0, opacity: 0 }
                }
                transition={{
                  duration: reduceMotion ? 0 : 0.5,
                  delay: reduceMotion ? 0 : arriveDelay,
                  ease: reduceMotion ? "linear" : EASE_OUT_EXPO,
                  times: [0, 0.6, 1],
                }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              <motion.text
                x={node.x}
                y={node.y + node.r + 18}
                textAnchor="middle"
                className="font-mono"
                fontSize={10}
                fontWeight={600}
                fill="var(--accent, #3DBA6F)"
                initial={{ opacity: 0, y: node.y + node.r + 22 }}
                animate={
                  inView
                    ? { opacity: 1, y: node.y + node.r + 18 }
                    : { opacity: 0, y: node.y + node.r + 22 }
                }
                transition={{
                  duration: 0.25,
                  delay: reduceMotion ? 0 : arriveDelay + 0.1,
                }}
              >
                {node.label}
              </motion.text>
            </g>
          )
        })}

        {/* ─── Changed node (centre, always solid) ─── */}
        {changed && (
          <g>
            {/* Outer glow ring */}
            <motion.circle
              cx={changed.x}
              cy={changed.y}
              r={changed.r + 6}
              fill="none"
              stroke="var(--accent, #3DBA6F)"
              strokeWidth={1}
              opacity={0.3}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.3 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              style={{ transformOrigin: `${changed.x}px ${changed.y}px` }}
            />
            {/* Main filled circle — accent so it pops on dark backgrounds */}
            <motion.circle
              cx={changed.x}
              cy={changed.y}
              r={changed.r}
              fill="var(--accent, #3DBA6F)"
              stroke="var(--accent, #3DBA6F)"
              strokeWidth={2.5}
              initial={{ scale: 0.85 }}
              animate={{ scale: [0.85, 1.04, 1] }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              style={{ transformOrigin: `${changed.x}px ${changed.y}px` }}
            />
            {/* Label ABOVE: "primary" badge in muted mono */}
            <text
              x={changed.x}
              y={changed.y - changed.r - 10}
              textAnchor="middle"
              className="font-mono"
              fontSize={9}
              fontWeight={600}
              letterSpacing="0.14em"
              fill="var(--text-muted, #888)"
            >
              PRIMARY
            </text>
            {/* File label BELOW: always white/primary so it reads on any bg */}
            {showAnchorLabel && changed.label && (
              <text
                x={changed.x}
                y={changed.y + changed.r + 18}
                textAnchor="middle"
                className="font-mono"
                fontSize={10}
                fontWeight={600}
                fill="var(--text-primary, #fff)"
              >
                {changed.label}
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Continued dash-crawl keyframes for traced edges */}
      <style>{`
        @keyframes forge-dash-crawl {
          to { stroke-dashoffset: -18; }
        }
      `}</style>
    </div>
  )
}
