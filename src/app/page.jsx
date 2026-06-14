import Link from "next/link"
import DependencyGraph from "@/components/graph/DependencyGraph"
import GraphFragment from "@/components/graph/GraphFragment"

/**
 * FORGE — Landing page
 *
 * "Blueprint / Schematic" design language. Paper + ink, one structural
 * accent. The dependency graph appears as small, repeated "moments"
 * (GraphFragment) that demonstrate each step of the workflow rather
 * than a single decorative hero animation.
 */

export const metadata = {
  title: "Forge — Read your repo. Plan the change. Ship it from anywhere.",
  description:
    "Forge is a repository-aware coding agent. Connect a GitHub repo and Forge traces every file a change will touch before writing a line of code — with your approval at every step.",
}

export default function LandingPage() {
  return (
    <div className="bg-paper text-ink">
      <NavBar />
      <Hero />
      <Problem />
      <Workflow />
      <StatStrip />
      <CTA />
      <Footer />
    </div>
  )
}

/* ───────────────────────── NAV ───────────────────────── */

function Logo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="3.5" fill="var(--ink)" />
      <circle cx="18" cy="6" r="3.5" stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-soft)" />
      <circle cx="12" cy="18" r="3.5" stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-soft)" />
      <path d="M9 7 L15 7" stroke="var(--line-strong)" strokeWidth="1.5" />
      <path d="M8 8.5 L10.5 15.5" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M16 8.5 L13.5 15.5" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  )
}

function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between px-6 py-[18px] sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-display text-[1.4rem] font-semibold tracking-tight">
          <Logo />
          Forge
        </Link>
        <div className="flex items-center gap-7 text-sm">
          <a href="#workflow" className="hidden text-ink-soft transition-colors hover:text-ink md:inline">
            How it works
          </a>
          <a href="#problem" className="hidden text-ink-soft transition-colors hover:text-ink md:inline">
            Why
          </a>
          <Link href="/login" className="hidden text-ink-soft transition-colors hover:text-ink md:inline">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ───────────────────────── HERO ───────────────────────── */

