import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HistoryItem, Song } from '@/types'
import { useAuthStore } from './authStore'

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
        
        // Sync ke DB
        const user = useAuthStore.getState().user
        if (user) {
          fetch('/api/db/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.id, email: user.email, name: user.name, song })
          })
        }
      },
      clear: () => set({ items: [] }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      
      syncFromDb: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        try {
          const res = await fetch(`/api/db/history?uid=${user.id}`)
          const json = await res.json()
          if (json.success) set({ items: json.data })
        } catch (e) { console.error(e) }
      }
    }),
    { name: 'omni-history' }
  )
)
