import { NextRequest, NextResponse } from 'next/server'
import { fetchAudioSource } from '@/lib/downloader'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function jsonError(message: string, status: number = 500) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('q')?.trim()

    if (!query) {
      return jsonError('Parameter "q" wajib diisi', 400)
    }

    console.log(`[API Stream] Query: "${query}"`)

    const source = await fetchAudioSource(query)

    if (!source) {
      return jsonError('Semua sumber audio gagal. Coba lagu lain.', 502)
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
    console.error('[API Stream] Fatal:', error)
    return jsonError(error?.message || 'Internal error', 500)
  }
}
