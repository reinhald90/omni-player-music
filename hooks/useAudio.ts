'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'

const PRIMARY_API = 'https://api.ikyyxd.my.id/search/ytplayv2'

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

  // Init HTML5 Audio element sekali
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

  // Load audio ketika lagu berubah — fetch langsung dari browser ke iKyyXD
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    let cancelled = false
    const query = current.title + (current.artist ? ' ' + current.artist : '')

    const loadAudio = async () => {
      setStatus('loading')
      setErrorMsg(null)
      audio.pause()
      audio.removeAttribute('src')

      const t0 = Date.now()
      const apiUrl = `${PRIMARY_API}?q=${encodeURIComponent(query)}`

      console.log(`[Audio] Fetching: ${query}`)

      try {
        // Fetch langsung dari browser ke API iKyyXD (bypass Vercel timeout)
        const res = await fetch(apiUrl, {
          headers: { Accept: 'application/json' },
        })

        if (cancelled) return

        if (!res.ok) throw new Error(`API error ${res.status}`)
        const json = await res.json()

        if (cancelled) return

        if (!json.status || !json.result?.audio?.url) {
          throw new Error('Lagu tidak ditemukan di API')
        }

        const audioUrl: string = json.result.audio.url
        const ms = Date.now() - t0
        console.log(`[Audio] ✅ Got audio in ${ms}ms: ${json.result.title}`)

        audio.src = audioUrl
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
        setErrorMsg('Tap layar dulu, lalu klik play lagi')
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, current])

  // Volume
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = muted
  }, [volume, muted])

  // Loop
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.loop = loop
  }, [loop])

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current
      if (!audio) return
      try {
        audio.currentTime = time
        setCurrentTime(time)
      } catch {}
    },
    [setCurrentTime]
  )

  const seekRelative = useCallback((delta: number) => {
    const audio = audioRef.current
    if (!audio) return
    try {
      audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta))
    } catch {}
  }, [])

  return {
    status,
    errorMsg,
    seek,
    seekRelative,
  }
}
