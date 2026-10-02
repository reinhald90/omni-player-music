import { NextRequest, NextResponse } from 'next/server'
import { fetchAudioSource } from '@/lib/downloader'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Parameter "q" (query) wajib diisi' },
      { status: 400 }
    )
  }

  try {
    console.log(`[API Stream] Menerima query: "${query}"`)
    const source = await fetchAudioSource(query)

    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Gagal mendapatkan sumber audio dari API' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        title: source.title,
        thumbnail: source.thumbnail,
        duration: source.duration,
        source: source.source,
        audioUrl: source.audioUrl,
        provider: source.provider,
      },
    })
  } catch (error: any) {
    console.error('[API Stream] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan internal' },
      { status: 500 }
    )
  }
}
