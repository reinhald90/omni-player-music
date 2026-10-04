'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { getFrequencyData, isAnalyserReady } from '@/lib/audioAnalyser'

interface Props {
  variant?: 'full' | 'mini'
  className?: string
  height?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  hue: number
}

export default function Visualizer({ variant = 'full', className, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  // Persistent values — biar gak reset tiap pause/play
  const rotationRef = useRef(0)
  const smoothRef = useRef({ bass: 0.4, mid: 0.4, treble: 0.4 })
  const phaseRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const lastFrameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isMini = variant === 'mini'
    const BAR_COUNT = isMini ? 14 : 56
    const BAR_GAP = isMini ? 1 : 3
    const BAR_MIN_H = isMini ? 1 : 3
    const MAX_PARTICLES = isMini ? 0 : 45
    const PARTICLES = particlesRef.current

    let rafId: number | null = null

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    // ============ LAYER 3: PARTICLES (kiri & kanan) ============
    const spawnParticles = (W: number, H: number, intensity: number) => {
      const spawnCount = Math.floor(intensity * 2.5)
      for (let i = 0; i < spawnCount; i++) {
        if (PARTICLES.length >= MAX_PARTICLES) break
        const isLeft = Math.random() > 0.5
        const x = isLeft
          ? W * 0.05 + Math.random() * W * 0.13
          : W * 0.82 + Math.random() * W * 0.13
        const hue = Math.random() > 0.5 ? 340 : 280
        PARTICLES.push({
          x,
          y: -8,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 0.5 + Math.random() * 1.2 + intensity * 1.5,
          size: 1.2 + Math.random() * 2,
          life: 1,
          maxLife: 180 + Math.random() * 120,
          hue,
        })
      }
    }

    const drawParticles = (W: number, H: number, intensity: number) => {
      spawnParticles(W, H, intensity)

      ctx.save()
      for (let i = PARTICLES.length - 1; i >= 0; i--) {
        const p = PARTICLES[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.008
        p.life -= 1 / p.maxLife

        if (p.life <= 0 || p.y > H + 10) {
          PARTICLES.splice(i, 1)
          continue
        }

        const alpha =
          p.life > 0.85
            ? (1 - p.life) / 0.15
            : Math.min(1, p.life / 0.3)

        ctx.globalAlpha = Math.max(0, Math.min(0.85, alpha))
        ctx.fillStyle = `hsl(${p.hue}, 90%, 65%)`
        ctx.shadowColor = `hsl(${p.hue}, 90%, 60%)`
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // ============ LAYER 1: SPIRAL ============
    const drawSpiral = (W: number, H: number, intensity: number) => {
      const cx = W / 2
      const cy = H * 0.55
      const maxRadius = Math.min(W * 0.42, H * 1.4)
      const turns = 3.5
      const opacity = 0.06 + intensity * 0.16

      ctx.save()
      ctx.globalAlpha = opacity
      ctx.lineWidth = 1.4
      ctx.lineCap = 'round'

      const grad = ctx.createLinearGradient(
        cx - maxRadius,
        cy,
        cx + maxRadius,
        cy
      )
      grad.addColorStop(0, '#ff2d55')
      grad.addColorStop(0.5, '#ff6b9d')
      grad.addColorStop(1, '#c084fc')
      ctx.strokeStyle = grad

      for (let arm = 0; arm < 2; arm++) {
        ctx.beginPath()
        const armOffset = arm * Math.PI
        const steps = 180
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const angle =
            t * Math.PI * 2 * turns + rotationRef.current + armOffset
          const r = t * maxRadius
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r * 0.35
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.restore()
    }

    // ============ LAYER 2: BARS ============
    const drawBars = (
      W: number,
      H: number,
      freq: Uint8Array | null
    ) => {
      const availableW = W - 24
      const barW = Math.max(1.5, availableW / BAR_COUNT - BAR_GAP)
      const totalW = BAR_COUNT * (barW + BAR_GAP) - BAR_GAP
      const startX = (W - totalW) / 2
      const baselineY = H - (isMini ? 2 : 8)
      const maxBarH = H - (isMini ? 6 : 20)

      const grad = ctx.createLinearGradient(
        0,
        baselineY - maxBarH,
        0,
        baselineY
      )
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.4, '#ff6b9d')
      grad.addColorStop(1, '#ff2d55')

      ctx.save()
      ctx.fillStyle = grad

      for (let i = 0; i < BAR_COUNT; i++) {
        let v = 0
        if (freq && freq.length > 0) {
          const binStart = 1
          const binEnd = Math.min(freq.length - 1, 50)
          const t = i / (BAR_COUNT - 1)
          const binIdx = Math.floor(binStart + t * (binEnd - binStart))
          v = freq[binIdx] / 255
          v = Math.pow(v, 0.7)
        } else {
          const w1 = Math.sin(phaseRef.current + i * 0.35) * 0.5 + 0.5
          const w2 = Math.sin(phaseRef.current * 1.7 + i * 0.8) * 0.3
          v = Math.max(0, Math.min(1, w1 * 0.7 + w2 + 0.2))
        }

        const variation =
          0.7 + Math.sin(i * 1.3 + phaseRef.current) * 0.3
        const h = BAR_MIN_H + v * maxBarH * variation
        const x = startX + i * (barW + BAR_GAP)
        const y = baselineY - h

        if (isMini) {
          ctx.fillRect(x, y, barW, h)
        } else {
          const r = Math.min(barW / 2, 2)
          ctx.beginPath()
          ctx.moveTo(x, baselineY)
          ctx.lineTo(x, y + r)
          ctx.quadraticCurveTo(x, y, x + r, y)
          ctx.lineTo(x + barW - r, y)
          ctx.quadraticCurveTo(x + barW, y, x + barW, y + r)
          ctx.lineTo(x + barW, baselineY)
          ctx.closePath()
          ctx.fill()
        }
      }
      ctx.restore()
    }

    // ============ ANIMATE LOOP ============
    const animate = (now: number) => {
      const dt = Math.min(
        50,
        now - (lastFrameRef.current || now)
      ) / 16.67
      lastFrameRef.current = now

      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const H = rect.height
      if (W === 0 || H === 0) {
        rafId = requestAnimationFrame(animate)
        return
      }

      ctx.clearRect(0, 0, W, H)

      const freq = isAnalyserReady() ? getFrequencyData() : null

      let bass = 0.4
      let mid = 0.4
      let treble = 0.4

      if (freq && freq.length > 0) {
        let bSum = 0,
          mSum = 0,
          tSum = 0
        for (let i = 1; i <= 6; i++) bSum += freq[i]
        for (let i = 7; i <= 20; i++) mSum += freq[i]
        for (let i = 21; i <= 45; i++) tSum += freq[i]
        bass = bSum / 6 / 255
        mid = mSum / 14 / 255
        treble = tSum / 25 / 255
      } else {
        phaseRef.current += 0.05 * dt
        bass = 0.5 + Math.sin(phaseRef.current) * 0.25
        mid = 0.5 + Math.sin(phaseRef.current * 1.6) * 0.25
        treble = 0.5 + Math.sin(phaseRef.current * 2.2) * 0.25
      }

      const s = smoothRef.current
      s.bass = s.bass * 0.85 + bass * 0.15
      s.mid = s.mid * 0.8 + mid * 0.2
      s.treble = s.treble * 0.7 + treble * 0.3

      rotationRef.current += (0.008 + s.bass * 0.025) * dt

      if (!isMini) drawSpiral(W, H, s.bass)
      drawBars(W, H, freq)
      if (!isMini) drawParticles(W, H, s.treble)

      rafId = requestAnimationFrame(animate)
    }

    // ============ IDLE STATE ============
    const drawIdle = () => {
      const rect = canvas.getBoundingClientRect()
      const W = rect.width
      const H = rect.height
      if (W === 0 || H === 0) return
      ctx.clearRect(0, 0, W, H)

      if (isMini) {
        const count = 14
        const gap = 1
        const barW = Math.max(1.5, (W - 8) / count - gap)
        const totalW = count * (barW + gap) - gap
        const startX = (W - totalW) / 2
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        for (let i = 0; i < count; i++) {
          const x = startX + i * (barW + gap)
          ctx.fillRect(x, H - 3, barW, 2)
        }
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        const barW = 2
        const gap = 5
        const count = Math.floor(W / (barW + gap))
        const totalW = count * (barW + gap) - gap
        const startX = (W - totalW) / 2
        for (let i = 0; i < count; i++) {
          const x = startX + i * (barW + gap)
          ctx.fillRect(x, H - 6, barW, 3)
        }
      }
    }

    // ============ START / STOP ============
    const start = () => {
      if (rafId != null) return
      lastFrameRef.current = performance.now()
      rafId = requestAnimationFrame(animate)
    }
    const stop = () => {
      if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      PARTICLES.length = 0
      drawIdle()
    }

    if (isPlaying) start()
    else stop()

    return () => {
      window.removeEventListener('resize', resize)
      if (rafId != null) cancelAnimationFrame(rafId)
    }
  }, [isPlaying, variant])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: variant === 'mini'
          ? '14px'
          : height
            ? `${height}px`
            : '160px',
        display: 'block',
      }}
      aria-hidden="true"
    />
  )
}
