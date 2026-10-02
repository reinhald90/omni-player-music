import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return new Response('Missing "url" parameter', { status: 400 })
  }

  try {
    // Forward Range header (untuk seek/skip)
    const range = req.headers.get('range')

    const upstream = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: '*/*',
        ...(range ? { Range: range } : {}),
      },
    })

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`Upstream error ${upstream.status}`, {
        status: upstream.status,
      })
    }

    const headers = new Headers()
    headers.set('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg')
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Range')
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges')
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=3600')

    const len = upstream.headers.get('content-length')
    if (len) headers.set('Content-Length', len)

    const cr = upstream.headers.get('content-range')
    if (cr) headers.set('Content-Range', cr)

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    })
  } catch (e: any) {
    return new Response(`Proxy error: ${e.message}`, { status: 502 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
    },
  })
}
