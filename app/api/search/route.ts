import { NextRequest, NextResponse } from 'next/server'
import yts from 'yt-search'
import type { Song } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ success: false, error: 'Query kosong' }, { status: 400 })
  }

  try {
    const search = await yts(q)
    const videos = search?.videos || []

    if (!videos.length) {
      return NextResponse.json({ success: true, data: [] })
    }

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
    console.error('[API Search]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mencari' },
      { status: 500 }
    )
  }
}
