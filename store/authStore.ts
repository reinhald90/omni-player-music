'use client'

import { create } from 'zustand'
import { 
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signInWithPopup, signOut, updateProfile
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { useFavoritesStore } from './favoritesStore'
import { usePlaylistStore } from './playlistStore'
import { useHistoryStore } from './historyStore'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  coverUrl?: string
  avatarScale?: number
  avatarX?: number
  avatarY?: number
  avatarStart?: number
  avatarEnd?: number
  coverScale?: number
  coverX?: number
  coverY?: number
  coverStart?: number
  coverEnd?: number
  joinedAt?: number
  role?: string
  isVerified?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  initialized: boolean
  error: string | null
  
  initAuth: () => void
  loginEmail: (email: string, password: string) => Promise<void>
  registerEmail: (name: string, email: string, password: string) => Promise<void>
  loginGoogle: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  refreshUserStatus: () => Promise<void>
  updateProfileData: (data: Partial<User>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  initialized: false,
  error: null,

  clearError: () => set({ error: null }),

  refreshUserStatus: async () => {
    const currentUser = get().user
    if (!currentUser) return
    try {
      await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.id, name: currentUser.name, email: currentUser.email, avatar_url: currentUser.avatar })
      })

      const res = await fetch(`/api/db/profile?uid=${currentUser.id}`)
      const json = await res.json()
      if (json.success) {
        set({ 
          user: { 
            ...currentUser, 
            name: json.name || currentUser.name,
            avatar: json.avatar_url || currentUser.avatar,
            role: json.role, 
            isVerified: json.is_verified,
            coverUrl: json.cover_url || currentUser.coverUrl,
            avatarScale: json.avatar_scale, avatarX: json.avatar_x, avatarY: json.avatar_y,
            avatarStart: json.avatar_start_time, avatarEnd: json.avatar_end_time,
            coverScale: json.cover_scale, coverX: json.cover_x, coverY: json.cover_y,
            coverStart: json.cover_start_time, coverEnd: json.cover_end_time
          } 
        })
      }
    } catch (e) { console.error(e) }
  },

  updateProfileData: async (data) => {
    const currentUser = get().user
    if (!currentUser) return

    try {
      const payload = { 
        uid: currentUser.id, name: data.name, avatar_url: data.avatar, cover_url: data.coverUrl,
        avatar_scale: data.avatarScale, avatar_x: data.avatarX, avatar_y: data.avatarY,
        avatar_start_time: data.avatarStart, avatar_end_time: data.avatarEnd,
        cover_scale: data.coverScale, cover_x: data.coverX, cover_y: data.coverY,
        cover_start_time: data.coverStart, cover_end_time: data.coverEnd
      }

      const res = await fetch('/api/db/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal update database')

      if (auth.currentUser && data.name) {
        await updateProfile(auth.currentUser, { displayName: data.name })
      }

      set({ user: { ...currentUser, ...data } })
    } catch (e) {
      console.error('Gagal update profil:', e)
      throw e
    }
  },

  initAuth: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        set({
          user: {
            id: firebaseUser.uid, name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '', avatar: firebaseUser.photoURL || undefined,
            joinedAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now(),
          },
          isAuthenticated: true, initialized: true,
        })
        get().refreshUserStatus()
      } else {
        set({ user: null, isAuthenticated: false, initialized: true })
      }
    })
  },

  loginEmail: async (email, password) => {
    set({ loading: true, error: null })
    try { await signInWithEmailAndPassword(auth, email, password) } catch (err: any) {
      set({ error: err.message.replace('Firebase: ', '') }); throw err
    } finally { set({ loading: false }) }
  },

  registerEmail: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(res.user, { displayName: name })
    } catch (err: any) {
      set({ error: err.message.replace('Firebase: ', '') }); throw err
    } finally { set({ loading: false }) }
  },

  loginGoogle: async () => {
    set({ loading: true, error: null })
    try { await signInWithPopup(auth, googleProvider) } catch (err: any) {
      set({ error: err.message.replace('Firebase: ', '') }); throw err
    } finally { set({ loading: false }) }
  },

  logout: async () => {
    await signOut(auth)
    useFavoritesStore.getState().clear()
    usePlaylistStore.getState().clear()
    useHistoryStore.getState().clear()
    set({ user: null, isAuthenticated: false })
  }
}))
