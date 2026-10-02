'use client'

import { useEffect } from 'react'
import { usePlayerStore } from '@/store/playerStore'

export function useKeyboardShortcuts() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // Skip kalau user lagi ngetik
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const store = usePlayerStore.getState()
      if (!store.current) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          store.toggle()
          break
        case 'ArrowLeft':
          e.preventDefault()
          document.dispatchEvent(new CustomEvent('omni:seek', { detail: -5 }))
          break
        case 'ArrowRight':
          e.preventDefault()
          document.dispatchEvent(new CustomEvent('omni:seek', { detail: 5 }))
          break
        case 'ArrowUp':
          e.preventDefault()
          store.setVolume(Math.min(1, store.volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          store.setVolume(Math.max(0, store.volume - 0.1))
          break
        case 'KeyM':
          store.toggleMute()
          break
        case 'KeyN':
          store.next()
          break
        case 'KeyP':
          store.prev()
          break
        case 'KeyL':
          store.toggleLoop()
          break
        case 'KeyH':
          if (!store.fullMode) store.openFull()
          break
        case 'Escape':
          if (store.fullMode) store.closeFull()
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
