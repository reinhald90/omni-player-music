import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SearchHistoryState {
  items: string[]
  add: (query: string) => void
  remove: (query: string) => void
  clear: () => void
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (query) => {
        const q = query.trim()
        if (!q || q.length < 2) return
        const filtered = get().items.filter((i) => i.toLowerCase() !== q.toLowerCase())
        set({ items: [q, ...filtered].slice(0, 15) })
      },
      remove: (query) => set({ items: get().items.filter((i) => i !== query) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'omni-search-history' }
  )
)
