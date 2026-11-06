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
  id: string; name: string; email: string; avatar?: string; coverUrl?: string;
  avatarScale?: number; avatarX?: number; avatarY?: number; avatarStart?: number; avatarEnd?: number;
  coverScale?: number; coverX?: number; coverY?: number; coverStart?: number; coverEnd?: number;
  bio?: string; borderStyle?: string; layoutTheme?: string; joinedAt?: number; role?: string; roleColor?: string; isVerified?: boolean;
}

interface AuthState {
  user: User | null; isAuthenticated: boolean; loading: boolean; initialized: boolean; error: string | null;
  initAuth: () => void; loginEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (name: string, email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>; logout: () => Promise<void>; clearError: () => void;
  refreshUserStatus: () => Promise<void>; updateProfileData: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, isAuthenticated: false, loading: false, initialized: false, error: null,

  clearError: () => set({ error: null }),

  refreshUserStatus: async () => {
    const currentUser = get().user
    if (!currentUser) return
    try {
      // 1. Ambil dulu data asli dari database (jangan ditimpa POST dulu)
      const res = await fetch(`/api/db/profile?uid=${currentUser.id}&t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()

      if (json.success && json.name) {
        const dbData = json.data || json
        set({ 
          user: { 
            ...currentUser,
            name: dbData.name ?? currentUser.name,
            avatar: dbData.avatar_url ?? dbData.avatar ?? currentUser.avatar,
            role: dbData.role ?? currentUser.role,
            roleColor: dbData.role_color ?? dbData.roleColor ?? currentUser.roleColor,
            isVerified: Boolean(dbData.is_verified ?? dbData.isVerified ?? currentUser.isVerified),
            coverUrl: dbData.cover_url ?? dbData.coverUrl ?? currentUser.coverUrl,
            bio: dbData.bio ?? currentUser.bio ?? '',
            borderStyle: dbData.border_style ?? dbData.borderStyle ?? currentUser.borderStyle ?? '',
            layoutTheme: dbData.layout_theme ?? dbData.layoutTheme ?? currentUser.layoutTheme ?? 'default',
            avatarScale: Number(dbData.avatar_scale ?? dbData.avatarScale ?? 1),
            avatarX: Number(dbData.avatar_x ?? dbData.avatarX ?? 0),
            avatarY: Number(dbData.avatar_y ?? dbData.avatarY ?? 0),
            avatarStart: Number(dbData.avatar_start_time ?? dbData.avatarStart ?? 0),
            avatarEnd: Number(dbData.avatar_end_time ?? dbData.avatarEnd ?? 10),
            coverScale: Number(dbData.cover_scale ?? dbData.coverScale ?? 1),
            coverX: Number(dbData.cover_x ?? dbData.coverX ?? 0),
            coverY: Number(dbData.cover_y ?? dbData.coverY ?? 0),
            coverStart: Number(dbData.cover_start_time ?? dbData.coverStart ?? 0),
            coverEnd: Number(dbData.cover_end_time ?? dbData.coverEnd ?? 10),
          } 
        })
      } else {
        // 2. Jika user baru dan belum ada di DB, baru daftarkan via POST
        await fetch('/api/db/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            avatar_url: currentUser.avatar || ''
          })
        })
      }
    } catch (e) {
      console.error('Error refreshUserStatus:', e)
    }
  },

  updateProfileData: async (data) => {
    const currentUser = get().user
    if (!currentUser) return
    try {
      // 🔥 GABUNGKAN STATE LAMA & BARU AGAR TIDAK ADA FIELD YANG TERTIMPA UNDEFINED/NULL 🔥
      const merged: User = { ...currentUser, ...data }

      const payload = { 
        uid: merged.id,
        name: merged.name || 'User',
        email: merged.email || '',
        avatar_url: merged.avatar ?? '',
        cover_url: merged.coverUrl ?? '',
        avatar_scale: merged.avatarScale ?? 1,
        avatar_x: merged.avatarX ?? 0,
        avatar_y: merged.avatarY ?? 0,
        avatar_start_time: merged.avatarStart ?? 0,
        avatar_end_time: merged.avatarEnd ?? 10,
        cover_scale: merged.coverScale ?? 1,
        cover_x: merged.coverX ?? 0,
        cover_y: merged.coverY ?? 0,
        cover_start_time: merged.coverStart ?? 0,
        cover_end_time: merged.coverEnd ?? 10,
        bio: merged.bio ?? '',
        border_style: merged.borderStyle ?? '',
        layout_theme: merged.layoutTheme ?? 'default'
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

      set({ user: merged })
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
            joinedAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now()
          },
          isAuthenticated: true,
          initialized: true,
        })
        await get().refreshUserStatus()
      } else {
        set({ user: null, isAuthenticated: false, initialized: true })
      }
    })
  },

  loginEmail: async (email, password) => {
    set({ loading: true, error: null })
    try { await signInWithEmailAndPassword(auth, email, password) } catch (err: any) { set({ error: err.message.replace('Firebase: ', '') }); throw err } finally { set({ loading: false }) }
  },
  registerEmail: async (name, email, password) => {
    set({ loading: true, error: null })
    try { const res = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(res.user, { displayName: name }) } catch (err: any) { set({ error: err.message.replace('Firebase: ', '') }); throw err } finally { set({ loading: false }) }
  },
  loginGoogle: async () => {
    set({ loading: true, error: null })
    try { await signInWithPopup(auth, googleProvider) } catch (err: any) { set({ error: err.message.replace('Firebase: ', '') }); throw err } finally { set({ loading: false }) }
  },
  logout: async () => {
    await signOut(auth); useFavoritesStore.getState().clear(); usePlaylistStore.getState().clear(); useHistoryStore.getState().clear(); set({ user: null, isAuthenticated: false })
  }
}))
