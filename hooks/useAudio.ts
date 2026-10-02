'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const loop = usePlayerStore((s) => s.loop)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const pause = usePlayerStore((s) => s.pause)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration || 0)
    const handleEnded = () => {
      if (!usePlayerStore.getState().loop) {
        usePlayerStore.getState().pause()
        audio.currentTime = 0
        setCurrentTime(0)
      }
    }
    const handleError = () => console.error('[Audio] Error:', audio.error?.message)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [setCurrentTime, setDuration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    const loadAudio = async () => {
      try {
        audio.pause()
        audio.currentTime = 0

        if (current.audioUrl) {
          audio.src = current.audioUrl
          audio.load()
          return
        }

        const res = await fetch(`/api/stream?url=${encodeURIComponent(current.url)}`)
        const json = await res.json()
        if (!json.success) {
          console.error('[Audio] Gagal ambil stream:', json.error)
          return
        }
        audio.src = json.data.audioUrl
        audio.load()
      } catch (e) {
        console.error('[Audio] Load error:', e)
      }
    }

    loadAudio()
  }, [current])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying && current) {
      audio.play().catch((e) => {
        console.warn('[Audio] Play blocked:', e.message)
        pause()
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, current, pause])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = muted
  }, [volume, muted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.loop = loop
  }, [loop])

  return { audio: audioRef.current }
}
