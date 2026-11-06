'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song } from '@/types'
import { useAuthStore } from './authStore'
import { auth } from '@/lib/firebase'

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
          auth.currentUser?.getIdToken().then(token => {
            fetch('/api/db/playlists', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ action: 'create', payload: { name, description } }) // uid dihapus
            })
          }).catch(console.error)
        }
        return id
      },

      remove: (id) => {
        set({ playlists: get().playlists.filter((p) => p.id !== id) })
        const user = useAuthStore.getState().user
        if (user) {
          auth.currentUser?.getIdToken().then(token => {
            fetch('/api/db/playlists', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ action: 'delete', payload: { id } }) // uid dihapus
            })
          }).catch(console.error)
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
          auth.currentUser?.getIdToken().then(token => {
            fetch('/api/db/playlists', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ action: 'addSong', payload: { playlistId, song } }) // uid dihapus
            })
          }).catch(console.error)
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
          auth.currentUser?.getIdToken().then(token => {
            fetch('/api/db/playlists', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ action: 'removeSong', payload: { playlistId, songId } }) // uid dihapus
            })
          }).catch(console.error)
        }
      },

      clear: () => set({ playlists: [] }),
      
      get: (id) => get().playlists.find((p) => p.id === id),
      
      syncFromDb: async () => {
        const user = useAuthStore.getState().user
        if (!user) return
        
        set({ playlists: [] })
        
        try {
          const token = await auth.currentUser?.getIdToken()
          // uid dihapus dari URL
          const res = await fetch(`/api/db/playlists`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
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
