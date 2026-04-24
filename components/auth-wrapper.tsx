"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const authenticated = useSyncExternalStore(
    () => () => {},
    () => pathname === '/auth' || isAuthenticated(),
    () => true,
  )

  useEffect(() => {
    if (!authenticated) {
      router.push('/auth')
    }
  }, [authenticated, router])

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}
