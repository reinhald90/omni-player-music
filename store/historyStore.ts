import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HistoryItem, Song } from '@/types'

interface HistoryState {
  items: HistoryItem[]
  add: (song: Song) => void
  clear: () => void
  remove: (id: string) => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (song) => {
        const filtered = get().items.filter((i) => i.id !== song.id)
        const newItem: HistoryItem = { ...song, playedAt: Date.now() }
        set({ items: [newItem, ...filtered].slice(0, 100) })
      },
      clear: () => set({ items: [] }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    }),
    { name: 'omni-history' }
  )
)
