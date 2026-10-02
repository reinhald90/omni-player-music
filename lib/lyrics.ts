import type { LyricLine } from '@/types'

export interface LyricsResult {
  source: 'synced' | 'plain' | 'none'
  lyrics: LyricLine[]
}

/** Parse format LRC: [00:12.34] Teks lirik */
export function parseLRC(lrc: string): LyricLine[] {
  const out: LyricLine[] = []
  const tsRe = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g

  for (const line of lrc.split(/\r?\n/)) {
    const matches = [...line.matchAll(tsRe)]
    if (!matches.length) continue

    const text = line.replace(tsRe, '').trim()
    if (!text) continue

    for (const m of matches) {
      const min = Number(m[1])
      const sec = Number(m[2])
      const frac = m[3] || ''
      let f = 0
      if (frac.length === 1) f = Number(frac) * 100
      else if (frac.length === 2) f = Number(frac) * 10
      else if (frac.length >= 3) f = Number(frac.slice(0, 3))

      out.push({ time: min * 60 + sec + f / 1000, text })
    }
  }

  return out.sort((a, b) => a.time - b.time)
}

/** Konversi plain lyrics ke synced (dibagi rata sepanjang durasi) */
export function plainToSynced(text: string, duration: number): LyricLine[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) return []

  const interval = duration > 0 ? Math.max(2, Math.min(8, duration / lines.length)) : 5
  return lines.map((t, i) => ({ time: i * interval, text: t }))
}

/** Pesan-pesan seru saat lagu gak punya lirik */
const FUN_MESSAGES = [
  '🎵 ♪ ♫ ♪ 🎵',
  'Pencet play, dunia jadi lebih indah ✨',
  'Bass-nya nendang ya? 🔊',
  'Ayo nyanyi bareng 🎤',
  'Liriknya gak ada, tapi vibes-nya ada 🌊',
  'Tutup mata, rasain iramanya 👁️✨',
  'Lagu ini enak banget, ya kan? 🎧',
  'Chill dulu, santai aja 🍃',
  'Terus mainin, jangan di-skip 😎',
  'Kamu keren udah dengerin sampai sini 🌟',
  'Nikmatin setiap detiknya ⏳',
  'Volume naikin dikit biar mantap 🔉',
  'Ini lagu favoritmu, kan? 💫',
  'Musik = obat hati 💙',
  '♪ ♪ ♪',
  'Jangan lupa follow channel kami ya 📢',
  'Omni Player Music 🎵',
  'Keep vibing, keep smiling 😊',
  'DJ-nya lagi nge-drop nih 🎛️',
  'Suara merdunya bikin merinding 🎶',
  'Selamat menikmati 🎁',
  'Lagu ini cocok buat santai 🛋️',
  'Semangat hari ini, ya! 💪',
  'Musik menyatukan kita 🌏',
  'Encore! Encore! 👏',
]

/** Fallback kalau lirik tidak ada — generate pesan seru sepanjang durasi */
export function generateFallbackLyrics(
  title: string,
  artist: string,
  duration: number
): LyricLine[] {
  const intro: LyricLine[] = [
    { time: 0, text: '♪ ♪ ♪' },
    { time: 2, text: title },
    { time: 4, text: `oleh ${artist}` },
  ]

  if (!duration || duration <= 0 || duration > 3600) {
    return intro
  }

  const start = 6
  const end = duration - 3
  const remaining = end - start
  if (remaining <= 0) return intro

  const msgs = [...FUN_MESSAGES].sort(() => Math.random() - 0.5)
  const interval = Math.max(4, remaining / msgs.length)
  const out = [...intro]

  msgs.forEach((msg, i) => {
    const t = start + i * interval
    if (t < end) out.push({ time: t, text: msg })
  })

  out.push({ time: duration - 2, text: '🎵 — 🎵' })
  return out
}
