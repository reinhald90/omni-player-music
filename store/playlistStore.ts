'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song } from '@/types'

export interface Playlist {
  id: string
  name: string
  description?: string
  songs: Song[]
  createdAt: number
  updatedAt: number
}

interface PlaylistState {
  playlists: Playlist[]
  create: (name: string, description?: string) => string
  remove: (id: string) => void
  rename: (id: string, name: string, description?: string) => void
  addSong: (playlistId: string, song: Song) => void
  removeSong: (playlistId: string, songId: string) => void
  clear: () => void
  get: (id: string) => Playlist | undefined
}

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      create: (name, description) => {
        const id = genId()
        const now = Date.now()
        const newPl: Playlist = {
          id,
          name: name.trim() || 'Playlist Baru',
          description: description?.trim() || '',
          songs: [],
          createdAt: now,
          updatedAt: now,
        }
        set({ playlists: [newPl, ...get().playlists] })
        return id
      },
      remove: (id) => set({ playlists: get().playlists.filter((p) => p.id !== id) }),
      rename: (id, name, description) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: name.trim() || p.name,
                  description: description !== undefined ? description.trim() : p.description,
                  updatedAt: Date.now(),
                }
              : p
          ),
        })
      },
      addSong: (playlistId, song) => {
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== playlistId) return p
            if (p.songs.some((s) => s.id === song.id)) return p
            return { ...p, songs: [...p.songs, song], updatedAt: Date.now() }
          }),
        })
      },
      removeSong: (playlistId, songId) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songs: p.songs.filter((s) => s.id !== songId), updatedAt: Date.now() }
              : p
          ),
        })
      },
      clear: () => set({ playlists: [] }),
      get: (id) => get().playlists.find((p) => p.id === id),
    }),
    { name: 'omni-playlists' }
  )
)
