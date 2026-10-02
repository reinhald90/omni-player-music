import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { parseLRC, plainToSynced } from '@/lib/lyrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const USER_AGENT = 'OmniPlayerMusic/1.0 (https://omniplayermusic.app)'

interface LRCLibResult {
  id: number
  trackName: string
  artistName: string
  duration: number
  syncedLyrics: string | null
  plainLyrics: string | null
}

/** Bersihkan judul dari suffix umum */
function cleanTitle(raw: string): string {
  return raw
    .replace(/\(official\s*(music\s*)?(video|audio|lyric[s]?)?\)/gi, '')
    .replace(/\(lyric[s]?\s*(video)?\)/gi, '')
    .replace(/\(audio\)/gi, '')
    .replace(/\(mv\)/gi, '')
    .replace(/\(m\/v\)/gi, '')
    .replace(/\(visualizer\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/【.*?】/g, '')
    .replace(/\s*-\s*topic\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split "A - B" jadi { title, artist } */
function splitArtistTitle(clean: string, fallbackArtist: string) {
  const m = clean.match(/^(.+?)\s*[-–—]\s*(.+)$/)
  if (m) {
    const a = m[1].trim()
    const b = m[2].trim()
    // Artist biasanya lebih pendek dari judul
    if (a.length < b.length) {
      return { artist: a, title: b }
    }
    return { artist: b, title: a }
  }
  return { artist: fallbackArtist, title: clean }
}

export async function GET(req: NextRequest) {
  const rawTitle = req.nextUrl.searchParams.get('title')?.trim() || ''
  const rawArtist = req.nextUrl.searchParams.get('artist')?.trim() || ''
  const duration = Number(req.nextUrl.searchParams.get('duration') || 0)

  if (!rawTitle) {
    return NextResponse.json(
      { success: false, error: 'title wajib' },
      { status: 400 }
    )
  }

  const clean = cleanTitle(rawTitle)
  const { title, artist } = splitArtistTitle(clean, rawArtist)

  console.log(`[Lyrics] Search: "${title}" by "${artist}" (dur: ${duration}s)`)

  // ============================================================
  // STRATEGI 1: Exact match via /api/get (butuh duration tepat)
  // ============================================================
  if (duration > 0 && duration < 3600) {
    try {
      const params = new URLSearchParams({
        track_name: title,
        artist_name: artist,
        duration: String(Math.round(duration)),
      })
      const r = await axios.get(`https://lrclib.net/api/get?${params}`, {
        timeout: 8000,
        headers: { 'User-Agent': USER_AGENT },
        validateStatus: (s) => s >= 200 && s < 500,
      })

      if (r.status === 200 && r.data) {
        const data = r.data
        if (data.syncedLyrics) {
          console.log(`[Lyrics] ✅ Exact + synced`)
          return NextResponse.json({
            success: true,
            data: {
              source: 'synced',
              lyrics: parseLRC(data.syncedLyrics),
            },
          })
        }
        if (data.plainLyrics) {
          console.log(`[Lyrics] ✅ Exact + plain`)
          return NextResponse.json({
            success: true,
            data: {
              source: 'plain',
              lyrics: plainToSynced(data.plainLyrics, duration),
            },
          })
        }
      }
    } catch (e: any) {
      console.warn(`[Lyrics] Exact failed:`, e.message)
    }
  }

  // ============================================================
  // STRATEGI 2: Fuzzy search via /api/search (tanpa duration)
  // ============================================================
  try {
    // Coba kombinasi query
    const queries = [
      `${title} ${artist}`, // "Love Me Not Ravyn Lenae"
      title, // "Love Me Not"
      `${artist} ${title}`, // "Ravyn Lenae Love Me Not"
    ]

    for (const q of queries) {
      const r = await axios.get('https://lrclib.net/api/search', {
        params: { q },
        timeout: 10000,
        headers: { 'User-Agent': USER_AGENT },
        validateStatus: (s) => s >= 200 && s < 500,
      })

      if (r.status !== 200 || !Array.isArray(r.data) || r.data.length === 0) {
        continue
      }

      const results: LRCLibResult[] = r.data

      // Score & pilih yang paling cocok
      const scored = results
        .map((res) => {
          let score = 0
          const titleLower = title.toLowerCase()
          const artistLower = artist.toLowerCase()
          const resTitle = (res.trackName || '').toLowerCase()
          const resArtist = (res.artistName || '').toLowerCase()

          if (resTitle === titleLower) score += 50
          else if (resTitle.includes(titleLower) || titleLower.includes(resTitle)) score += 30

          if (resArtist === artistLower) score += 30
          else if (resArtist.includes(artistLower) || artistLower.includes(resArtist)) score += 15

          if (duration > 0 && res.duration) {
            const diff = Math.abs(res.duration - duration)
            if (diff < 3) score += 20
            else if (diff < 10) score += 10
          }

          if (res.syncedLyrics) score += 5

          return { res, score }
        })
        .sort((a, b) => b.score - a.score)

      const best = scored[0]
      if (best && best.score > 20) {
        const { res } = best
        console.log(
          `[Lyrics] ✅ Search found (score ${best.score}): ${res.trackName} by ${res.artistName}`
        )

        if (res.syncedLyrics) {
          return NextResponse.json({
            success: true,
            data: {
              source: 'synced',
              lyrics: parseLRC(res.syncedLyrics),
            },
          })
        }
        if (res.plainLyrics) {
          return NextResponse.json({
            success: true,
            data: {
              source: 'plain',
              lyrics: plainToSynced(res.plainLyrics, duration || res.duration),
            },
          })
        }
      }
    }
  } catch (e: any) {
    console.warn(`[Lyrics] Search failed:`, e.message)
  }

  console.log(`[Lyrics] ❌ No lyrics found for "${title}"`)
  return NextResponse.json({
    success: true,
    data: { source: 'none', lyrics: [] },
  })
}
