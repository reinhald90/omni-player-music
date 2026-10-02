'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'

const PRIMARY_API = 'https://api.ikyyxd.my.id/search/ytplayv2'
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

async function fetchFromIkyyxd(query: string): Promise<any> {
  const apiUrl = `${PRIMARY_API}?q=${encodeURIComponent(query)}`

  // Coba direct dulu
  try {
    console.log(`[Audio] Direct: ${apiUrl}`)
    const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const json = await res.json()
      if (json.status && json.result?.audio?.url) {
        console.log('[Audio] ✅ Direct success')
        return json
      }
    }
  } catch (e: any) {
    console.warn('[Audio] Direct blocked:', e.message)
  }

  // Fallback CORS proxy — sama seperti OAA
  console.log('[Audio] 🔄 CORS proxy...')
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`
  const res2 = await fetch(proxyUrl)
  if (!res2.ok) throw new Error(`Proxy error ${res2.status}`)
  const json2 = await res2.json()
  if (!json2.status || !json2.result?.audio?.url) {
    throw new Error('Lagu tidak ditemukan')
  }
  console.log('[Audio] ✅ Proxy success')
  return json2
}

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio()
    audio.preload = 'auto'
    // ❌ JANGAN SET crossOrigin!
    // audio.crossOrigin = 'anonymous'  ← sebelumnya ini, hapus!
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
      console.error('[Audio] Error:', audio.error)
      setStatus('error')
      setErrorMsg('Audio gagal dimuat')
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

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    let cancelled = false
    const query = current.title.slice(0, 80) // query simple, kayak OAA

    const loadAudio = async () => {
      setStatus('loading')
      setErrorMsg(null)
      audio.pause()
      audio.removeAttribute('src')

      console.log(`[Audio] Loading: "${query}"`)

      try {
        const json = await fetchFromIkyyxd(query)
        if (cancelled) return

        const audioUrl: string = json.result.audio.url
        console.log(`[Audio] ✅ URL: ${audioUrl.slice(0, 60)}...`)

        audio.src = audioUrl
        audio.load()
      } catch (e: any) {
        if (cancelled) return
        console.error('[Audio] ❌ Failed:', e.message)
        setStatus('error')
        setErrorMsg(e.message || 'Gagal memuat audio')
      }
    }

    loadAudio()

    return () => {
      cancelled = true
    }
  }, [current])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    if (isPlaying) {
      audio.play().catch((e) => {
        console.warn('[Audio] Play blocked:', e.message)
        setErrorMsg('Tap layar dulu, lalu play lagi')
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
