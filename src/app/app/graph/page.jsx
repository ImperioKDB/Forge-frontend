"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force"
import { apiFetch } from "@/lib/supabase/api"
import { useSelectedRepo } from "@/lib/context/SelectedRepoContext"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

const MAX_GRAPH_FILES = 500

/**
 * FORGE — Dependency Graph Explorer
 *
 * Phase 6. Browse the indexed repo structure independently of any
 * session. Step 3: page shell, repo gating, and data fetch. Step 4
 * adds the d3-force SVG layout; Step 5 adds node selection and the
 * side panel.
 */
export default function GraphPage() {
  const { selectedRepo } = useSelectedRepo()

  const [graph, setGraph] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchGraph = useCallback(async () => {
    if (!selectedRepo) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch(`/repos/${selectedRepo.id}/graph`)
      setGraph(data)
    } catch (err) {
      setError(err.message)
      setGraph(null)
    } finally {
      setLoading(false)
    }
  }, [selectedRepo])

  useEffect(() => {
    setGraph(null)
    setError(null)
    if (
      selectedRepo &&
      selectedRepo.index_status === "indexed" &&
      (selectedRepo.file_count ?? 0) <= MAX_GRAPH_FILES
    ) {
      fetchGraph()
    }
  }, [selectedRepo, fetchGraph])

  // ─── No repo selected ────────────────────────────────────────────
  if (!selectedRepo) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 py-10 sm:px-6">
        <PageHeader />
        <Card variant="default" padding="lg">
          <p className="font-body text-sm text-secondary">
            Connect or select a repo to explore its dependency graph.
          </p>
        </Card>
      </div>
    )
  }

  // ─── Repo not indexed yet ────────────────────────────────────────
  if (selectedRepo.index_status !== "indexed") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 py-10 sm:px-6">
        <PageHeader repoName={selectedRepo.name} />
        <Card variant="default" padding="lg">
          <p className="font-body text-sm text-secondary">
            {selectedRepo.name} is still indexing. The dependency graph will be
            available once indexing completes.
          </p>
        </Card>
      </div>
    )
  }

  // ─── Repo too large for graph view ──────────────────────────────
  if ((selectedRepo.file_count ?? 0) > MAX_GRAPH_FILES) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 py-10 sm:px-6">
        <PageHeader repoName={selectedRepo.name} />
        <Card variant="default" padding="lg">
          <p className="font-body text-sm text-secondary">
            Graph view is unavailable for repos this large ({selectedRepo.file_count.toLocaleString()} files).
            The limit is {MAX_GRAPH_FILES} files to keep the graph readable and fast.
          </p>
        </Card>
      </div>
    )
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 py-10 sm:px-6">
        <PageHeader repoName={selectedRepo.name} />
        <Card variant="default" padding="lg">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-muted">
              Indexing — {selectedRepo.file_count ?? 0} / {selectedRepo.file_count ?? 0} files
            </span>
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-md bg-elevated" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 py-10 sm:px-6">
        <PageHeader repoName={selectedRepo.name} />
        <Card variant="danger" padding="lg">
          <div className="flex flex-col gap-3">
            <p className="font-body text-sm text-error">Couldn't load the dependency graph: {error}</p>
            <Button variant="ghost" size="sm" onClick={fetchGraph} className="self-start">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ─── Empty (no files indexed) ──────────────────────────────────────
  if (!graph || graph.files.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 py-10 sm:px-6">
        <PageHeader repoName={selectedRepo.name} />
        <Card variant="default" padding="lg">
          <p className="font-body text-sm text-secondary">
            No indexed files found for this repo yet.
          </p>
        </Card>
      </div>
    )
  }

  // ─── Success: rendered dependency graph ───────────────────────────
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-7 px-4 py-10 sm:px-6">
      <PageHeader repoName={selectedRepo.name} />
      <Card variant="default" padding="lg">
        <div className="mb-4 flex flex-wrap gap-6">
          <Stat label="Files" value={graph.files.length} />
          <Stat label="Symbols" value={graph.symbols.length} />
          <Stat label="Edges" value={graph.edges.length} />
        </div>
        <GraphCanvas graph={graph} />
      </Card>
    </div>
  )
}

