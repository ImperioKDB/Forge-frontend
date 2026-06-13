'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ForgeWordmark from '@/components/ui/ForgeWordmark'
import StatusDot from '@/components/ui/StatusDot'
import { useUser } from '@/lib/hooks/useUser'
import { useRepos } from '@/lib/hooks/useRepos'
import { useSessions } from '@/lib/hooks/useSessions'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupSessions(sessions) {
  const now  = Date.now()
  const DAY  = 86400000
  const WEEK = 7 * DAY
  const groups = { Today: [], Yesterday: [], 'This week': [], Older: [] }
  sessions.forEach(s => {
    const age = now - new Date(s.created_at).getTime()
    if      (age < DAY)       groups.Today.push(s)
    else if (age < 2 * DAY)   groups.Yesterday.push(s)
    else if (age < WEEK)      groups['This week'].push(s)
    else                      groups.Older.push(s)
  })
  return Object.entries(groups).filter(([, v]) => v.length > 0)
}

function SidebarSkeleton() {
  return (
    <div className="px-3 py-4 flex flex-col gap-2" aria-label="Loading sessions" aria-busy="true">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-md"
          style={{
            height: '52px',
            background: 'linear-gradient(90deg,var(--bg-elevated) 25%,rgba(42,42,48,0.8) 50%,var(--bg-elevated) 75%)',
            backgroundSize: '400px 100%',
            animation: `forge-skeleton 1.4s ease-in-out ${i * 0.07}s infinite`,
            opacity: 1 - i * 0.12,
          }}
        />
      ))}
      <p className="text-xs font-mono text-center mt-1" style={{ color: 'var(--text-muted)', opacity: 0.45 }}>
        Loading sessions...
      </p>
    </div>
  )
}

