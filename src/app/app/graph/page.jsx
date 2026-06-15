"use client"

import { useState, useEffect, useCallback } from "react"
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

  // ─── Success (placeholder - d3-force SVG lands in Step 4) ─────────
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-7 px-4 py-10 sm:px-6">
      <PageHeader repoName={selectedRepo.name} />
      <Card variant="default" padding="lg">
        <div className="flex flex-wrap gap-6">
          <Stat label="Files" value={graph.files.length} />
          <Stat label="Symbols" value={graph.symbols.length} />
          <Stat label="Edges" value={graph.edges.length} />
        </div>
        <p className="mt-4 font-body text-xs text-muted">
          Graph layout coming next — this panel will become the interactive
          dependency graph.
        </p>
      </Card>
    </div>
  )
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
