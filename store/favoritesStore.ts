import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song } from '@/types'
import { useAuthStore } from './authStore'
import { auth } from '@/lib/firebase'

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
        
        const user = useAuthStore.getState().user
        if (user) {
          auth.currentUser?.getIdToken().then(token => {
            fetch('/api/db/favorites', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ song }) // uid, email, name dihapus
            })
          }).catch(console.error)
        }
      },

      remove: (id) => {
        set({ items: get().items.filter((s) => s.id !== id) })
        
        const user = useAuthStore.getState().user
        if (user) {
          auth.currentUser?.getIdToken().then(token => {
            // uid dihapus dari URL
            fetch(`/api/db/favorites?songId=${id}`, { 
              method: 'DELETE',
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
          }).catch(console.error)
        }
      },

      toggle: (song) => {
        const exists = get().items.some((s) => s.id === song.id)
        if (exists) get().remove(song.id)
        else get().add(song)
      },

      isFavorite: (id) => get().items.some((s) => s.id === id),
      
      clear: () => set({ items: [] }),
      
      syncFromDb: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        
        set({ items: [] })
        
        try {
          const token = await auth.currentUser?.getIdToken()
          // uid dihapus dari URL
          const res = await fetch(`/api/db/favorites`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          const json = await res.json()
          if (json.success) {
            set({ items: json.data })
          }
        } catch (e) { console.error(e) }
      }
    }),
    { name: 'omni-favorites' }
  )
)
