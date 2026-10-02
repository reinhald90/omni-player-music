import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song } from '@/types'

interface FavoritesState {
  items: Song[]
  add: (song: Song) => void
  remove: (id: string) => void
  toggle: (song: Song) => void
  isFavorite: (id: string) => boolean
  clear: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (song) => {
        const existing = get().items.find((s) => s.id === song.id)
        if (existing) return
        set({ items: [song, ...get().items] })
      },
      remove: (id) => set({ items: get().items.filter((s) => s.id !== id) }),
      toggle: (song) => {
        const exists = get().items.some((s) => s.id === song.id)
        if (exists) {
          set({ items: get().items.filter((s) => s.id !== song.id) })
        } else {
          set({ items: [song, ...get().items] })
        }
      },
      isFavorite: (id) => get().items.some((s) => s.id === id),
      clear: () => set({ items: [] }),
    }),
    { name: 'omni-favorites' }
  )
)
