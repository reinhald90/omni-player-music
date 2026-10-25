'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const initAuth = useAuthStore((s) => s.initAuth)

  useEffect(() => {
    // Inisialisasi listener Firebase onAuthStateChanged
    // Ini akan otomatis memantau status login user di seluruh aplikasi
    initAuth()
  }, [initAuth])

  return <>{children}</>
}
