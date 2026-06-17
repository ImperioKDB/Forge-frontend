"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force"
import { motion, useReducedMotion } from "framer-motion"
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
  const [selectedFileId, setSelectedFileId] = useState(null)

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
    setSelectedFileId(null)
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
          <GraphLoadingProgress fileCount={selectedRepo.file_count ?? 0} />
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
    <div className="mx-auto flex max-w-5xl flex-col gap-7 px-4 py-10 sm:px-6">
      <PageHeader repoName={selectedRepo.name} />
      <Card variant="default" padding="lg">
        <div className="mb-4 flex flex-wrap gap-6">
          <Stat label="Files" value={graph.files.length} />
          <Stat label="Symbols" value={graph.symbols.length} />
          <Stat label="Edges" value={graph.edges.length} />
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="lg:flex-1 lg:min-w-0">
            <GraphCanvas
              graph={graph}
              selectedFileId={selectedFileId}
              onSelectFile={setSelectedFileId}
            />
          </div>
          <div className="lg:w-[280px] lg:shrink-0">
            <SidePanel
              repoId={selectedRepo.id}
              graph={graph}
              selectedFileId={selectedFileId}
              onClose={() => setSelectedFileId(null)}
            />
          </div>
        </div>
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
function GraphCanvas({ graph, selectedFileId, onSelectFile }) {
  const layout = useMemo(() => computeLayout(graph), [graph])
  const reduceMotion = useReducedMotion()

  if (!layout) {
    return (
      <p className="font-body text-sm text-secondary">
        Not enough data to render a graph for this repo yet.
      </p>
    )
  }

  const { nodes, links, viewBox, nodeRadius, strokeWidth } = layout

  function isDirectLink(l) {
    if (!selectedFileId) return false
    return l.source.id === selectedFileId || l.target.id === selectedFileId
  }

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
        {/* ─── Edges: static, except direct edges of the selected node ─── */}
        <g>
          {links.map((l, i) => {
            const direct = isDirectLink(l)
            return (
              <motion.line
                key={`edge-${i}`}
                x1={l.source.x}
                y1={l.source.y}
                x2={l.target.x}
                y2={l.target.y}
                stroke={direct ? "var(--accent)" : "var(--text-secondary)"}
                initial={false}
                animate={{
                  opacity: direct ? 0.9 : 0.35,
                  strokeWidth: direct ? strokeWidth * 1.8 : strokeWidth,
                }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              />
            )
          })}
        </g>

        {/* ─── Nodes: static, except the selected node ─── */}
        <g>
          {nodes.map((n) => {
            const isSelected = n.id === selectedFileId
            return (
              <g
                key={n.id}
                role="button"
                tabIndex={0}
                aria-label={`File ${n.path}${isSelected ? ", selected" : ""}`}
                aria-pressed={isSelected}
                onClick={() => onSelectFile(isSelected ? null : n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelectFile(isSelected ? null : n.id)
                  }
                }}
                style={{ cursor: "pointer", outlineOffset: 3 }}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {isSelected ? (
                  <motion.circle
                    cx={n.x}
                    cy={n.y}
                    r={nodeRadius * 1.4}
                    fill="var(--selected-soft)"
                    stroke="var(--selected)"
                    strokeWidth={strokeWidth * 1.8}
                    initial={reduceMotion ? { scale: 1 } : { scale: 0.85 }}
                    animate={{ scale: [0.85, 1.08, 1] }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.35,
                      ease: [0.16, 1, 0.3, 1],
                      times: [0, 0.6, 1],
                    }}
                    style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                  />
                ) : (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={nodeRadius}
                    fill="var(--bg-base)"
                    stroke="var(--text-secondary)"
                    strokeWidth={strokeWidth}
                  />
                )}
              </g>
            )
          })}
        </g>

        {/* ─── Inline filename labels — only when the graph is small ─── */}
        {nodes.length <= 40 && (
          <g>
            {nodes.map((n) => {
              const filename = (n.path || "").split("/").pop()
              const isSelected = n.id === selectedFileId
              return (
                <text
                  key={`label-${n.id}`}
                  x={n.x}
                  y={n.y + nodeRadius + 11}
                  textAnchor="middle"
                  className="font-mono pointer-events-none"
                  fontSize={9}
                  fill={isSelected ? "var(--selected)" : "var(--text-muted)"}
                >
                  {filename.length > 20 ? filename.slice(0, 18) + "…" : filename}
                </text>
              )
            })}
          </g>
        )}
      </svg>
    </div>
  )
}

