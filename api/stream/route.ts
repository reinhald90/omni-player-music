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
    console.log(`[API Stream] Fetch: ${videoUrl}`)
    const source = await fetchAudioSource(videoUrl)

    if (!source) {
      console.error('[API Stream] ❌ Semua API gagal')
      return NextResponse.json(
        {
          success: false,
          error: 'Semua API downloader gagal. Coba lagu lain atau tunggu sebentar.',
        },
        { status: 502 }
      )
    }

    console.log(`[API Stream] ✅ ${source.name}: ${source.url.slice(0, 80)}...`)

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
