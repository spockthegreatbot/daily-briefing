'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const RefreshContext = createContext<{ refreshedAt: Date }>({ refreshedAt: new Date() })

export function useRefresh() {
  return useContext(RefreshContext)
}

export function RefreshProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
      setRefreshedAt(new Date())
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <RefreshContext.Provider value={{ refreshedAt }}>
      {children}
    </RefreshContext.Provider>
  )
}
