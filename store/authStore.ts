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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  initialized: false,
  error: null,

  clearError: () => set({ error: null }),

  initAuth: () => {
    // Firebase otomatis ingat session user
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        set({
          user: {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
          },
          isAuthenticated: true,
          initialized: true,
        })
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
      // Simpan nama ke profil Firebase
      await updateProfile(res.user, { displayName: name })
      // Trigger update state manual
      set({ 
        user: {
          id: res.user.uid,
          name: name,
          email: res.user.email || '',
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