function Topbar({ open, onToggle, selectedRepo, repos, onRepoChange }) {
  const router   = useRouter()
  const { user } = useUser()
  const [repoOpen,     setRepoOpen]     = useState(false)
  const [userOpen,     setUserOpen]     = useState(false)
  const [showMenuHint, setShowMenuHint] = useState(false)
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'

  useEffect(() => {
    const seen = sessionStorage.getItem('forge-menu-hint-seen')
    if (!seen) { setShowMenuHint(true); sessionStorage.setItem('forge-menu-hint-seen', '1') }
  }, [])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/')
  }

  useEffect(() => {
    function handler(e) {
      if (!e.target.closest('[data-dropdown]')) { setRepoOpen(false); setUserOpen(false) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 gap-4"
      style={{ height: '58px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)' }}
    >
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <button
            onClick={() => { onToggle(); setShowMenuHint(false) }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all duration-fast"
            style={{
              color:       open ? 'var(--accent)' : 'var(--text-secondary)',
              background:  open ? 'var(--accent-dim)' : 'transparent',
              border:      `1px solid ${open ? 'rgba(232,103,26,0.25)' : 'transparent'}`,
              minHeight:   '44px',
              minWidth:    '44px',
              touchAction: 'manipulation',
            }}
            onMouseEnter={e => { if (!open) { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
            onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}}
            aria-label={open ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={open}
            aria-controls="app-sidebar"
          >
            <span className="flex flex-col gap-[4px] w-[14px]" aria-hidden="true">
              <span className="block h-[1.5px] rounded-full transition-all duration-normal"
                style={{ background: 'currentColor', transformOrigin: 'left', transform: open ? 'rotate(45deg) translateY(1px)' : 'none', width: open ? '16px' : '14px' }} />
              <span className="block h-[1.5px] rounded-full transition-all duration-normal"
                style={{ background: 'currentColor', opacity: open ? 0 : 1, transform: open ? 'scaleX(0)' : 'scaleX(1)' }} />
              <span className="block h-[1.5px] rounded-full transition-all duration-normal"
                style={{ background: 'currentColor', transformOrigin: 'left', transform: open ? 'rotate(-45deg) translateY(-1px)' : 'none', width: open ? '16px' : '14px' }} />
            </span>
            <span className="font-mono text-xs hidden sm:inline select-none">
              {open ? 'Close' : 'Menu'}
            </span>
          </button>

          {showMenuHint && !open && (
            <div
              className="absolute top-full left-0 mt-2 px-3 py-2 rounded-lg text-xs font-mono pointer-events-none whitespace-nowrap z-[200]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent)', color: 'var(--text-secondary)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', animation: 'forge-fade-in 0.2s ease' }}
            >
              ← Tap to open sidebar
              <span className="absolute -top-1.5 left-4 w-3 h-3 rotate-45"
                style={{ background: 'var(--bg-elevated)', borderLeft: '1px solid var(--accent)', borderTop: '1px solid var(--accent)' }} />
            </div>
          )}
        </div>
        <ForgeWordmark size="xs" />
      </div>

      <div className="relative flex-1 max-w-xs" data-dropdown>
        <button
          onClick={() => { setRepoOpen(v => !v); setUserOpen(false) }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md w-full transition-all duration-fast"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)', minHeight: '36px' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
          aria-haspopup="listbox"
          aria-expanded={repoOpen}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: selectedRepo ? 'var(--success)' : 'var(--text-muted)' }} />
          <span className="font-mono text-xs truncate flex-1 text-left">{selectedRepo?.name || 'Select repository'}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
        {repoOpen && repos?.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 rounded-lg overflow-hidden z-50"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            role="listbox">
            {repos.map(repo => (
              <button key={repo.id} role="option" aria-selected={selectedRepo?.id === repo.id}
                onClick={() => { onRepoChange(repo); setRepoOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors duration-fast"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                  background: repo.index_status === 'indexed' ? 'var(--success)' : repo.index_status === 'indexing' ? 'var(--warning)' : 'var(--text-muted)'
                }} />
                <span className="font-mono text-xs truncate flex-1">{repo.name}</span>
                {repo.index_status === 'indexing' && (
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--warning)', animation: 'forge-pulse 1.4s ease-in-out infinite' }}>indexing...</span>
                )}
                {repo.index_status === 'indexed' && (
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--success)' }}>{repo.file_count || 0} files</span>
                )}
              </button>
            ))}
            <div style={{ height: '1px', background: 'var(--bg-border)' }} />
            <button onClick={() => { router.push('/app'); setRepoOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors duration-fast"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="font-mono text-xs">Add repository</span>
            </button>
          </div>
        )}
      </div>

      <div className="relative shrink-0" data-dropdown>
        <button onClick={() => { setUserOpen(v => !v); setRepoOpen(false) }}
          className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-warm))', color: '#fff' }}
          aria-label="User menu" aria-haspopup="menu" aria-expanded={userOpen}>
          {initials}
        </button>
        {userOpen && (
          <div className="absolute top-full mt-2 right-0 rounded-lg overflow-hidden z-50 w-44"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            role="menu">
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--bg-border)' }}>
              <p className="font-mono text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
            <button role="menuitem" onClick={() => { router.push('/app/settings'); setUserOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors duration-fast"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Settings</button>
            <div style={{ height: '1px', background: 'var(--bg-border)' }} />
            <button role="menuitem" onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors duration-fast"
              style={{ color: 'var(--error)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Sign out</button>
          </div>
        )}
      </div>
    </header>
  )
}

function Sidebar({ open, onClose, selectedRepoId, isMobile }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { sessions, loading } = useSessions(selectedRepoId)
  const grouped  = groupSessions(sessions)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    if (dx < -60 && dy < 60 && isMobile) onClose()
    touchStartX.current = null
  }

  const sidebarStyle = isMobile
    ? { position: 'fixed', top: '58px', left: 0, bottom: 0, width: '280px', zIndex: 60,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)',
        background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-border)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto', willChange: 'transform' }
    : { position: 'fixed', top: '58px', left: 0, bottom: 0, width: open ? '236px' : '52px', zIndex: 40,
        transition: 'width 250ms cubic-bezier(0.16,1,0.3,1)',
        background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }

  return (
    <aside id="app-sidebar" style={sidebarStyle} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-label="Sidebar navigation">
      <div className="p-2 shrink-0" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <button onClick={() => { router.push('/app'); if (isMobile) onClose() }}
          className="w-full flex items-center gap-2.5 rounded-md transition-all duration-fast min-h-[44px] px-2"
          style={{ background: pathname === '/app' ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${pathname === '/app' ? 'rgba(232,103,26,0.2)' : 'transparent'}`, color: pathname === '/app' ? 'var(--accent)' : 'var(--text-muted)' }}
          onMouseEnter={e => { if (pathname !== '/app') { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}}
          onMouseLeave={e => { if (pathname !== '/app') { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}}
          title={(!open && !isMobile) ? 'New Task' : undefined}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
            <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {(open || isMobile) && <span className="font-body text-sm font-medium truncate">New Task</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2" role="navigation" aria-label="Recent sessions">
        {(open || isMobile) ? (
          loading ? <SidebarSkeleton /> :
          sessions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>No sessions yet</p>
              <p className="font-mono text-xs mt-1" style={{ color: 'rgba(80,80,90,0.6)' }}>Start your first task above</p>
            </div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-3 pt-3 pb-1 font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{group}</p>
                {items.map(session => {
                  const isActive = pathname === `/app/session/${session.id}`
                  return (
                    <button key={session.id}
                      onClick={() => { router.push(`/app/session/${session.id}`); if (isMobile) onClose() }}
                      className="text-left px-2 py-2.5 rounded-md transition-all duration-fast"
                      style={{ width: 'calc(100% - 8px)', margin: '0 4px', display: 'block', background: isActive ? 'var(--bg-elevated)' : 'transparent', borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`, minHeight: '44px' }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                      <p className="font-body text-xs font-medium truncate leading-snug mb-1.5" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{session.task}</p>
                      <div className="flex items-center justify-between">
                        <StatusDot status={session.status} showLabel={false} size="xs" />
                        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{timeAgo(session.created_at)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )
        ) : (
          sessions.slice(0, 10).map(session => (
            <button key={session.id} onClick={() => router.push(`/app/session/${session.id}`)}
              className="w-full flex items-center justify-center py-2" title={session.task} style={{ minHeight: '36px' }}>
              <StatusDot status={session.status} showLabel={false} size="sm" />
            </button>
          ))
        )}
      </div>

      {(open || isMobile) && (
        <div className="p-2 shrink-0" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <button onClick={() => { router.push('/app/settings'); if (isMobile) onClose() }}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition-all duration-fast"
            style={{ color: pathname === '/app/settings' ? 'var(--accent)' : 'var(--text-muted)', background: pathname === '/app/settings' ? 'var(--accent-dim)' : 'transparent', minHeight: '44px' }}
            onMouseEnter={e => { if (pathname !== '/app/settings') { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}}
            onMouseLeave={e => { if (pathname !== '/app/settings') { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.6 2.6l.7.7M10.7 10.7l.7.7M11.4 2.6l-.7.7M3.3 10.7l-.7.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="font-body text-xs">Settings</span>
          </button>
        </div>
      )}
    </aside>
  )
}

function MobileScrim({ visible, onClick }) {
  return (
    <div onClick={onClick} aria-hidden="true"
      style={{ position: 'fixed', inset: 0, top: '58px', zIndex: 55, background: 'rgba(0,0,0,0.55)', opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transition: 'opacity 300ms ease' }} />
  )
}

function useEdgeSwipeOpen(onOpen, isOpen) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    let sx = null, sy = null
    function onTouchStart(e) { if (isOpen) return; if (e.touches[0].clientX < 24) { sx = e.touches[0].clientX; sy = e.touches[0].clientY } }
    function onTouchEnd(e) {
      if (sx === null) return
      const dx = e.changedTouches[0].clientX - sx
      const dy = Math.abs(e.changedTouches[0].clientY - sy)
      if (dx > 60 && dy < 60) onOpen()
      sx = null
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => { document.removeEventListener('touchstart', onTouchStart); document.removeEventListener('touchend', onTouchEnd) }
  }, [onOpen, isOpen])
}

// THE FIX: no min-h-screen on wrapper or main — content grows naturally, body scrolls.
// Mobile sidebar is a CSS-transform overlay — main content never shifts.
export default function AppShell({ children }) {
  const [open,         setOpen]         = useState(false)
  const [isMobile,     setIsMobile]     = useState(false)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const { repos }                       = useRepos()

  useEffect(() => {
    function check() { const m = window.innerWidth < 768; setIsMobile(m); setOpen(!m) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!selectedRepo && repos?.length > 0)
      setSelectedRepo(repos.find(r => r.index_status === 'indexed') || repos[0])
  }, [repos, selectedRepo])

  const openSidebar   = useCallback(() => setOpen(true),     [])
  const closeSidebar  = useCallback(() => setOpen(false),    [])
  const toggleSidebar = useCallback(() => setOpen(v => !v), [])
  useEdgeSwipeOpen(openSidebar, open)

  const desktopMargin = !isMobile ? (open ? 236 : 52) : 0

  return (
    <div style={{ background: 'var(--bg-base)' }}>
      <Topbar open={open} onToggle={toggleSidebar} selectedRepo={selectedRepo} repos={repos} onRepoChange={setSelectedRepo} />
      {isMobile && <MobileScrim visible={open} onClick={closeSidebar} />}
      <Sidebar open={open} onClose={closeSidebar} selectedRepoId={selectedRepo?.id} isMobile={isMobile} />
      <main className="transition-all duration-normal" style={{ marginTop: '58px', marginLeft: `${desktopMargin}px` }}>
        {typeof children === 'function' ? children({ selectedRepo, setSelectedRepo }) : children}
      </main>
    </div>
  )
}
