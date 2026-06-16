"use client"

import { useRef, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSessions } from "@/lib/hooks/useSessions"
import { apiFetch } from "@/lib/supabase/api"
import StatusDot from "@/components/ui/StatusDot"

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (days  > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins  > 0) return `${mins}m ago`
  return "just now"
}

function groupSessions(sessions) {
  const now = Date.now()
  const groups = { Today: [], Yesterday: [], "This week": [], Earlier: [] }
  for (const s of sessions) {
    const age  = now - new Date(s.created_at).getTime()
    const days = age / 86400000
    if (days < 1)      groups.Today.push(s)
    else if (days < 2) groups.Yesterday.push(s)
    else if (days < 7) groups["This week"].push(s)
    else               groups.Earlier.push(s)
  }
  return Object.entries(groups).filter(([, items]) => items.length > 0)
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2 px-3 py-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-elevated" />
      ))}
    </div>
  )
}

/**
 * SessionItem
 *
 * Long-press (500ms) to reveal a delete button inline.
 * Tap elsewhere to dismiss. Swipe is reserved for the drawer close gesture.
 */
function SessionItem({ session, isActive, onNavigate, onDelete }) {
  const pressTimer = useRef(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  function startPress() {
    pressTimer.current = setTimeout(() => setShowDelete(true), 500)
  }
  function cancelPress() {
    clearTimeout(pressTimer.current)
  }

  async function handleDelete(e) {
    e.stopPropagation()
    setDeleting(true)
    await onDelete(session.id)
    setDeleting(false)
    setShowDelete(false)
  }

  return (
    <div className="relative mx-1">
      <button
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onClick={() => {
          if (showDelete) { setShowDelete(false); return }
          onNavigate(session.id)
        }}
        className={`block w-full rounded-md border-l-2 px-2 py-2.5 text-left transition-all duration-fast ${
          isActive
            ? "border-accent bg-elevated"
            : "border-transparent hover:bg-elevated"
        }`}
        style={{ minHeight: "44px" }}
      >
        <p className={`mb-1.5 truncate font-body text-sm font-medium leading-snug ${
          isActive ? "text-primary" : "text-secondary"
        }`}>
          {session.task}
        </p>
        <div className="flex items-center justify-between">
          <StatusDot status={session.status} showLabel={false} size="xs" />
          <span className="font-mono text-[10px] text-muted opacity-70">
            {timeAgo(session.created_at)}
          </span>
        </div>
      </button>

      {/* Delete overlay — slides in on long-press */}
      {showDelete && (
        <div
          className="absolute inset-0 flex items-center justify-between rounded-md border border-error border-opacity-30 bg-elevated px-3"
          style={{ animation: "forge-slide-in 120ms ease-out" }}
        >
          <span className="font-mono text-[11px] text-muted">Delete session?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDelete(false)}
              className="font-mono text-xs text-muted hover:text-primary"
            >
              Keep
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-md bg-error bg-opacity-10 px-2.5 py-1 font-mono text-xs text-error hover:bg-opacity-20"
            >
              {deleting ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-error border-t-transparent" />
              ) : (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <path d="M1.5 3h8M4 3V2h3v1M2.5 3l.5 6h5l.5-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              Delete
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes forge-slide-in { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }`}</style>
    </div>
  )
}

/**
 * FORGE — Sidebar
 *
 * Desktop: collapsible width (52px collapsed / 236px open).
 * Mobile: slide-over drawer with scrim, swipe-left to close.
 *
 * Session items support long-press (500ms) to reveal a delete action.
 */
export default function Sidebar({ open, onClose, selectedRepoId, isMobile }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { sessions, loading, refetch } = useSessions(selectedRepoId)
  const grouped  = groupSessions(sessions)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    if (dx < -60 && dy < 60 && isMobile) onClose()
    touchStartX.current = null
  }

  const handleDelete = useCallback(async (sessionId) => {
    try {
      await apiFetch(`/agent/session/${sessionId}`, { method: "DELETE" })
      refetch()
    } catch (err) {
      console.error("Delete session failed:", err.message)
    }
  }, [refetch])

  const handleNavigate = useCallback((sessionId) => {
    router.push(`/app/session/${sessionId}`)
    if (isMobile) onClose()
  }, [router, isMobile, onClose])

  const widthClass    = isMobile ? "w-[280px]" : open ? "w-[236px]" : "w-[52px]"
  const positionClass = isMobile
    ? `fixed top-[58px] bottom-0 left-0 z-[60] transition-transform duration-300 ease-out-expo ${
        open ? "translate-x-0" : "-translate-x-full"
      }`
    : "fixed top-[58px] bottom-0 left-0 z-40 transition-[width] duration-normal ease-out-expo overflow-hidden"

  const showLabels = open || isMobile

  return (
    <aside
      id="app-sidebar"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="Sidebar navigation"
      className={`flex flex-col border-r border-border bg-surface ${widthClass} ${positionClass}`}
      style={{ willChange: isMobile ? "transform" : undefined, overflowY: isMobile ? "auto" : undefined }}
    >
      {/* New task */}
      <div className="shrink-0 border-b border-border p-2">
        <button
          onClick={() => { router.push("/app"); if (isMobile) onClose() }}
          title={!showLabels ? "New Task" : undefined}
          className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-md border px-2 transition-all duration-fast ${
            pathname === "/app"
              ? "border-accent-line bg-accent-soft text-accent"
              : "border-transparent text-muted hover:bg-elevated hover:text-primary"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
            <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {showLabels && <span className="truncate font-body text-sm font-medium">New Task</span>}
        </button>
      </div>

      {/* Sessions */}
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Recent sessions">
        {showLabels ? (
          loading ? (
            <SidebarSkeleton />
          ) : sessions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="font-body text-xs text-muted">No sessions yet</p>
              <p className="mt-1 font-mono text-xs text-muted opacity-60">Start your first task above</p>
            </div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {group}
                </p>
                {items.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={pathname === `/app/session/${session.id}`}
                    onNavigate={handleNavigate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ))
          )
        ) : (
          sessions.slice(0, 10).map((session) => (
            <button
              key={session.id}
              onClick={() => router.push(`/app/session/${session.id}`)}
              title={session.task}
              className="flex w-full items-center justify-center py-2"
              style={{ minHeight: "36px" }}
            >
              <StatusDot status={session.status} showLabel={false} size="sm" />
            </button>
          ))
        )}
      </nav>

      {/* Graph + Settings */}
      {showLabels && (
        <div className="shrink-0 border-t border-border p-2 flex flex-col gap-1">
          <button
            onClick={() => { router.push("/app/graph"); if (isMobile) onClose() }}
            className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-md px-2 py-2 transition-all duration-fast ${
              pathname === "/app/graph"
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-elevated hover:text-secondary"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 10.5L7 4L11 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="7" cy="4" r="1.6" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="3" cy="10.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="11" cy="10.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span className="font-body text-xs">Graph</span>
          </button>

          <button
            onClick={() => { router.push("/app/settings"); if (isMobile) onClose() }}
            className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-md px-2 py-2 transition-all duration-fast ${
              pathname === "/app/settings"
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-elevated hover:text-secondary"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1.1 1.1M10.3 10.3l1.1 1.1M2.6 11.4l1.1-1.1M10.3 3.7l1.1-1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="font-body text-xs">Settings</span>
          </button>
        </div>
      )}
    </aside>
  )
}
