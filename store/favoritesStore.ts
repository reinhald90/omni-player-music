import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song } from '@/types'
import { useAuthStore } from './authStore'

interface FavoritesState {
  items: Song[]
  add: (song: Song) => void
  remove: (id: string) => void
  toggle: (song: Song) => void
  isFavorite: (id: string) => boolean
  clear: () => void
  syncFromDb: () => Promise<void>
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      
      add: (song) => {
        const existing = get().items.find((s) => s.id === song.id)
        if (existing) return
        set({ items: [song, ...get().items] })
        
        // Sync ke DB
        const user = useAuthStore.getState().user
        if (user) {
          fetch('/api/db/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.id, email: user.email, name: user.name, song })
          })
        }
      },

      remove: (id) => {
        set({ items: get().items.filter((s) => s.id !== id) })
        
        // Sync ke DB
        const user = useAuthStore.getState().user
        if (user) {
          fetch(`/api/db/favorites?uid=${user.id}&songId=${id}`, { method: 'DELETE' })
        }
      },

      toggle: (song) => {
        const exists = get().items.some((s) => s.id === song.id)
        if (exists) get().remove(song.id)
        else get().add(song)
      },

      isFavorite: (id) => get().items.some((s) => s.id === id),
      clear: () => set({ items: [] }),
      
      // Fungsi untuk ambil data dari Neon pas login
      syncFromDb: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        try {
          const res = await fetch(`/api/db/favorites?uid=${user.id}`)
          const json = await res.json()
          if (json.success) set({ items: json.data })
        } catch (e) { console.error(e) }
      }
    }),
    { name: 'omni-favorites' }
  )
)
