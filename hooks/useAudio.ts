'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

let ytApiPromise: Promise<any> | null = null

function loadYouTubeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (ytApiPromise) return ytApiPromise

  ytApiPromise = new Promise((resolve, reject) => {
    // Kalau script sudah ada (load kedua kali), pakai existing
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]')
    if (existing) {
      // Polling sampai window.YT.Player tersedia
      const check = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(check)
          resolve(window.YT)
        }
      }, 100)
      setTimeout(() => {
        clearInterval(check)
        if (!window.YT) reject(new Error('YouTube API timeout (polling)'))
      }, 15000)
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    tag.onerror = () => reject(new Error('Gagal memuat YouTube API script'))
    document.head.appendChild(tag)

    const prevHandler = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prevHandler) try { prevHandler() } catch {}
      resolve(window.YT)
    }

    setTimeout(() => {
      if (window.YT && window.YT.Player) resolve(window.YT)
      else reject(new Error('YouTube API timeout'))
    }, 15000)
  })
  return ytApiPromise
}

export function useAudio() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const readyRef = useRef(false)
  const pendingVideoRef = useRef<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const loop = usePlayerStore((s) => s.loop)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)

  // Init YT Player once
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const YT = await loadYouTubeApi()
        if (!mounted || !containerRef.current) {
          console.warn('[YT] Container not ready or unmounted')
          return
        }

        // Buat div target di dalam container
        const target = document.createElement('div')
        target.id = 'yt-player-target-' + Date.now()
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(target)

        console.log('[YT] Initializing player...')

        const player = new YT.Player(target, {
          width: '200',
          height: '200',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              console.log('[YT] ✅ Player ready')
              readyRef.current = true
              setStatus('ready')

              // Load video yang pending (kalau ada)
              if (pendingVideoRef.current) {
                const vid = pendingVideoRef.current
                pendingVideoRef.current = null
                const state = usePlayerStore.getState()
                if (state.isPlaying) {
                  player.loadVideoById(vid)
                } else {
                  player.cueVideoById(vid)
                }
              }
            },
            onStateChange: (e: any) => {
              console.log('[YT] State:', e.data)
              if (e.data === 1) setStatus('ready')
              else if (e.data === 3) setStatus('loading')
              else if (e.data === 0) {
                const state = usePlayerStore.getState()
                if (state.loop) {
                  player.seekTo(0)
                  player.playVideo()
                } else {
                  state.pause()
                }
              }
            },
            onError: (e: any) => {
              console.error('[YT] ❌ Error code:', e.data)
              const codes: Record<number, string> = {
                2: 'Video ID tidak valid',
                5: 'Video tidak bisa diputar di HTML5',
                100: 'Video tidak ditemukan / private',
                101: 'Embed video ini dinonaktifkan',
                150: 'Embed video ini dinonaktifkan',
              }
              setStatus('error')
              setErrorMsg(codes[e.data] || `YouTube error: ${e.data}`)
            },
          },
        })

        playerRef.current = player
      } catch (e: any) {
        if (!mounted) return
        console.error('[YT] Init error:', e)
        setStatus('error')
        setErrorMsg(e.message || 'Gagal load YouTube')
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  // Load video saat current berubah
  useEffect(() => {
    if (!current) return

    setStatus('loading')
    setErrorMsg(null)

    const load = () => {
      const player = playerRef.current
      if (!player || !readyRef.current) {
        // Belum siap, simpan pending
        pendingVideoRef.current = current.id
        return
      }
      try {
        console.log(`[YT] Loading video: ${current.id}`)
        if (isPlaying) {
          player.loadVideoById(current.id)
        } else {
          player.cueVideoById(current.id)
        }
      } catch (e: any) {
        console.error('[YT] Load error:', e)
        setStatus('error')
        setErrorMsg(e.message)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  // Sync play/pause
  useEffect(() => {
    if (!current) return
    const player = playerRef.current
    if (!player || !readyRef.current || typeof player.playVideo !== 'function') return

    try {
      if (isPlaying) {
        player.playVideo()
      } else {
        player.pauseVideo()
      }
    } catch {}
  }, [isPlaying, current])

  // Volume
  useEffect(() => {
    const player = playerRef.current
    if (!player || typeof player.setVolume !== 'function') return
    try {
      player.setVolume(Math.round((muted ? 0 : volume) * 100))
      if (muted) player.mute?.()
      else player.unMute?.()
    } catch {}
  }, [volume, muted])

  // Progress ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current
      if (!player || typeof player.getCurrentTime !== 'function') return
      try {
        const t = player.getCurrentTime()
        const d = player.getDuration()
        if (typeof t === 'number' && Number.isFinite(t)) setCurrentTime(t)
        if (typeof d === 'number' && d > 0) setDuration(d)
      } catch {}
    }, 500)
    return () => clearInterval(interval)
  }, [setCurrentTime, setDuration])

  const seek = useCallback(
    (time: number) => {
      const player = playerRef.current
      if (!player || !player.seekTo) return
      try {
        player.seekTo(time, true)
        setCurrentTime(time)
      } catch {}
    },
    [setCurrentTime]
  )

  const seekRelative = useCallback((delta: number) => {
    const player = playerRef.current
    if (!player || !player.getCurrentTime) return
    try {
      const t = Math.max(0, player.getCurrentTime() + delta)
      player.seekTo(t, true)
    } catch {}
  }, [])

  return {
    containerRef,
    status,
    errorMsg,
    seek,
    seekRelative,
  }
}
