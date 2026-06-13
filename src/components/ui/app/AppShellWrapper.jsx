'use client'

/**
 * FORGE — AppShell Wrapper (Enhanced)
 * Wraps AppShell with ErrorBoundary, ToastProvider, and Keyboard shortcuts.
 */

import AppShell from './AppShell'
import ErrorBoundary from '../ErrorBoundary'
import { ToastProvider } from '../Toast'
import { useKeyboardShortcuts, ShortcutHelp } from '../../../lib/hooks/useKeyboardShortcuts'
import { useState } from 'react'

export default function AppShellWrapper({ children }) {
  const [showHelp, setShowHelp] = useState(false)

  useKeyboardShortcuts({
    onSearch: () => {
      console.log('⌘+K: Search not yet implemented')
    },
    onHelp: () => setShowHelp(true),
    onEscape: () => setShowHelp(false),
  })

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppShell>{children}</AppShell>
        <ShortcutHelp open={showHelp} onClose={() => setShowHelp(false)} />
      </ToastProvider>
    </ErrorBoundary>
  )
}
