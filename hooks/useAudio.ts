'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { useStatsStore } from '@/store/statsStore'
import { useAudioFxStore, EQ_BANDS, BASS_FREQ } from '@/store/audioFxStore'
import { setAnalyser } from '@/lib/audioAnalyser'

const PRIMARY_API = 'https://api.ikyyxd.my.id/search/ytplayv2'
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

async function fetchFromIkyyxd(query: string): Promise<any> {
  const apiUrl = `${PRIMARY_API}?q=${encodeURIComponent(query)}`

  try {
    const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const json = await res.json()
      if (json.status && json.result?.audio?.url) return json
    }
  } catch (e: any) {
    console.warn('[Audio] API direct blocked:', e.message)
  }

  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`
  const res2 = await fetch(proxyUrl)
  if (!res2.ok) throw new Error(`API proxy error ${res2.status}`)
  const json2 = await res2.json()
  if (!json2.status || !json2.result?.audio?.url) throw new Error('Lagu tidak ditemukan')
  return json2
}

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const preampRef = useRef<GainNode | null>(null)
  const bandFiltersRef = useRef<BiquadFilterNode[]>([])
  const bassBoostRef = useRef<BiquadFilterNode | null>(null)

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const loop = usePlayerStore((s) => s.loop)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)

  const fxEnabled = useAudioFxStore((s) => s.enabled)
  const fxGains = useAudioFxStore((s) => s.gains)
  const fxBass = useAudioFxStore((s) => s.bassBoost)
  const fxPreamp = useAudioFxStore((s) => s.preamp)

  // === INIT AUDIO + AUDIO CHAIN ===
  useEffect(() => {
    if (typeof window === 'undefined') return

    const audio = new Audio()
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioCtx()
      const source = ctx.createMediaElementSource(audio)
      const preamp = ctx.createGain()
      const filters: BiquadFilterNode[] = EQ_BANDS.map((band, i) => {
        const filter = ctx.createBiquadFilter()
        if (i === 0) filter.type = 'lowshelf'
        else if (i === EQ_BANDS.length - 1) filter.type = 'highshelf'
        else filter.type = 'peaking'
        filter.frequency.value = band.freq
        if (filter.type === 'peaking') filter.Q.value = 1
        return filter
      })
      const bassBoost = ctx.createBiquadFilter()
      bassBoost.type = 'lowshelf'
      bassBoost.frequency.value = BASS_FREQ
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.75

      source.connect(preamp)
      let prevNode: AudioNode = preamp
      for (const filter of filters) {
        prevNode.connect(filter)
        prevNode = filter
      }
      prevNode.connect(bassBoost)
      bassBoost.connect(analyser)
      analyser.connect(ctx.destination)

      ctxRef.current = ctx
      sourceRef.current = source
      preampRef.current = preamp
      bandFiltersRef.current = filters
      bassBoostRef.current = bassBoost
      analyserRef.current = analyser
      setAnalyser(analyser)
    } catch (e: any) {
      console.warn('[Audio] Audio chain init failed:', e.message)
    }

    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => {
      setDuration(audio.duration || 0)
      setStatus('ready')
      setErrorMsg(null)
    }
    const onPlay = () => {
      setStatus('ready')
      const c = usePlayerStore.getState().current
      if (c && audio.currentTime < 3) useStatsStore.getState().trackPlay(c.artist)
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
      try { ctxRef.current?.close() } catch {}
    }
  }, [setCurrentTime, setDuration])

  // === APPLY EQ SETTINGS ===
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const now = ctx.currentTime
    const preamp = preampRef.current
    const bassBoost = bassBoostRef.current
    const filters = bandFiltersRef.current

    if (fxEnabled) {
      if (preamp) preamp.gain.setTargetAtTime(Math.pow(10, fxPreamp / 20), now, 0.05)
      filters.forEach((f, i) => f.gain.setTargetAtTime(fxGains[i] ?? 0, now, 0.05))
      if (bassBoost) bassBoost.gain.setTargetAtTime(fxBass, now, 0.05)
    } else {
      if (preamp) preamp.gain.setTargetAtTime(1, now, 0.05)
      filters.forEach((f) => f.gain.setTargetAtTime(0, now, 0.05))
      if (bassBoost) bassBoost.gain.setTargetAtTime(0, now, 0.05)
    }
  }, [fxEnabled, fxGains, fxBass, fxPreamp])

  // === LOAD SONG (PINTAR BEDAIN LOKAL VS YOUTUBE) ===
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

      try {
        let finalSrc = ''

        // 🔥 CEK APAKAH INI LAGU KOMUNITAS (Lokal VPS)
        if (query.startsWith('/uploads/') || query.includes('omniplayermusic.web.id/uploads/')) {
          console.log(`[Audio] 🎵 Memutar lagu lokal VPS: ${query}`)
          finalSrc = query
        } 
        // 🔥 JIKA BUKAN, BERARTI DARI YOUTUBE
        else {
          console.log(`[Audio] 🌐 Mengambil dari YouTube: ${query}`)
          const json = await fetchFromIkyyxd(query)
          const upstreamUrl: string = json.result.audio.url
          finalSrc = `/api/audio?url=${encodeURIComponent(upstreamUrl)}`
        }

        if (cancelled) return
        audio.src = finalSrc
        audio.load()
      } catch (e: any) {
        if (cancelled) return
        console.error('[Audio] ❌ Failed:', e.message)
        setStatus('error')
        setErrorMsg(e.message || 'Gagal memuat audio')
      }
    }

    loadAudio()
    return () => { cancelled = true }
  }, [current])

  // === PLAY/PAUSE ===
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    if (isPlaying) {
      const ctx = ctxRef.current
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
      audio.play().catch((e) => {
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

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    try { audio.currentTime = time; setCurrentTime(time) } catch {}
  }, [setCurrentTime])

  const seekRelative = useCallback((delta: number) => {
    const audio = audioRef.current
    if (!audio) return
    try { audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta)) } catch {}
  }, [])

  return { status, errorMsg, seek, seekRelative }
}
