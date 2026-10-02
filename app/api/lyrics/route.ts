import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { parseLRC, plainToSynced } from '@/lib/lyrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title')?.trim()
  const artist = req.nextUrl.searchParams.get('artist')?.trim() || ''
  const duration = Number(req.nextUrl.searchParams.get('duration') || 0)

  if (!title) {
    return NextResponse.json({ success: false, error: 'title wajib' }, { status: 400 })
  }

  // Bersihkan judul dari suffix umum
  const cleanTitle = title
    .replace(/\(official.*?\)/gi, '')
    .replace(/\(lyric.*?\)/gi, '')
    .replace(/\(audio.*?\)/gi, '')
    .replace(/\(mv.*?\)/gi, '')
    .replace(/\(video.*?\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .trim()

  // Coba parse format "A - B" jadi artist/title
  let finalTitle = cleanTitle
  let finalArtist = artist
  const m = cleanTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/)
  if (m) {
    const a = m[1].trim()
    const b = m[2].trim()
    if (a.length < b.length) {
      finalArtist = a
      finalTitle = b
    } else {
      finalArtist = b
      finalTitle = a
    }
  }

  const params = new URLSearchParams({
    track_name: finalTitle,
    artist_name: finalArtist,
  })
  if (duration > 0 && duration < 3600) {
    params.set('duration', String(Math.round(duration)))
  }

  try {
    const r = await axios.get(`https://lrclib.net/api/get?${params}`, {
      timeout: 10000,
      headers: { 'User-Agent': 'OmniPlayerMusic/1.0 (https://omniplayermusic.app)' },
      validateStatus: (s) => s >= 200 && s < 500,
    })

    if (r.data?.syncedLyrics) {
      return NextResponse.json({
        success: true,
        data: { source: 'synced', lyrics: parseLRC(r.data.syncedLyrics) },
      })
    }

    if (r.data?.plainLyrics) {
      return NextResponse.json({
        success: true,
        data: { source: 'plain', lyrics: plainToSynced(r.data.plainLyrics, duration) },
      })
    }
  } catch (e: any) {
    console.warn('[Lyrics] Fetch failed:', e.message)
  }

  return NextResponse.json({
    success: true,
    data: { source: 'none', lyrics: [] },
  })
}
