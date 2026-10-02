import axios from 'axios'

const PRIMARY_API = 'https://api.ikyyxd.my.id/search/ytplayv2'

const FALLBACK_APIS = [
  {
    name: 'azbry',
    build: (u: string) => `https://api.azbry.com/api/download/ytmp3?url=${encodeURIComponent(u)}`,
    parse: (d: any) => d?.result?.download || d?.result?.url || d?.download || d?.url,
  },
  {
    name: 'nyxs',
    build: (u: string) => `https://api.nyxs.pw/dl/ytmp3?url=${encodeURIComponent(u)}`,
    parse: (d: any) => d?.result?.download || d?.result?.url,
  },
  {
    name: 'botcahx',
    build: (u: string) => `https://api.botcahx.eu.org/api/dowloader/ytmp3?url=${encodeURIComponent(u)}`,
    parse: (d: any) => d?.result?.mp3 || d?.result?.download || d?.result?.url,
  },
  {
    name: 'itzpire',
    build: (u: string) => `https://itzpire.com/download/youtube/mp3?url=${encodeURIComponent(u)}`,
    parse: (d: any) => d?.data?.download || d?.data?.url || d?.result?.download,
  },
]

export interface AudioSource {
  provider: string
  title: string
  thumbnail: string
  duration: number
  source: string
  audioUrl: string
}

async function tryIkyyxd(query: string): Promise<AudioSource | null> {
  console.log(`[Downloader] 🎯 Primary: iKyyXD`)
  try {
    const t0 = Date.now()
    const res = await axios.get(`${PRIMARY_API}?q=${encodeURIComponent(query)}`, {
      timeout: 45000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    })

    const data = res.data
    const ms = Date.now() - t0

    if (!data || data.status !== true || !data.result?.audio?.url) {
      console.error(`[Downloader] ❌ iKyyXD invalid response (${ms}ms)`)
      return null
    }

    console.log(`[Downloader] ✅ iKyyXD (${ms}ms): ${data.result.title}`)

    return {
      provider: 'ikyyxd',
      title: data.result.title || query,
      thumbnail: data.result.thumbnail || '',
      duration: data.result.duration || 0,
      source: data.result.source || '',
      audioUrl: data.result.audio.url,
    }
  } catch (e: any) {
    console.error(`[Downloader] ❌ iKyyXD error: ${e.message}`)
    return null
  }
}

async function tryFallback(query: string): Promise<AudioSource | null> {
  console.log(`[Downloader] 🔄 Fallback: ${FALLBACK_APIS.length} API`)

  const videoUrl = query.startsWith('http')
    ? query
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`

  const results = await Promise.allSettled(
    FALLBACK_APIS.map(async (api) => {
      const t0 = Date.now()
      try {
        const res = await axios.get(api.build(videoUrl), {
          timeout: 20000,
          validateStatus: (s) => s >= 200 && s < 500,
          headers: { 'User-Agent': 'Mozilla/5.0' },
        })
        const url = api.parse(res.data)
        if (url && typeof url === 'string' && url.startsWith('http')) {
          return { name: api.name, url, ms: Date.now() - t0 }
        }
        return null
      } catch {
        return null
      }
    })
  )

  const valid = results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r: any) => r.value)
    .sort((a: any, b: any) => a.ms - b.ms)

  if (!valid.length) return null

  return {
    provider: valid[0].name,
    title: query,
    thumbnail: '',
    duration: 0,
    source: videoUrl,
    audioUrl: valid[0].url,
  }
}

export async function fetchAudioSource(query: string): Promise<AudioSource | null> {
  // Coba primary dulu
  const primary = await tryIkyyxd(query)
  if (primary) return primary

  // Fallback
  console.log(`[Downloader] ⚠️ Primary gagal, coba fallback...`)
  const fallback = await tryFallback(query)
  if (fallback) return fallback

  return null
}