/**
 * SidePanel
 *
 * Shows details for the selected file: path, language, and its
 * symbols (from the bulk graph response - no extra fetch for the
 * list). Clicking a symbol lazily fetches full detail (signature,
 * metadata) via GET /repos/:id/graph/symbol/:symbolId.
 */
function SidePanel({ repoId, graph, selectedFileId, onClose }) {
  const [symbolDetail, setSymbolDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  useEffect(() => {
    setSymbolDetail(null)
    setDetailError(null)
  }, [selectedFileId])

  if (!selectedFileId) {
    return (
      <div className="rounded-md border border-border bg-elevated p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Selection</p>
        <p className="mt-2 font-body text-xs text-secondary">
          Click a node to see its file and symbols.
        </p>
      </div>
    )
  }

  const file = graph.files.find((f) => f.id === selectedFileId)
  const symbols = (graph.symbols || []).filter((s) => s.file_id === selectedFileId)

  async function loadSymbolDetail(symbolId) {
    setDetailLoading(true)
    setDetailError(null)
    try {
      const data = await apiFetch(`/repos/${repoId}/graph/symbol/${symbolId}`)
      setSymbolDetail(data?.symbol || null)
    } catch (err) {
      setDetailError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const [neighborhood, setNeighborhood] = useState(null)
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false)

  useEffect(() => {
    setNeighborhood(null)
    if (!selectedFileId) return
    const f = graph.files.find((gf) => gf.id === selectedFileId)
    if (!f) return
    let cancelled = false
    setNeighborhoodLoading(true)
    apiFetch(`/repos/${repoId}/graph/file?path=${encodeURIComponent(f.path)}`)
      .then((data) => { if (!cancelled) setNeighborhood(data) })
      .catch(() => { if (!cancelled) setNeighborhood(null) })
      .finally(() => { if (!cancelled) setNeighborhoodLoading(false) })
    return () => { cancelled = true }
  }, [selectedFileId, repoId, graph.files])

  return (
    <div className="flex flex-col gap-3 rounded-md border border-selected-line bg-selected-soft p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-selected">Selected file</p>
          <p className="mt-1 break-all font-mono text-xs text-primary">{file?.path ?? "Unknown file"}</p>
          {file?.language && (
            <p className="mt-0.5 font-mono text-[10px] text-muted">{file.language}</p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Clear selection"
          className="shrink-0 font-mono text-xs text-muted hover:text-secondary transition-colors duration-fast"
        >
          ✕
        </button>
      </div>

      {neighborhoodLoading && (
        <div className="h-12 animate-pulse rounded-md bg-elevated" />
      )}

      {neighborhood && !neighborhoodLoading && (
        <div className="flex flex-col gap-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Imports ({neighborhood.imports.length})
            </p>
            {neighborhood.imports.length === 0 ? (
              <p className="mt-1 font-body text-xs text-secondary">No outgoing imports.</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {neighborhood.imports.map((imp, i) => (
                  <li key={i} className="truncate font-mono text-[11px] text-secondary">{imp.path}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Importers ({neighborhood.importers.length})
            </p>
            {neighborhood.importers.length === 0 ? (
              <p className="mt-1 font-body text-xs text-secondary">Nothing imports this file.</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {neighborhood.importers.map((imp, i) => (
                  <li key={i} className="truncate font-mono text-[11px] text-secondary">{imp.path}</li>
                ))}
              </ul>
            )}
          </div>
          {neighborhood.repo_url && file?.path && (
            <a
              href={`${neighborhood.repo_url}/blob/main/${file.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 self-start font-mono text-[11px] text-accent hover:underline"
            >
              View in GitHub →
            </a>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Symbols ({symbols.length})
        </p>
        {symbols.length === 0 ? (
          <p className="font-body text-xs text-secondary">No indexed symbols for this file.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {symbols.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => loadSymbolDetail(s.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-sm border border-border-2 bg-elevated px-2.5 py-1.5 text-left transition-colors duration-fast hover:border-accent-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="truncate font-mono text-xs text-secondary">{s.name}</span>
                  <span className="shrink-0 font-mono text-[10px] uppercase text-muted">
                    {s.kind}{s.exported ? " · export" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {detailLoading && (
        <div className="h-16 animate-pulse rounded-md bg-elevated" />
      )}

      {detailError && (
        <p className="font-body text-xs text-error">Couldn't load symbol detail: {detailError}</p>
      )}

      {symbolDetail && !detailLoading && (
        <div className="flex flex-col gap-1.5 rounded-md border border-border bg-elevated p-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{symbolDetail.name}</p>
          {symbolDetail.signature && (
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-secondary">
              {symbolDetail.signature}
            </pre>
          )}
          {symbolDetail.start_line != null && (
            <p className="font-mono text-[10px] text-muted">Line {symbolDetail.start_line}</p>
          )}
        </div>
      )}
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
    .force("link", forceLink(links).id((d) => d.id).distance(24).strength(0.6))
    .force("charge", forceManyBody().strength(-12).distanceMax(120))
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(7))
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

  // Defensive fallback: if the simulation produced a degenerate result
  // (e.g. all nodes still at 0,0 - can happen with disconnected graphs
  // and certain force configurations), arrange nodes on a circle so
  // something always renders instead of a blank panel.
  const spread = Math.max(maxX - minX, maxY - minY)
  if (!Number.isFinite(spread) || spread < 1) {
    const radius = Math.max(40, nodes.length * 6)
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2
      n.x = Math.cos(angle) * radius
      n.y = Math.sin(angle) * radius
    })
    minX = -radius
    maxX = radius
    minY = -radius
    maxY = radius
  }

  const PADDING = 20
  const width = Math.max(maxX - minX, 1) + PADDING * 2
  const height = Math.max(maxY - minY, 1) + PADDING * 2
  const viewBox = `${minX - PADDING} ${minY - PADDING} ${width} ${height}`

  // Scale node radius / stroke width relative to the viewBox extent so
  // nodes stay visible regardless of how spread out the layout is.
  // ~600px SVG height mapped against `height` viewBox units gives the
  // on-screen pixel scale; clamp so very small or very large graphs
  // still render sensibly.
  const pxPerUnit = 600 / height
  const nodeRadius = Math.min(10, Math.max(4, 5 / pxPerUnit))
  const strokeWidth = Math.min(3, Math.max(1, 1.5 / pxPerUnit))

  return { nodes, links, viewBox, nodeRadius, strokeWidth }
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

/**
 * GraphLoadingProgress
 *
 * Replaces the blank/skeleton-only loading state with a determinate-
 * feeling progress bar. We don't get real progress events from the
 * single GET /repos/:id/graph fetch, so the bar fills toward ~92%
 * over a fixed CSS transition and holds there until the fetch
 * resolves and the page swaps to real content - avoids both a blank
 * flash and a misleading "100% then nothing happens" moment.
 *
 * Pure CSS transition (width + transition-duration), no animation
 * loop - cheap and respects prefers-reduced-motion automatically
 * (reduced motion media query disables the transition globally via
 * globals.css if already configured; otherwise the bar just appears
 * near-full immediately, which is an acceptable fallback).
 */
function GraphLoadingProgress({ fileCount }) {
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    // Defer to next frame so the transition actually animates from 0.
    const raf = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-xs text-muted">
        Indexing — {fileCount.toLocaleString()} / {fileCount.toLocaleString()} files
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-accent transition-[width] ease-out"
          style={{
            width: filled ? "92%" : "4%",
            transitionDuration: "2400ms",
          }}
        />
      </div>
      <p className="font-mono text-[11px] text-muted">Building dependency graph…</p>
    </div>
  )
}
