import { NextRequest, NextResponse } from 'next/server'
import yts from 'yt-search'
import type { Song } from '@/types'
import { authenticateRequest } from '@/lib/apiAuth'
import { rateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // 1. VALIDASI IDENTITAS (Web Token atau API Key)
  const auth = await authenticateRequest(req)
  if (!auth.isValid) {
    return NextResponse.json({ success: false, error: 'Akses Ditolak. Token atau API Key tidak valid.' }, { status: 401 })
  }

  // 2. RATE LIMIT BERDASARKAN IDENTITAS (Bukan IP)
  // Jika web, limit berdasarkan UID user. Jika bot, limit berdasarkan UID pemilik API Key.
  // Ini mencegah hacker ganti-ganti IP untuk bypass limit.
  const limitKey = auth.uid || 'unknown'
  const isAllowed = rateLimit(limitKey, 20, 60000) // 20 request per menit

  if (!isAllowed) {
    return NextResponse.json({ success: false, error: 'Terlalu banyak request. Coba lagi nanti.' }, { status: 429 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ success: false, error: 'Query kosong' }, { status: 400 })

  try {
    const search = await yts(q)
    const videos = search?.videos || []
    if (!videos.length) return NextResponse.json({ success: true, data: [] })

    const data: Song[] = videos.slice(0, 15).map((v) => ({
      id: v.videoId,
      title: v.title || 'Unknown',
      artist: v.author?.name || 'Unknown',
      duration: v.duration?.timestamp || '0:00',
      durationSec: v.duration?.seconds || 0,
      views: v.views || 0,
      thumbnail: v.thumbnail || '',
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal mencari lagu' }, { status: 500 })
  }
}
