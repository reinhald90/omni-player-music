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
  lyricsDuration: number   // Baru di tambah kan Guys
  loop: boolean
  fullMode: boolean
  sleepEnd: number | null
  sleepMin: number

  setCurrent: (song: Song) => void
  setQueue: (songs: Song[]) => void
  addToQueue: (song: Song) => void
  playNext: (song: Song) => void
  removeFromQueue: (idx: number) => void
  clearQueue: () => void
  next: () => void
  prev: () => void
  play: () => void
  pause: () => void
  toggle: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setLyrics: (l: LyricLine[]) => void
  setLyricsDuration: (d: number) => void   // ← TAMBAH INI
  toggleLoop: () => void
  openFull: () => void
  closeFull: () => void
  startSleep: (min: number) => void
  cancelSleep: () => void
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
  lyricsDuration: 0,   // ← TAMBAH INI
  loop: false,
  fullMode: false,
  sleepEnd: null,
  sleepMin: 0,

  setCurrent: (song) =>
    set({
      current: song,
      currentTime: 0,
      duration: 0,
      lyrics: [],
      lyricsDuration: 0,   // reset
      isPlaying: true,
    }),
  setQueue: (songs) => set({ queue: songs }),
  addToQueue: (song) => {
    const q = get().queue
    if (q.some((s) => s.id === song.id)) return
    set({ queue: [...q, song] })
  },
  playNext: (song) => {
    const q = get().queue.filter((s) => s.id !== song.id)
    set({ queue: [song, ...q] })
  },
  removeFromQueue: (idx) => set({ queue: get().queue.filter((_, i) => i !== idx) }),
  clearQueue: () => set({ queue: [] }),
  next: () => {
    const { queue, current } = get()
    if (!queue.length) return
    const idx = current ? queue.findIndex((s) => s.id === current.id) : -1
    const nextSong = queue[idx + 1] || queue[0]
    if (nextSong) get().setCurrent(nextSong)
  },
  prev: () => {
    const { queue, current } = get()
    if (!queue.length) return
    const idx = current ? queue.findIndex((s) => s.id === current.id) : 0
    const prevSong = queue[idx - 1] || queue[queue.length - 1]
    if (prevSong) get().setCurrent(prevSong)
  },
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setVolume: (v) => set({ volume: v, muted: v === 0 }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setLyrics: (l) => set({ lyrics: l }),
  setLyricsDuration: (d) => set({ lyricsDuration: d }),   // ← TAMBAH INI
  toggleLoop: () => set((s) => ({ loop: !s.loop })),
  openFull: () => set({ fullMode: true }),
  closeFull: () => set({ fullMode: false }),
  startSleep: (min) => {
    const end = Date.now() + min * 60 * 1000
    set({ sleepEnd: end, sleepMin: min })
  },
  cancelSleep: () => set({ sleepEnd: null, sleepMin: 0 }),
}))
