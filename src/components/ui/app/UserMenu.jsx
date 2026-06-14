"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/useUser"

/**
 * FORGE — UserMenu
 *
 * Avatar dropdown with settings/sign-out. Avatar is a plain initials
 * circle on a solid accent fill — no gradients.
 */
export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user } = useUser()
  const ref = useRef(null)
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??"

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push("/")
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border-2 bg-elevated font-mono text-xs font-semibold text-primary transition-colors duration-fast hover:border-accent-line"
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-elevated shadow-panel"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate font-mono text-xs text-muted">{user?.email}</p>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              router.push("/app/settings")
              setOpen(false)
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-secondary transition-colors duration-fast hover:bg-surface"
          >
            Settings
          </button>
          <div className="h-px bg-border" />
          <button
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-error transition-colors duration-fast hover:bg-error-soft"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
