"use client"

import Logo from "@/components/ui/Logo"
import RepoSelector from "@/components/ui/app/RepoSelector"
import UserMenu from "@/components/ui/app/UserMenu"

/**
 * FORGE — Topbar
 *
 * Fixed header. Menu toggle (sidebar) + logo on the left, repo
 * selector in the middle, user menu on the right.
 */
export default function Topbar({ open, onToggle, selectedRepo, repos, onRepoChange }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-[58px] items-center justify-between gap-4 border-b border-border bg-elevated px-4">
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onToggle}
          className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-md border px-2 py-1.5 transition-all duration-fast ${
            open
              ? "border-accent-line bg-accent-soft text-accent"
              : "border-transparent text-secondary hover:border-border hover:bg-surface hover:text-primary"
          }`}
          style={{ touchAction: "manipulation" }}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          aria-expanded={open}
          aria-controls="app-sidebar"
        >
          <span className="flex w-[14px] flex-col gap-1" aria-hidden="true">
            <span
              className="block h-[1.5px] origin-left rounded-full bg-current transition-all duration-normal"
              style={{ transform: open ? "rotate(45deg) translateY(1px)" : "none", width: open ? "16px" : "14px" }}
            />
            <span
              className="block h-[1.5px] rounded-full bg-current transition-all duration-normal"
              style={{ opacity: open ? 0 : 1, transform: open ? "scaleX(0)" : "scaleX(1)" }}
            />
            <span
              className="block h-[1.5px] origin-left rounded-full bg-current transition-all duration-normal"
              style={{ transform: open ? "rotate(-45deg) translateY(-1px)" : "none", width: open ? "16px" : "14px" }}
            />
          </span>
          <span className="hidden select-none font-mono text-xs sm:inline">{open ? "Close" : "Menu"}</span>
        </button>

        <Logo size="sm" />
      </div>

      <div className="flex-1">
        <RepoSelector selectedRepo={selectedRepo} repos={repos} onRepoChange={onRepoChange} />
      </div>

      <UserMenu />
    </header>
  )
}
