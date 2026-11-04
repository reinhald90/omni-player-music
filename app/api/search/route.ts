import { NextRequest, NextResponse } from 'next/server'
import yts from 'yt-search'
import type { Song } from '@/types'
import { validateApiKey } from '@/lib/apiAuth'
import { rateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const isAuthorized = await validateApiKey(req)
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: 'Akses Ditolak. API Key tidak valid.' }, { status: 401 })
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key')
  const limitKey = apiKey || ip
  const isAllowed = rateLimit(limitKey, 20, 60000)

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
