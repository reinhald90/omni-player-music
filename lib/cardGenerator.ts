import type { Song } from '@/types'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1920
const LOGO_URL = '/icon.png'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

export interface ShareCardOptions {
  size?: 'story' | 'post'
}

export async function generateShareCard(
  song: Song,
  options: ShareCardOptions = {}
): Promise<Blob> {
  const size = options.size || 'story'
  const W = CARD_WIDTH
  const H = size === 'story' ? CARD_HEIGHT : CARD_WIDTH

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak didukung browser')

  // === Background ===
  ctx.fillStyle = '#050505'
  ctx.fillRect(0, 0, W, H)

  // === Blurred thumbnail background ===
  try {
    const thumb = await loadImage(song.thumbnail)
    ctx.save()
    ctx.filter = 'blur(120px) saturate(1.8) brightness(0.7)'
    const scale = 2.5
    ctx.drawImage(
      thumb,
      (-W * (scale - 1)) / 2,
      (-H * (scale - 1)) / 2,
      W * scale,
      H * scale
    )
    ctx.restore()
  } catch (e) {
    console.warn('[Card] Thumbnail load failed')
  }

  // === Overlay gradient ===
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, 'rgba(0,0,0,0.45)')
  grad.addColorStop(0.5, 'rgba(0,0,0,0.65)')
  grad.addColorStop(1, 'rgba(0,0,0,0.95)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // === Pink glow ===
  const glow = ctx.createRadialGradient(W / 2, H * 0.5, 100, W / 2, H * 0.5, W * 0.9)
  glow.addColorStop(0, 'rgba(255,45,85,0.15)')
  glow.addColorStop(0.6, 'rgba(192,132,252,0.06)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // === TOP: NOW PLAYING ===
  ctx.save()
  ctx.font = 'bold 32px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#ff2d55'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('● NOW PLAYING', W / 2, 160)
  ctx.restore()

  // === Album Art ===
  const artSize = W * 0.72
  const artX = (W - artSize) / 2
  const artY = H * 0.22
  const artRadius = 60

  ctx.save()
  ctx.shadowColor = 'rgba(255,45,85,0.4)'
  ctx.shadowBlur = 100
  ctx.shadowOffsetY = 30
  ctx.fillStyle = '#1a1a1a'
  roundRect(ctx, artX, artY, artSize, artSize, artRadius)
  ctx.fill()
  ctx.restore()

  try {
    const thumb = await loadImage(song.thumbnail)
    ctx.save()
    roundRect(ctx, artX, artY, artSize, artSize, artRadius)
    ctx.clip()
    ctx.drawImage(thumb, artX, artY, artSize, artSize)
    ctx.restore()
  } catch (e) {
    ctx.save()
    ctx.fillStyle = '#ff2d55'
    roundRect(ctx, artX, artY, artSize, artSize, artRadius)
    ctx.fill()
    ctx.restore()
  }

  // === Title ===
  const textAreaY = artY + artSize + 100
  const maxTextWidth = W * 0.85

  ctx.save()
  ctx.font = 'bold 68px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  const titleLines = wrapText(ctx, song.title, maxTextWidth).slice(0, 2)
  let currentY = textAreaY

  for (const line of titleLines) {
    ctx.fillText(line, W / 2, currentY)
    currentY += 82
  }
  ctx.restore()

  // === Artist ===
  ctx.save()
  ctx.font = '500 40px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const artistLine = wrapText(ctx, song.artist, maxTextWidth).slice(0, 1)[0]
  ctx.fillText(artistLine, W / 2, currentY + 20)
  ctx.restore()

  // === Progress bar (hiasan) ===
  const barY = H * 0.82
  const barWidth = W * 0.5
  const barX = (W - barWidth) / 2

  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  roundRect(ctx, barX, barY, barWidth, 6, 3)
  ctx.fill()

  ctx.fillStyle = '#ff2d55'
  roundRect(ctx, barX, barY, barWidth * 0.4, 6, 3)
  ctx.fill()
  ctx.restore()

  // === FOOTER: Logo + Text ===
  const bottomY = H - 200
  const logoSize = 80
  const logoX = W / 2 - 260
  const logoY = bottomY

  // === LOAD ICON.PNG SEBAGAI LOGO ===
  let logoLoaded = false
  try {
    const logoImg = await loadImage(LOGO_URL)

    // Circle background pink-purple (jaga-jaga kalau icon transparan)
    ctx.save()
    const logoGrad = ctx.createLinearGradient(
      logoX,
      logoY,
      logoX + logoSize,
      logoY + logoSize
    )
    logoGrad.addColorStop(0, '#ff2d55')
    logoGrad.addColorStop(1, '#c084fc')
    ctx.fillStyle = logoGrad
    ctx.beginPath()
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Gambar icon.png di dalam lingkaran (clipped)
    ctx.save()
    ctx.beginPath()
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
    ctx.restore()

    logoLoaded = true
  } catch (e) {
    console.warn('[Card] icon.png load failed, fallback to emoji')
  }

  // Fallback kalau icon.png gagal load → pakai emoji
  if (!logoLoaded) {
    ctx.save()
    const logoGrad = ctx.createLinearGradient(
      logoX,
      logoY,
      logoX + logoSize,
      logoY + logoSize
    )
    logoGrad.addColorStop(0, '#ff2d55')
    logoGrad.addColorStop(1, '#c084fc')
    ctx.fillStyle = logoGrad
    ctx.beginPath()
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = '48px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.fillText('🎧', logoX + logoSize / 2, logoY + logoSize / 2 + 4)
    ctx.restore()
  }

  // === Text: Omni Player Music ===
  ctx.save()
  ctx.font = 'bold 42px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Omni Player Music', logoX + logoSize + 24, logoY + 28)

  ctx.font = '500 26px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText('omniplayermusic.web.id', logoX + logoSize + 24, logoY + 62)
  ctx.restore()

  // === Convert ke Blob ===
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Gagal generate card'))
      },
      'image/png',
      0.95
    )
  })
}
