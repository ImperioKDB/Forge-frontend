'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile]       = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')

    const sync = (e) => {
      const mobile = e.matches
      setIsMobile(mobile)
      // Desktop defaults open; mobile defaults closed (drawer)
      setSidebarOpen(!mobile)
    }

    sync(mq)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <div className="min-h-screen bg-base flex">

      {/* ── Mobile overlay backdrop ───────────────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar — drawer on mobile, rail on desktop ───────────────────── */}
      <div
        id="sidebar-nav"
        aria-label="Main navigation"
        className={
          isMobile
            ? `fixed inset-y-0 left-0 z-40 transition-transform duration-200 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'relative'
        }
      >
        <Sidebar
          open={isMobile ? true : sidebarOpen}
          onToggle={() => setSidebarOpen(prev => !prev)}
        />
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main
        className={`
          flex-1 min-h-screen transition-all duration-150
          ${!isMobile ? (sidebarOpen ? 'ml-64' : 'ml-12') : 'ml-0'}
        `}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-base/90 backdrop-blur-sm border-b border-border">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-9 h-9 min-h-[44px] rounded border border-border text-muted hover:text-secondary hover:border-accent/50 transition-all duration-150 touch-manipulation"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-nav"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 4h12M2 8h12M2 12h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Forge wordmark — mobile only */}
            <span
              className="font-mono font-semibold text-sm tracking-[0.15em] select-none"
              aria-label="Forge"
            >
              <span className="text-secondary">F</span>
              <span className="text-accent">O</span>
              <span className="text-secondary">R</span>
              <span className="text-secondary">G</span>
              <span className="text-accent">E</span>
            </span>
          </div>
        )}

        {children}
      </main>
    </div>
  )
}
