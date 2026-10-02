import { NextRequest, NextResponse } from 'next/server'
import { fetchAudioSource } from '@/lib/downloader'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const videoUrl = req.nextUrl.searchParams.get('url')?.trim()

  if (!videoUrl) {
    return NextResponse.json({ success: false, error: 'URL kosong' }, { status: 400 })
  }

  try {
    const source = await fetchAudioSource(videoUrl)
    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Semua API downloader gagal' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: source.name,
        audioUrl: source.url,
      },
    })
  } catch (error: any) {
    console.error('[API Stream]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal ambil audio' },
      { status: 500 }
    )
  }
}
