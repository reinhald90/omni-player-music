import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HistoryItem, Song } from '@/types'
import { useAuthStore } from './authStore'
import { auth } from '@/lib/firebase'

interface HistoryState {
  items: HistoryItem[]
  add: (song: Song) => void
  clear: () => void
  remove: (id: string) => void
  syncFromDb: () => Promise<void>
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (song) => {
        const filtered = get().items.filter((i) => i.id !== song.id)
        const newItem: HistoryItem = { ...song, playedAt: Date.now() }
        set({ items: [newItem, ...filtered].slice(0, 100) })

        const user = useAuthStore.getState().user
        if (user) {
          auth.currentUser?.getIdToken().then(token => {
            fetch('/api/db/history', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ song }) // uid, email, name dihapus
            }).catch(err => console.error('Gagal sync history ke DB:', err))
          }).catch(console.error)
        }
      },

      clear: () => {
        set({ items: [] })
      },

      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      syncFromDb: async () => {
        const user = useAuthStore.getState().user
        if (!user) return

        try {
          const token = await auth.currentUser?.getIdToken()
          // uid dihapus dari URL
          const res = await fetch(`/api/db/history`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          const json = await res.json()

          if (json.success && json.data && json.data.length > 0) {
            set({ items: json.data })
          }
        } catch (e) {
          console.error('Gagal mengambil history dari DB:', e)
        }
      }
    }),
    { name: 'omni-history' }
  )
)
