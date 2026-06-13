"use client"

import DotPattern from "@/components/ui/DotPattern"

/**
 * FORGE — Demo: DotPattern usage
 * Decorative background pattern for cards, sections, or empty states.
 */

export default function DotPatternDemo() {
  return (
    <div className="flex flex-col gap-8 p-8" style={{ background: "var(--bg-base)" }}>
      
      {/* Card with dot pattern background */}
      <div className="relative overflow-hidden rounded-lg border border-border p-6" style={{ background: "var(--bg-surface)" }}>
        <DotPattern width={20} height={20} className="opacity-[0.07]" />
        <div className="relative z-10">
          <h3 className="font-display font-semibold text-secondary mb-1">Repository Stats</h3>
          <p className="font-body text-sm text-muted">42 files indexed · Last updated 2h ago</p>
        </div>
      </div>

      {/* Empty state with dense pattern */}
      <div className="relative overflow-hidden rounded-lg border border-border p-10 flex flex-col items-center text-center" style={{ background: "var(--bg-surface)" }}>
        <DotPattern width={8} height={8} cr={0.3} className="opacity-[0.1]" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--accent-dim)", border: "1px solid var(--accent)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-body text-sm text-secondary font-medium">No sessions yet</p>
          <p className="font-mono text-xs text-muted">Start your first task to see it here</p>
        </div>
      </div>

      {/* Hero section with subtle pattern */}
      <div className="relative overflow-hidden rounded-xl border border-border py-16 px-8" style={{ background: "var(--bg-elevated)" }}>
        <DotPattern width={32} height={32} className="opacity-[0.05]" />
        <div className="relative z-10 text-center">
          <h1 className="font-display font-bold text-2xl text-primary mb-2">Forge understands your codebase</h1>
          <p className="font-body text-sm text-muted max-w-md mx-auto">Describe what you want to build. Forge plans it, codes it, and ships it — with your approval at every step.</p>
        </div>
      </div>
    </div>
  )
}
