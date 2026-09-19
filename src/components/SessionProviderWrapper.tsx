'use client'
import { SessionProvider } from 'next-auth/react'
import { useLoginTracker } from '@/hooks/useLoginTracker'

function LoginTrackerWrapper({ children }: { children: React.ReactNode }) {
  useLoginTracker()
  return <>{children}</>
}

export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LoginTrackerWrapper>{children}</LoginTrackerWrapper>
    </SessionProvider>
  )
}
