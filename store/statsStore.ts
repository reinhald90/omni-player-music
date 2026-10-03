'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StatsState {
  totalPlayed: number
  firstPlay: number
  lastPlay: number
  artistCount: Record<string, number>
  trackPlay: (artist: string) => void
  reset: () => void
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      totalPlayed: 0,
      firstPlay: 0,
      lastPlay: 0,
      artistCount: {},
      trackPlay: (artist) => {
        const now = Date.now()
        const current = get()
        const counts = { ...current.artistCount }
        const key = artist?.trim() || 'Unknown'
        counts[key] = (counts[key] || 0) + 1
        set({
          totalPlayed: current.totalPlayed + 1,
          firstPlay: current.firstPlay || now,
          lastPlay: now,
          artistCount: counts,
        })
      },
      reset: () =>
        set({ totalPlayed: 0, firstPlay: 0, lastPlay: 0, artistCount: {} }),
    }),
    { name: 'omni-stats' }
  )
)