function Hero() {
  return (
    <header className="relative overflow-hidden border-b border-line">
      <div className="blueprint-grid" />
      <div className="relative mx-auto max-w-[1160px] px-6 py-20 sm:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <div className="mb-5 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              REPOSITORY-AWARE CODING AGENT
            </div>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-medium leading-[1.08] tracking-tight">
              Forge reads your codebase{" "}
              <em className="font-normal italic text-accent">like a map</em> — then
              changes it without getting lost.
            </h1>
            <p className="mt-5 max-w-[32em] text-lg text-ink-soft">
              Connect a repo. Describe a change. Forge traces every file it will
              touch before it writes a single line — and you approve each step,
              from your phone or your desk.
            </p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <Link href="/signup" className="btn-primary btn-lg">
                Connect a repository →
              </Link>
              <a href="#workflow" className="btn btn-lg">
                See how it plans
              </a>
            </div>
            <div className="mt-4 font-mono text-xs text-ink-faint">
              No credit card. Read &amp; write access scoped to the repos you choose.
            </div>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-lg border border-line-strong blueprint-grid-dense">
            <div className="absolute left-4 top-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              DEPENDENCY GRAPH — LIVE
            </div>
            <div className="absolute bottom-3.5 right-4 flex items-center gap-1.5 font-mono text-[10px] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              3 files affected
            </div>
            <div className="flex h-full w-full items-center p-6">
              <DependencyGraphHero />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function DependencyGraphHero() {
  // Larger composition for the hero panel — same primitive as
  // GraphFragment, with a bespoke layout for the hero panel.
  return (
    <DependencyGraph
      viewBox="0 0 460 460"
      changed={{ id: "changed", x: 230, y: 230, r: 28, label: "settings/page.jsx" }}
      affected={[
        { id: "a1", x: 90, y: 360, r: 20, label: "ThemeToggle.jsx", path: "M230,230 C180,260 130,300 90,360" },
        { id: "a2", x: 380, y: 360, r: 20, label: "useTheme.js", path: "M230,230 C290,260 340,300 380,360" },
        { id: "a3", x: 360, y: 170, r: 16, label: "layout.jsx", path: "M230,230 C260,200 300,180 360,170" },
      ]}
      untouched={[
        { id: "u1", x: 90, y: 90, r: 20, label: "middleware.js", path: "M230,230 C170,210 130,140 90,90" },
        { id: "u2", x: 400, y: 80, r: 18, label: "api/client.js", path: "M230,230 C300,200 360,150 400,80" },
        { id: "u3", x: 70, y: 210, r: 14, label: "routes.js", path: "M90,90 C60,130 50,170 70,210" },
      ]}
    />
  )
}

/* ───────────────────────── PROBLEM ───────────────────────── */

const PROBLEMS = [
  {
    n: "01",
    title: "Agents that guess at imports",
    body: "Most tools paste a file into context and hope. They don't know what calls that file, what it exports, or what depends on the function being changed — so \"small\" edits become silent breakages.",
  },
  {
    n: "02",
    title: "One giant unreviewable diff",
    body: "You get a wall of changed files with no explanation of why each one moved, and no way to approve part of the plan without approving all of it.",
  },
  {
    n: "03",
    title: "Desk-bound workflows",
    body: "Every serious coding agent assumes a terminal, a local clone, and an IDE open. The moment you're away from your machine, the idea waits.",
  },
]

function Problem() {
  return (
    <section id="problem" className="border-b border-line py-20">
      <div className="mx-auto max-w-[1100px] px-6 sm:px-8">
        <div className="kicker">THE PROBLEM</div>
        <h2 className="section-title mt-3">
          Most coding agents write first and find out what broke later.
        </h2>
        <p className="section-lede mt-3.5">
          A planner that doesn't understand your repo&rsquo;s actual structure can
          suggest a clean-sounding change that quietly breaks three other files.
          Forge is built backwards from that failure mode.
        </p>

        <div className="mt-12">
          {PROBLEMS.map((p) => (
            <div key={p.n} className="grid grid-cols-[64px_1fr] gap-6 border-t border-line py-7 last:border-b">
              <div className="pt-1 font-mono text-[13px] text-ink-faint">{p.n}</div>
              <div>
                <h3 className="font-display text-[1.25rem] font-medium">{p.title}</h3>
                <p className="mt-2 max-w-[44em] text-[0.95rem] text-ink-soft">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── WORKFLOW ───────────────────────── */

function Workflow() {
  return (
    <section id="workflow" className="border-b border-line py-20">
      <div className="mx-auto max-w-[1100px] px-6 sm:px-8">
        <div className="kicker">HOW FORGE WORKS</div>
        <h2 className="section-title mt-3">
          Plan, traced. Code, reviewed. Branch, yours.
        </h2>
        <p className="section-lede mt-3.5">
          Six steps, each one inspectable. Forge never pushes to main, and never
          writes code you haven&rsquo;t approved at the subtask level.
        </p>

        <div className="mt-12 flex flex-col">
          <WfStep n="01" title="Connect your repository">
            <p className="max-w-[32em] text-[0.97rem] text-ink-soft">
              Add a GitHub repo URL and a scoped personal access token. Forge clones
              and begins indexing — files, imports, exports, and call graphs.
            </p>
            <ConnectMini />
          </WfStep>

          <WfStep n="02" title="Describe the change in plain English">
            <p className="max-w-[32em] text-[0.97rem] text-ink-soft">
              &ldquo;Add a dark mode toggle to the settings page.&rdquo; Forge&rsquo;s planner
              reads your real index to find every file that defines, imports, or
              renders the settings UI.
            </p>
            <TaskMini />
          </WfStep>

          <WfStep n="03" title="Review the affected-file map">
            <p className="max-w-[32em] text-[0.97rem] text-ink-soft">
              Before anything is written, Forge shows the exact subgraph of files
              the change will touch — pulled from the dependency table, not
              inferred on the fly.
            </p>
            <div className="panel-rule overflow-hidden">
              <div className="p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  IMPACT MAP — 4 FILES
                </div>
                <GraphFragment variant="trace" />
              </div>
            </div>
          </WfStep>

          <WfStep n="04" title="Approve subtasks individually">
            <p className="max-w-[32em] text-[0.97rem] text-ink-soft">
              Each affected file becomes one subtask with a specific instruction.
              Approve, edit, or skip each one — nothing proceeds without your
              sign-off.
            </p>
            <div className="panel-rule overflow-hidden">
              <div className="p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  SUBTASKS — APPROVAL STATUS
                </div>
                <GraphFragment variant="approval" />
              </div>
            </div>
          </WfStep>

          <WfStep n="05" title="Review the generated code">
            <p className="max-w-[32em] text-[0.97rem] text-ink-soft">
              Each approved subtask is sent to the coder model with exactly the
              context it needs — the file, its neighbors, and your instruction. You
              see a real diff and a plain-English explanation.
            </p>
            <DiffMini />
          </WfStep>

          <WfStep n="06" title="Pushed to a branch — you own the merge" last>
            <p className="max-w-[32em] text-[0.97rem] text-ink-soft">
              Approved code is committed to an auto-created branch on your repo.
              Forge never touches main. You open the PR and merge on your terms.
            </p>
            <BranchMini />
          </WfStep>
        </div>
      </div>
    </section>
  )
}

function WfStep({ n, title, children, last }) {
  return (
    <div className={`grid gap-6 border-t border-line py-8 md:grid-cols-[56px_1fr] ${last ? "border-b" : ""}`}>
      <div className="font-display text-[1.6rem] font-medium text-ink-faint">{n}</div>
      <div className="grid items-start gap-8 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h3 className="mb-2.5 font-display text-[1.4rem] font-medium">{title}</h3>
          {Array.isArray(children) ? children[0] : children}
        </div>
        <div>{Array.isArray(children) ? children[1] : null}</div>
      </div>
    </div>
  )
}

// ─── Mini visuals for workflow steps ───────────────────────────────

function ConnectMini() {
  return (
    <div className="panel-rule mt-0 p-4">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        CONNECT REPOSITORY
      </div>
      <div className="mb-2 flex items-center gap-2 rounded-sm border border-line-strong bg-paper-2 px-3 py-2.5 font-mono text-xs text-ink-soft">
        <RepoIcon /> github.com/acme/dashboard-app
      </div>
      <div className="mb-3 flex items-center gap-2 rounded-sm border border-line-strong bg-paper-2 px-3 py-2.5 font-mono text-xs text-ink-soft">
        <KeyIcon /> ghp_•••••••••••••••••••
      </div>
      <Pill tone="warning">Indexing — 312 / 480 files</Pill>
    </div>
  )
}

function TaskMini() {
  return (
    <div className="panel-rule mt-0 p-4">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">TASK</div>
      <p className="font-display text-[1.05rem] font-medium leading-[1.4]">
        &ldquo;Add a dark mode toggle to the settings page, persisted across sessions.&rdquo;
      </p>
      <div className="mt-3.5 border-t border-line pt-3.5 font-mono text-[11px] text-ink-faint">
        PLANNER → reading 480-file index…
      </div>
    </div>
  )
}

function DiffMini() {
  return (
    <div className="panel-rule mt-0 overflow-hidden p-4">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        DIFF — useTheme.js
      </div>
      <div className="overflow-x-auto font-mono text-[11.5px] leading-[1.7]">
        <div className="px-2 text-ink-faint">export function useTheme() {"{"}</div>
        <div className="rounded-sm bg-success-soft px-2 text-success">+ const [theme, setTheme] = useState(</div>
        <div className="rounded-sm bg-success-soft px-2 text-success">{"+   () => localStorage.getItem('theme') ?? 'light'"}</div>
        <div className="rounded-sm bg-success-soft px-2 text-success">+ )</div>
        <div className="rounded-sm bg-warning-soft px-2 text-[#8C5A2E] line-through opacity-70">- return &apos;light&apos;</div>
        <div className="px-2 text-ink-faint">{"}"}</div>
      </div>
    </div>
  )
}

function BranchMini() {
  return (
    <div className="panel-rule mt-0 p-4">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">BRANCH CREATED</div>
      <div className="flex items-center justify-between rounded-sm border border-line-strong bg-paper-2 px-3 py-2.5 font-mono text-xs">
        <span>forge/dark-mode-settings</span>
        <span className="text-success">4 commits</span>
      </div>
      <div className="mt-3.5">
        <Pill tone="info">Ready for PR</Pill>
      </div>
    </div>
  )
}

function RepoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 opacity-50" aria-hidden="true">
      <path d="M8 1 L14 4 L14 12 L8 15 L2 12 L2 4 Z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 opacity-50" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7 V5 a3 3 0 0 1 6 0 v2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function Pill({ tone = "neutral", children }) {
  const tones = {
    neutral: "text-ink-soft bg-paper-2 border-line-strong",
    success: "text-success bg-success-soft border-success",
    warning: "text-warning bg-warning-soft border-warning",
    info: "text-info bg-info-soft border-accent",
    error: "text-error bg-error-soft border-error",
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

/* ───────────────────────── STATS ───────────────────────── */

const STATS = [
  { num: "100%", label: "FILES TRACED BEFORE GENERATION" },
  { num: "0", label: "DIRECT PUSHES TO MAIN" },
  { num: "1:1", label: "SUBTASK-TO-FILE APPROVAL" },
]

function StatStrip() {
  return (
    <section className="grid border-b border-line sm:grid-cols-3">
      {STATS.map((s, i) => (
        <div key={s.label} className={`px-8 py-9 ${i > 0 ? "border-t sm:border-l sm:border-t-0" : ""} border-line`}>
          <div className="font-display text-[2.4rem] font-medium text-accent">{s.num}</div>
          <div className="mt-1.5 font-mono text-xs text-ink-soft">{s.label}</div>
        </div>
      ))}
    </section>
  )
}

/* ───────────────────────── CTA ───────────────────────── */

function CTA() {
  return (
    <section className="blueprint-grid-dense relative py-28 text-center">
      <div className="relative mx-auto max-w-[1100px] px-6 sm:px-8">
        <h2 className="font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.1]">
          Stop reviewing diffs <em className="font-normal italic text-accent">blind.</em>
        </h2>
        <p className="mx-auto mt-4 max-w-[32em] text-ink-soft">
          Connect a repository and watch Forge draw the map before it writes
          anything.
        </p>

        <div className="mx-auto my-9 max-w-[280px]">
          <GraphFragment variant="settled" />
        </div>

        <div className="flex flex-wrap justify-center gap-3.5">
          <Link href="/signup" className="btn-primary btn-lg">
            Get started free →
          </Link>
          <Link href="/login" className="btn btn-lg">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── FOOTER ───────────────────────── */

function Footer() {
  return (
    <footer className="py-10">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-[1.1rem] font-semibold">
          <Logo size={18} />
          Forge
        </Link>
        <div className="flex gap-6 font-mono text-xs text-ink-soft">
          <a href="#workflow" className="hover:text-ink">How it works</a>
          <Link href="/login" className="hover:text-ink">Sign in</Link>
          <Link href="/signup" className="hover:text-ink">Get started</Link>
        </div>
        <div className="font-mono text-[11px] text-ink-faint">© 2026 FORGE</div>
      </div>
    </footer>
  )
}
