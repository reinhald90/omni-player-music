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
            isVerified: json.is_verified 
          } 
        })
      }
    } catch (e) { console.error(e) }
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
        // Tarik status Role & Verified dari Neon DB
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
