'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { usePlaylistStore } from '@/store/playlistStore'
import { useHistoryStore } from '@/store/historyStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  
  // Ambil fungsi sync dari masing-masing store
  const syncFav = useFavoritesStore((s) => s.syncFromDb)
  const syncPl = usePlaylistStore((s) => s.syncFromDb)
  const syncHist = useHistoryStore((s) => s.syncFromDb)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Setiap kali status login berubah jadi true, tarik data dari DB
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Auth] User logged in, syncing data from DB...')
      syncFav()
      syncPl()
      syncHist()
    }
  }, [isAuthenticated, syncFav, syncPl, syncHist])

  return <>{children}</>
}
