"use client"

import { createContext, useContext } from "react"

const SelectedRepoContext = createContext(null)

export function SelectedRepoProvider({ value, children }) {
  return (
    <SelectedRepoContext.Provider value={value}>
      {children}
    </SelectedRepoContext.Provider>
  )
}

/**
 * FORGE — useSelectedRepo
 *
 * Access the Topbar-selected repo (and full repos list) from any
 * page under /app/*. Must be used within AppShell.
 */
export function useSelectedRepo() {
  const ctx = useContext(SelectedRepoContext)
  if (!ctx) {
    throw new Error("useSelectedRepo must be used within AppShell")
  }
  return ctx
}
