"use client"

import { useState, useEffect, useCallback } from "react"
import { useRepos } from "@/lib/hooks/useRepos"
import Topbar from "@/components/ui/app/Topbar"
import Sidebar from "@/components/ui/app/Sidebar"
import { SelectedRepoProvider } from "@/lib/context/SelectedRepoContext"

function MobileScrim({ visible, onClick }) {
  return (
    <div
      onClick={onClick}
      aria-hidden="true"
      className="fixed inset-x-0 bottom-0 top-[58px] z-[55] bg-black/55 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    />
  )
}

function useEdgeSwipeOpen(onOpen, isOpen) {
  useEffect(() => {
    if (typeof window === "undefined") return
    let sx = null
    let sy = null
    function onTouchStart(e) {
      if (isOpen) return
      if (e.touches[0].clientX < 24) {
        sx = e.touches[0].clientX
        sy = e.touches[0].clientY
      }
    }
    function onTouchEnd(e) {
      if (sx === null) return
      const dx = e.changedTouches[0].clientX - sx
      const dy = Math.abs(e.changedTouches[0].clientY - sy)
      if (dx > 60 && dy < 60) onOpen()
      sx = null
    }
    document.addEventListener("touchstart", onTouchStart, { passive: true })
    document.addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener("touchstart", onTouchStart)
      document.removeEventListener("touchend", onTouchEnd)
    }
  }, [onOpen, isOpen])
}

/**
 * FORGE — AppShell
 *
 * The "workshop" surface: dark, structured, restrained. Wraps every
 * /app/* route with Topbar + Sidebar. Sets data-theme="workshop" so
 * the dark token set in globals.css applies to this whole subtree.
 *
 * selectedRepo / setSelectedRepo / repos are exposed to any descendant
 * page via SelectedRepoProvider — call useSelectedRepo() from
 * @/lib/context/SelectedRepoContext to access them.
 */
export default function AppShell({ children }) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const { repos } = useRepos()

  useEffect(() => {
    function check() {
      const m = window.innerWidth < 768
      setIsMobile(m)
      setOpen(!m)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (!selectedRepo && repos?.length > 0) {
      setSelectedRepo(repos.find((r) => r.index_status === "indexed") || repos[0])
    }
  }, [repos, selectedRepo])

  const openSidebar = useCallback(() => setOpen(true), [])
  const closeSidebar = useCallback(() => setOpen(false), [])
  const toggleSidebar = useCallback(() => setOpen((v) => !v), [])
  useEdgeSwipeOpen(openSidebar, open)

  const desktopMargin = !isMobile ? (open ? 236 : 52) : 0

  return (
    <SelectedRepoProvider value={{ selectedRepo, setSelectedRepo, repos }}>
      <div data-theme="workshop" className="bg-base text-primary">
        <Topbar open={open} onToggle={toggleSidebar} selectedRepo={selectedRepo} repos={repos} onRepoChange={setSelectedRepo} />
        {isMobile && <MobileScrim visible={open} onClick={closeSidebar} />}
        <Sidebar open={open} onClose={closeSidebar} selectedRepoId={selectedRepo?.id} isMobile={isMobile} />
        <main className="transition-[margin] duration-normal" style={{ marginTop: "58px", marginLeft: `${desktopMargin}px` }}>
          {children}
        </main>
      </div>
    </SelectedRepoProvider>
  )
}
