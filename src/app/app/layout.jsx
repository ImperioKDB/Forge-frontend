'use client'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShellWrapper from '@/components/ui/app/AppShellWrapper'

export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <AppShellWrapper>{children}</AppShellWrapper>
}
