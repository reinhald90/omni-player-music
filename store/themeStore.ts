'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'pink' | 'purple' | 'ocean' | 'sunset' | 'emerald' | 'mono'

export interface ThemePreset {
  id: ThemeId
  name: string
  brand: string
  brandLight: string
  brandDark: string
}

export const THEMES: Record<ThemeId, ThemePreset> = {
  pink: {
    id: 'pink',
    name: 'Pink',
    brand: '#ff2d55',
    brandLight: '#ff6b9d',
    brandDark: '#c084fc',
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    brand: '#a855f7',
    brandLight: '#c084fc',
    brandDark: '#e879f9',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    brand: '#06b6d4',
    brandLight: '#22d3ee',
    brandDark: '#60a5fa',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    brand: '#f97316',
    brandLight: '#fb923c',
    brandDark: '#f43f5e',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    brand: '#10b981',
    brandLight: '#34d399',
    brandDark: '#22d3ee',
  },
  mono: {
    id: 'mono',
    name: 'Mono',
    brand: '#e5e5e5',
    brandLight: '#f5f5f5',
    brandDark: '#a3a3a3',
  },
}

interface ThemeState {
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'pink',
      setTheme: (id) => {
        set({ themeId: id })
        applyTheme(id)
      },
    }),
    {
      name: 'omni-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.themeId) applyTheme(state.themeId)
      },
    }
  )
)

export function applyTheme(id: ThemeId) {
  if (typeof document === 'undefined') return
  const t = THEMES[id]
  if (!t) return
  const root = document.documentElement
  root.style.setProperty('--brand', t.brand)
  root.style.setProperty('--brand-light', t.brandLight)
  root.style.setProperty('--brand-dark', t.brandDark)
  // Update theme-color untuk browser UI
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', t.brand)
}
