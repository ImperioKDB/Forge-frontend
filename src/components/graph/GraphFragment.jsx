"use client"

import DependencyGraph from "./DependencyGraph"

/**
 * FORGE — GraphFragment
 *
 * Small, pre-composed dependency-graph "moments" used as punctuation
 * throughout the landing page — each demonstrates the sentence next
 * to it rather than decorating it. Re-triggers on every scroll-into-view
 * (DependencyGraph's `once={false}` default).
 *
 * Variants:
 *   "trace"    — one changed file, edges trace out to affected files.
 *                 Pairs with copy about impact analysis / tracing.
 *   "approval" — a changed file with affected nodes already revealed,
 *                 used alongside copy about per-file approval. Renders
 *                 status badges instead of plain labels.
 *   "settled"  — small, calm graph for the closing CTA — fewer nodes,
 *                 slower idle motion, reads as "done."
 */
export default function GraphFragment({ variant = "trace", className = "" }) {
  if (variant === "trace") {
    return (
      <DependencyGraph
        className={className}
        viewBox="0 0 360 240"
        changed={{ id: "changed", x: 180, y: 120, r: 22, label: "settings/page.jsx" }}
        affected={[
          { id: "a1", x: 60, y: 50, r: 15, label: "ThemeToggle.jsx", path: "M180,120 C140,100 100,75 60,50" },
          { id: "a2", x: 300, y: 50, r: 15, label: "useTheme.js", path: "M180,120 C220,100 260,75 300,50" },
          { id: "a3", x: 70, y: 195, r: 13, label: "layout.jsx", path: "M180,120 C140,150 100,180 70,195" },
        ]}
        untouched={[
          { id: "u1", x: 300, y: 195, r: 13, label: "routes.js", path: "M180,120 C220,150 260,180 300,195" },
        ]}
      />
    )
  }

  if (variant === "approval") {
    return (
      <DependencyGraph
        className={className}
        viewBox="0 0 360 220"
        changed={{ id: "changed", x: 180, y: 110, r: 20, label: "useTheme.js" }}
        affected={[
          { id: "a1", x: 50, y: 50, r: 14, label: "ThemeToggle.jsx — approved", path: "M180,110 C130,90 80,70 50,50" },
          { id: "a2", x: 310, y: 50, r: 14, label: "settings/page.jsx — review", path: "M180,110 C230,90 280,70 310,50" },
          { id: "a3", x: 180, y: 195, r: 14, label: "layout.jsx — queued", path: "M180,110 C180,140 180,170 180,195" },
        ]}
        untouched={[]}
      />
    )
  }

  // "settled" — fewer nodes, used near the CTA
  return (
    <DependencyGraph
      className={className}
      viewBox="0 0 300 180"
      changed={{ id: "changed", x: 150, y: 90, r: 18, label: "branch ready" }}
      affected={[
        { id: "a1", x: 60, y: 40, r: 12, label: "useTheme.js", path: "M150,90 C120,75 90,58 60,40" },
        { id: "a2", x: 240, y: 40, r: 12, label: "ThemeToggle.jsx", path: "M150,90 C180,75 210,58 240,40" },
      ]}
      untouched={[
        { id: "u1", x: 150, y: 160, r: 10, label: "layout.jsx", path: "M150,90 C150,113 150,138 150,160" },
      ]}
    />
  )
}
