"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * FORGE — RepoSelector
 *
 * Dropdown for switching the active repository. Status is shown via
 * a status pill matching the index_status (indexed / indexing / none) —
 * uses the same status-color tokens as everywhere else (success/warning/muted).
 */
export default function RepoSelector({ selectedRepo, repos, onRepoChange }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const statusColor = (status) =>
    status === "indexed" ? "bg-success" : status === "indexing" ? "bg-warning animate-pulse" : "bg-muted"

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-[36px] items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-secondary transition-colors duration-fast hover:border-accent-line"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selectedRepo ? statusColor(selectedRepo.index_status) : "bg-muted"}`} />
        <span className="flex-1 truncate text-left font-mono text-xs">
          {selectedRepo?.name || "Select repository"}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="shrink-0">
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      {open && repos?.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-elevated shadow-panel"
        >
          {repos.map((repo) => (
            <button
              key={repo.id}
              role="option"
              aria-selected={selectedRepo?.id === repo.id}
              onClick={() => {
                onRepoChange(repo)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-secondary transition-colors duration-fast hover:bg-surface"
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColor(repo.index_status)}`} />
              <span className="flex-1 truncate font-mono text-xs">{repo.name}</span>
              {repo.index_status === "indexing" && (
                <span className="shrink-0 font-mono text-xs text-warning">indexing…</span>
              )}
              {repo.index_status === "indexed" && (
                <span className="shrink-0 font-mono text-xs text-success">{repo.file_count || 0} files</span>
              )}
            </button>
          ))}
          <div className="h-px bg-border" />
          <button
            onClick={() => {
              router.push("/app")
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-accent transition-colors duration-fast hover:bg-surface"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="font-mono text-xs">Add repository</span>
          </button>
        </div>
      )}
    </div>
  )
}
