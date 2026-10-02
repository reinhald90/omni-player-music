'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const loop = usePlayerStore((s) => s.loop)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const pause = usePlayerStore((s) => s.pause)

  // Init audio element
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio()
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => {
      setDuration(audio.duration || 0)
      setStatus('ready')
      setErrorMsg(null)
    }
    const onPlay = () => setStatus('ready')
    const onWaiting = () => setStatus('loading')
    const onEnded = () => {
      if (!usePlayerStore.getState().loop) {
        usePlayerStore.getState().pause()
        audio.currentTime = 0
        setCurrentTime(0)
      }
    }
    const onError = () => {
      setStatus('error')
      setErrorMsg('Gagal memuat audio. Coba lagu lain.')
      console.error('[Audio] Error:', audio.error)
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [setCurrentTime, setDuration])

  // Load saat current berubah
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    let cancelled = false

    const loadAudio = async () => {
      setStatus('loading')
      setErrorMsg(null)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()

      try {
        if (current.audioUrl) {
          audio.src = current.audioUrl
          audio.load()
          return
        }

        const t0 = Date.now()
        const res = await fetch(`/api/stream?q=${encodeURIComponent(current.title)}`)
        const json = await res.json()

        if (cancelled) return

        if (!json.success) {
          throw new Error(json.error || 'Gagal ambil audio')
        }

        console.log(`[Audio] Stream ready in ${Date.now() - t0}ms via ${json.data.provider}`)
        audio.src = json.data.audioUrl
        audio.load()
      } catch (e: any) {
        if (cancelled) return
        console.error('[Audio] Load error:', e.message)
        setStatus('error')
        setErrorMsg(e.message || 'Gagal memuat audio')
      }
    }

    loadAudio()

    return () => {
      cancelled = true
    }
  }, [current])

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    if (isPlaying) {
      audio.play().catch((e) => {
        console.warn('[Audio] Play blocked:', e.message)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, current])

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

  return { audio: audioRef.current, status, errorMsg }
}
