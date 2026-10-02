import { create } from 'zustand'
import type { Song, LyricLine } from '@/types'

interface PlayerState {
  current: Song | null
  queue: Song[]
  isPlaying: boolean
  volume: number
  muted: boolean
  currentTime: number
  duration: number
  lyrics: LyricLine[]
  loop: boolean

  setCurrent: (song: Song) => void
  setQueue: (songs: Song[]) => void
  play: () => void
  pause: () => void
  toggle: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setLyrics: (l: LyricLine[]) => void
  toggleLoop: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  current: null,
  queue: [],
  isPlaying: false,
  volume: 0.9,
  muted: false,
  currentTime: 0,
  duration: 0,
  lyrics: [],
  loop: false,

  setCurrent: (song) =>
    set({
      current: song,
      currentTime: 0,
      duration: 0,
      lyrics: [],
      isPlaying: true,
    }),
  setQueue: (songs) => set({ queue: songs }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (v) => set({ volume: v, muted: v === 0 }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setLyrics: (l) => set({ lyrics: l }),
  toggleLoop: () => set((s) => ({ loop: !s.loop })),
}))