/**
 * GraphCanvas
 *
 * Lays out file-level nodes with d3-force, run synchronously to
 * convergence (no animation loop - this is a static structural view).
 * Edges are aggregated from symbol-level edges up to file pairs.
 */
function GraphCanvas({ graph }) {
  const layout = useMemo(() => computeLayout(graph), [graph])

  if (!layout) {
    return (
      <p className="font-body text-sm text-secondary">
        Not enough data to render a graph for this repo yet.
      </p>
    )
  }

  const { nodes, links, viewBox } = layout

  return (
    <div className="w-full overflow-hidden rounded-md border border-border bg-base">
      <svg
        viewBox={viewBox}
        width="100%"
        height="600"
        className="block"
        role="img"
        aria-label={`Dependency graph: ${nodes.length} files, ${links.length} import relationships`}
      >
        <g>
          {links.map((l, i) => (
            <line
              key={`edge-${i}`}
              x1={l.source.x}
              y1={l.source.y}
              x2={l.target.x}
              y2={l.target.y}
              stroke="var(--bg-border-2)"
              strokeWidth={1}
              opacity={0.5}
            />
          ))}
        </g>
        <g>
          {nodes.map((n) => (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={5}
                fill="var(--bg-elevated)"
                stroke="var(--bg-border-2)"
                strokeWidth={1.5}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

/**
 * computeLayout
 *
 * 1. Build file-level nodes from graph.files.
 * 2. Map symbol_id -> file_id from graph.symbols.
 * 3. Aggregate graph.edges (symbol-level) into deduplicated file-pair
 *    links, dropping self-loops.
 * 4. Run a d3-force simulation synchronously for a fixed number of
 *    ticks to reach a stable layout.
 * 5. Compute a viewBox from the resulting node bounds with padding.
 */
function computeLayout(graph) {
  if (!graph || !graph.files || graph.files.length === 0) return null

  const nodes = graph.files.map((f) => ({
    id: f.id,
    path: f.path,
    language: f.language,
    x: 0,
    y: 0,
  }))

  const symbolToFile = new Map()
  for (const s of graph.symbols || []) {
    symbolToFile.set(s.id, s.file_id)
  }

  const linkSet = new Set()
  const links = []
  for (const e of graph.edges || []) {
    const sourceFile = symbolToFile.get(e.from_symbol_id) ?? e.source_file_id
    const targetFile = symbolToFile.get(e.to_symbol_id)
    if (!sourceFile || !targetFile || sourceFile === targetFile) continue

    const key = sourceFile < targetFile ? `${sourceFile}:${targetFile}` : `${targetFile}:${sourceFile}`
    if (linkSet.has(key)) continue
    linkSet.add(key)
    links.push({ source: sourceFile, target: targetFile })
  }

  if (nodes.length === 0) return null

  const simulation = forceSimulation(nodes)
    .force("link", forceLink(links).id((d) => d.id).distance(40).strength(0.4))
    .force("charge", forceManyBody().strength(-30))
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(8))
    .stop()

  const TICKS = 300
  for (let i = 0; i < TICKS; i++) simulation.tick()

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of nodes) {
    if (n.x < minX) minX = n.x
    if (n.x > maxX) maxX = n.x
    if (n.y < minY) minY = n.y
    if (n.y > maxY) maxY = n.y
  }

  const PADDING = 20
  const width = Math.max(maxX - minX, 1) + PADDING * 2
  const height = Math.max(maxY - minY, 1) + PADDING * 2
  const viewBox = `${minX - PADDING} ${minY - PADDING} ${width} ${height}`

  return { nodes, links, viewBox }
}

function PageHeader({ repoName }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">DEPENDENCY GRAPH</div>
      <h1 className="font-display text-[1.9rem] font-medium tracking-tight text-primary">
        {repoName ? `${repoName} — structure` : "Repo structure"}
      </h1>
      <p className="max-w-[36em] text-sm text-secondary">
        Explore the indexed file and symbol graph for this repo, independent of any task session.
      </p>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{label}</span>
      <span className="font-display text-2xl font-medium text-primary">{value.toLocaleString()}</span>
    </div>
  )
}
