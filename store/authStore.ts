'use client'

import { create } from 'zustand'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  updateProfile
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  coverUrl?: string
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
  updateProfileData: (data: { name?: string, avatar?: string, coverUrl?: string }) => Promise<void>
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
      const res = await fetch(`/api/db/profile?uid=${currentUser.id}`)
      const json = await res.json()
      if (json.success) {
        set({ 
          user: { 
            ...currentUser, 
            role: json.role, 
            isVerified: json.is_verified,
            coverUrl: json.cover_url || currentUser.coverUrl
          } 
        })
      }
    } catch (e) { console.error(e) }
  },

  updateProfileData: async (data) => {
    const currentUser = get().user
    if (!currentUser) return

    try {
      // 1. Update ke Neon DB
      await fetch('/api/db/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: currentUser.id, 
          name: data.name, 
          avatar_url: data.avatar,
          cover_url: data.coverUrl
        })
      })

      // 2. Update ke Firebase Auth (Hanya Nama & Avatar)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: data.name || auth.currentUser.displayName,
          photoURL: data.avatar || auth.currentUser.photoURL
        })
      }

      // 3. Update state lokal Zustand
      set({
        user: {
          ...currentUser,
          name: data.name || currentUser.name,
          avatar: data.avatar || currentUser.avatar,
          coverUrl: data.coverUrl || currentUser.coverUrl
        }
      })
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
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
            joinedAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now(),
          },
          isAuthenticated: true,
          initialized: true,
        })
        get().refreshUserStatus()
      } else {
        set({ user: null, isAuthenticated: false, initialized: true })
      }
    })
  },

  loginEmail: async (email, password) => {
    set({ loading: true, error: null })
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      set({ error: err.message.replace('Firebase: ', '') })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  registerEmail: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(res.user, { displayName: name })
      set({ 
        user: {
          id: res.user.uid,
          name: name,
          email: res.user.email || '',
          joinedAt: Date.now(),
        }
      })
    } catch (err: any) {
      set({ error: err.message.replace('Firebase: ', '') })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  loginGoogle: async () => {
    set({ loading: true, error: null })
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err: any) {
      set({ error: err.message.replace('Firebase: ', '') })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    await signOut(auth)
  }
}))
