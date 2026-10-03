'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const EQ_BANDS = [
  { freq: 60, label: '60Hz' },
  { freq: 230, label: '230Hz' },
  { freq: 910, label: '910Hz' },
  { freq: 3600, label: '3.6kHz' },
  { freq: 14000, label: '14kHz' },
] as const

export type PresetId =
  | 'flat'
  | 'bass'
  | 'treble'
  | 'vocal'
  | 'rock'
  | 'pop'
  | 'electronic'
  | 'custom'

export interface EqPreset {
  id: PresetId
  name: string
  gains: [number, number, number, number, number]
  bassBoost: number
  preamp: number
}

export const PRESETS: Record<PresetId, EqPreset> = {
  flat: { id: 'flat', name: 'Flat', gains: [0, 0, 0, 0, 0], bassBoost: 0, preamp: 0 },
  bass: { id: 'bass', name: 'Bass Boost', gains: [8, 5, 0, -2, -4], bassBoost: 6, preamp: 0 },
  treble: { id: 'treble', name: 'Treble', gains: [-4, -2, 0, 5, 7], bassBoost: 0, preamp: 0 },
  vocal: { id: 'vocal', name: 'Vocal', gains: [-3, -1, 4, 3, 1], bassBoost: -2, preamp: 1 },
  rock: { id: 'rock', name: 'Rock', gains: [5, 2, -3, -1, 3], bassBoost: 3, preamp: 0 },
  pop: { id: 'pop', name: 'Pop', gains: [-1, 2, 5, 2, -1], bassBoost: 0, preamp: 1 },
  electronic: { id: 'electronic', name: 'Electronic', gains: [6, 3, -2, 2, 5], bassBoost: 4, preamp: 0 },
  custom: { id: 'custom', name: 'Custom', gains: [0, 0, 0, 0, 0], bassBoost: 0, preamp: 0 },
}

export const BASS_FREQ = 100

interface AudioFxState {
  enabled: boolean
  preset: PresetId
  gains: [number, number, number, number, number]
  bassBoost: number
  preamp: number

  setEnabled: (v: boolean) => void
  setPreset: (id: PresetId) => void
  setBandGain: (idx: number, value: number) => void
  setBassBoost: (v: number) => void
  setPreamp: (v: number) => void
  reset: () => void
}

export const useAudioFxStore = create<AudioFxState>()(
  persist(
    (set, get) => ({
      enabled: false,
      preset: 'flat',
      gains: [0, 0, 0, 0, 0],
      bassBoost: 0,
      preamp: 0,

      setEnabled: (v) => set({ enabled: v }),

      setPreset: (id) => {
        const p = PRESETS[id]
        if (!p) return
        set({
          preset: id,
          gains: [...p.gains] as [number, number, number, number, number],
          bassBoost: p.bassBoost,
          preamp: p.preamp,
        })
      },

      setBandGain: (idx, value) => {
        const gains = [...get().gains] as [number, number, number, number, number]
        gains[idx] = Math.max(-12, Math.min(12, value))
        set({ gains, preset: 'custom' })
      },

      setBassBoost: (v) => {
        set({ bassBoost: Math.max(0, Math.min(12, v)), preset: 'custom' })
      },

      setPreamp: (v) => {
        set({ preamp: Math.max(-6, Math.min(6, v)), preset: 'custom' })
      },

      reset: () =>
        set({
          enabled: false,
          preset: 'flat',
          gains: [0, 0, 0, 0, 0],
          bassBoost: 0,
          preamp: 0,
        }),
    }),
    { name: 'omni-audiofx' }
  )
)
