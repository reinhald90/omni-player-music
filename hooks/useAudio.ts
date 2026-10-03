'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { useStatsStore } from '@/store/statsStore'
import { setAnalyser } from '@/lib/audioAnalyser'

const PRIMARY_API = 'https://api.ikyyxd.my.id/search/ytplayv2'
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

async function fetchFromIkyyxd(query: string): Promise<any> {
  const apiUrl = `${PRIMARY_API}?q=${encodeURIComponent(query)}`

  try {
    console.log(`[Audio] Direct API: ${apiUrl}`)
    const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const json = await res.json()
      if (json.status && json.result?.audio?.url) {
        console.log('[Audio] ✅ API direct success')
        return json
      }
    }
  } catch (e: any) {
    console.warn('[Audio] API direct blocked:', e.message)
  }

  console.log('[Audio] 🔄 Trying CORS proxy for API...')
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`
  const res2 = await fetch(proxyUrl)
  if (!res2.ok) throw new Error(`API proxy error ${res2.status}`)
  const json2 = await res2.json()
  if (!json2.status || !json2.result?.audio?.url) {
    throw new Error('Lagu tidak ditemukan')
  }
  console.log('[Audio] ✅ API proxy success')
  return json2
}

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const loop = usePlayerStore((s) => s.loop)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)

  // === INIT AUDIO + WEB AUDIO API ===
  useEffect(() => {
    if (typeof window === 'undefined') return

    const audio = new Audio()
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    // === WEB AUDIO API SETUP ===
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.75
      analyser.minDecibels = -85
      analyser.maxDecibels = -25

      source.connect(analyser)
      analyser.connect(ctx.destination)

      ctxRef.current = ctx
      sourceRef.current = source
      analyserRef.current = analyser
      setAnalyser(analyser)

      console.log('[Audio] 🎛️ Web Audio API initialized')
    } catch (e: any) {
      console.warn('[Audio] Web Audio init failed:', e.message)
      setAnalyser(null)
    }

    // === EVENTS ===
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => {
      setDuration(audio.duration || 0)
      setStatus('ready')
      setErrorMsg(null)
    }
    const onPlay = () => {
      setStatus('ready')
      // Track stats — cuma kalau baru mulai (bukan resume)
      const c = usePlayerStore.getState().current
      if (c && audio.currentTime < 3) {
        useStatsStore.getState().trackPlay(c.artist)
      }
      // Resume AudioContext
      const ctx = ctxRef.current
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
    }
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
      setAnalyser(null)
      try {
        ctxRef.current?.close()
      } catch {}
    }
  }, [setCurrentTime, setDuration])

  // === LOAD SONG ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    let cancelled = false
    const query = current.url || current.title

    const loadAudio = async () => {
      setStatus('loading')
      setErrorMsg(null)
      audio.pause()
      audio.removeAttribute('src')

      console.log(`[Audio] Loading: "${query}"`)

      try {
        const json = await fetchFromIkyyxd(query)
        if (cancelled) return

        const upstreamUrl: string = json.result.audio.url
        const proxied = `/api/audio?url=${encodeURIComponent(upstreamUrl)}`
        console.log(`[Audio] 🔊 Using Edge proxy`)

        audio.src = proxied
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

  // === PLAY/PAUSE ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    if (isPlaying) {
      const ctx = ctxRef.current
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
      audio.play().catch((e) => {
        console.warn('[Audio] Play blocked:', e.message)
        setErrorMsg('Tap layar dulu, lalu play lagi')
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, current])

  // === VOLUME ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.muted = muted
  }, [volume, muted])

  // === LOOP ===
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
