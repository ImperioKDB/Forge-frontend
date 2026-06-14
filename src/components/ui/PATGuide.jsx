/**
 * FORGE — PATGuide
 *
 * Step-by-step guide for creating a GitHub PAT with the right scopes.
 * Extracted from ErrorDisplay.jsx into its own file using new tokens
 * (numbered ledger style, matching the landing page "problem" section).
 */

const STEPS = [
  { n: "01", title: "Open GitHub settings", detail: "Go to github.com, click your profile photo, then Settings" },
  { n: "02", title: "Developer Settings", detail: 'Scroll to the bottom of the sidebar and click "Developer settings"' },
  { n: "03", title: "Fine-grained tokens", detail: 'Click "Personal access tokens", then "Fine-grained tokens"' },
  { n: "04", title: "Generate new token", detail: 'Click "Generate new token", give it a name and set an expiry' },
  { n: "05", title: "Set permissions", detail: "Repository permissions: Contents = Read and write, Metadata = Read" },
  { n: "06", title: "Copy your token", detail: "Click \"Generate token\" and copy immediately. It will not be shown again." },
]

export function PATGuide({ compact = false }) {
  if (compact) {
    return (
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-accent">
        Create a PAT on GitHub →
      </a>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4" role="region" aria-label="How to create a GitHub PAT">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">How to create a GitHub PAT</p>
      <div className="flex flex-col gap-3">
        {STEPS.map(({ n, title, detail }) => (
          <div key={n} className="flex gap-3">
            <span className="mt-0.5 w-6 shrink-0 font-mono text-xs text-accent opacity-70">{n}</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-body text-xs font-medium text-secondary">{title}</span>
              <span className="font-body text-xs leading-relaxed text-muted">{detail}</span>
            </div>
          </div>
        ))}
      </div>
      <a
        href="https://github.com/settings/personal-access-tokens/new"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary self-start"
      >
        Open GitHub token page →
      </a>
    </div>
  )
}

export default PATGuide
