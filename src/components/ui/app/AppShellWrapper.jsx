'use client'

import AppShell from './AppShell'
import { ToastProvider } from '@/components/ui/Toast'

export default function AppShellWrapper({ children }) {
  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  )
}
