import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/apiAuth'
import { rateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PRIMARY_API = 'https://api.ikyyxd.my.id/search/ytplayv2'
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

export async function GET(req: NextRequest) {
  console.log('[API Stream] Menerima request...')

  // 1. CEK API KEY / BYPASS
  const isAuthorized = await validateApiKey(req)
  if (!isAuthorized) {
    console.warn('[API Stream] ❌ Akses ditolak: API Key tidak valid.')
    return NextResponse.json({ success: false, error: 'Akses Ditolak. API Key tidak valid.' }, { status: 401 })
  }

  // 2. CEK RATE LIMIT
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key')
  const limitKey = apiKey || ip
  
  const isAllowed = rateLimit(limitKey, 30, 60000)
  if (!isAllowed) {
    console.warn('[API Stream] ❌ Rate limit tercapai.')
    return NextResponse.json({ success: false, error: 'Terlalu banyak request. Coba lagi nanti.' }, { status: 429 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ success: false, error: 'Query kosong' }, { status: 400 })

  try {
    let data = null
    let errorMsg = ''

    console.log(`[API Stream] Mencari lagu: ${q}`)

    // Coba Direct (Pakai fetch bawaan Node.js)
    try {
      const res = await fetch(`${PRIMARY_API}?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const json = await res.json()
        if (json?.status && json?.result?.audio?.url) {
          data = json
          console.log('[API Stream] ✅ Direct API berhasil.')
        } else {
          errorMsg += 'Direct: Respon tidak valid. '
          console.warn('[API Stream] ⚠️ Direct API merespon tapi data tidak valid:', JSON.stringify(json).slice(0, 200))
        }
      } else {
        errorMsg += `Direct: HTTP ${res.status}. `
        console.warn(`[API Stream] ⚠️ Direct API gagal dengan status: ${res.status}`)
      }
    } catch (e: any) {
      errorMsg += `Direct: ${e.message}. `
      console.warn('[API Stream] ⚠️ Direct API error:', e.message)
    }

    // Coba Proxy kalau direct gagal
    if (!data) {
      try {
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${PRIMARY_API}?q=${encodeURIComponent(q)}`)}`
        const res2 = await fetch(proxyUrl)
        if (res2.ok) {
          const json2 = await res2.json()
          if (json2?.status && json2?.result?.audio?.url) {
            data = json2
            console.log('[API Stream] ✅ Proxy API berhasil.')
          } else {
            errorMsg += 'Proxy: Respon tidak valid. '
          }
        } else {
          errorMsg += `Proxy: HTTP ${res2.status}. `
        }
      } catch (e: any) {
        errorMsg += `Proxy: ${e.message}. `
        console.warn('[API Stream] ⚠️ Proxy API error:', e.message)
      }
    }

    if (!data) {
      console.error('[API Stream] ❌ Gagal total:', errorMsg)
      return NextResponse.json({ success: false, error: `API Error: ${errorMsg}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { audioUrl: data.result.audio.url, provider: 'ikyyxd' }
    })
  } catch (error: any) {
    console.error('[API Stream] ❌ Fatal error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
