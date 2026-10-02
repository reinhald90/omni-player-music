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
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.onerror = () => reject(new Error('Gagal memuat YouTube API'))
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => resolve(window.YT)
    setTimeout(() => reject(new Error('YouTube API timeout')), 15000)
  })
  return ytApiPromise
}

export function useAudio() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const initializedRef = useRef(false)
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

  // Init YT Player once
  useEffect(() => {
    if (initializedRef.current) return
    let mounted = true

    const init = async () => {
      try {
        const YT = await loadYouTubeApi()
        if (!mounted || !containerRef.current) return

        const innerDiv = document.createElement('div')
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(innerDiv)

        const player = new YT.Player(innerDiv, {
          height: '200',
          width: '200',
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
              setStatus('ready')
            },
            onStateChange: (e: any) => {
              // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
              if (e.data === 1) setStatus('ready')
              else if (e.data === 3) setStatus('loading')
              else if (e.data === 0) {
                const state = usePlayerStore.getState()
                if (state.loop && playerRef.current) {
                  playerRef.current.seekTo(0)
                  playerRef.current.playVideo()
                } else {
                  state.pause()
                }
              }
            },
            onError: (e: any) => {
              setStatus('error')
              setErrorMsg(`YouTube error code: ${e.data}`)
            },
          },
        })

        playerRef.current = player
        initializedRef.current = true
      } catch (e: any) {
        if (!mounted) return
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
    if (!playerRef.current || !current) return
    const player = playerRef.current
    if (!player.loadVideoById) return

    setStatus('loading')
    setErrorMsg(null)

    try {
      if (isPlaying) {
        player.loadVideoById(current.id)
      } else {
        player.cueVideoById(current.id)
      }
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e.message)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  // Sync play/pause
  useEffect(() => {
    if (!playerRef.current || !current) return
    const player = playerRef.current
    if (!player.playVideo) return

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
    if (!playerRef.current || !playerRef.current.setVolume) return
    try {
      playerRef.current.setVolume(Math.round((muted ? 0 : volume) * 100))
      if (muted) playerRef.current.mute?.()
      else playerRef.current.unMute?.()
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
