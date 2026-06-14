'use client'

import AppShell from './AppShell'

/**
 * FORGE — AppShellWrapper
 *
 * ToastProvider now lives in the root layout, so this wrapper is a
 * thin pass-through kept for import-path compatibility with
 * src/app/app/layout.jsx.
 */
export default function AppShellWrapper({ children }) {
  return <AppShell>{children}</AppShell>
}
