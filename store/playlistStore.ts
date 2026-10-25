'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song } from '@/types'
import { useAuthStore } from './authStore'

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
  syncFromDb: () => Promise<void>
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
        const newPl: Playlist = { id, name, description: description || '', songs: [], createdAt: now, updatedAt: now }
        set({ playlists: [newPl, ...get().playlists] })
        
        const user = useAuthStore.getState().user
        if (user) {
          fetch('/api/db/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.id, email: user.email, name: user.name, action: 'create', payload: { name, description } })
          })
        }
        return id
      },

      remove: (id) => {
        set({ playlists: get().playlists.filter((p) => p.id !== id) })
        const user = useAuthStore.getState().user
        if (user) {
          fetch('/api/db/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.id, email: user.email, name: user.name, action: 'delete', payload: { id } })
          })
        }
      },

      rename: (id, name, description) => {
        set({ playlists: get().playlists.map((p) => p.id === id ? { ...p, name, description: description !== undefined ? description : p.description, updatedAt: Date.now() } : p) })
      },

      addSong: (playlistId, song) => {
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== playlistId) return p
            if (p.songs.some((s) => s.id === song.id)) return p
            return { ...p, songs: [...p.songs, song], updatedAt: Date.now() }
          }),
        })
        const user = useAuthStore.getState().user
        if (user) {
          fetch('/api/db/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.id, email: user.email, name: user.name, action: 'addSong', payload: { playlistId, song } })
          })
        }
      },

      removeSong: (playlistId, songId) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId ? { ...p, songs: p.songs.filter((s) => s.id !== songId), updatedAt: Date.now() } : p
          ),
        })
        const user = useAuthStore.getState().user
        if (user) {
          fetch('/api/db/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.id, email: user.email, name: user.name, action: 'removeSong', payload: { playlistId, songId } })
          })
        }
      },

      clear: () => set({ playlists: [] }), // <-- Untuk logout
      
      get: (id) => get().playlists.find((p) => p.id === id),
      
      syncFromDb: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        
        set({ playlists: [] }) // Kosongkan dulu
        
        try {
          const res = await fetch(`/api/db/playlists?uid=${user.id}`)
          const json = await res.json()
          if (json.success) {
            set({ playlists: json.data })
          }
        } catch (e) { console.error(e) }
      }
    }),
    { name: 'omni-playlists' }
  )
)
