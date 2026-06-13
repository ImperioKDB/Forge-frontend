"use client"

import { BouncingDots } from "@/components/ui/BouncingDots"

/**
 * FORGE — Demo: BouncingDots variants
 * Shows how to use the loading indicator across the app.
 */

export default function BouncingDotsDemo() {
  return (
    <div className="flex flex-col gap-8 p-8" style={{ background: "var(--bg-base)" }}>
      {/* Default — 3 dots, accent color */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted">Default (planning state)</span>
        <BouncingDots />
      </div>

      {/* With message — coding state */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted">With message (coding state)</span>
        <BouncingDots message="Generating code..." />
      </div>

      {/* Inline in subtask rail — compact */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted">Inline (subtask rail)</span>
        <BouncingDots message="Running..." messagePlacement="right" dotSize={8} />
      </div>

      {/* More dots — indexing progress */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted">Indexing (5 dots)</span>
        <BouncingDots dots={5} message="Indexing repository..." />
      </div>

      {/* Custom color — success state */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted">Success color</span>
        <BouncingDots color="var(--success)" message="Syncing..." />
      </div>
    </div>
  )
}
