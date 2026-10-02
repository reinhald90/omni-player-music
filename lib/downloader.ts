import axios from 'axios'

interface AudioSource {
  name: string
  url: string
  duration?: number
}

const YTMP3_APIS = [
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
  {
    name: 'zenkey',
    build: (u: string) => `https://api.zenkey.my.id/download/ytmp3?url=${encodeURIComponent(u)}`,
    parse: (d: any) => d?.result?.download || d?.result?.url,
  },
  {
    name: 'skizo',
    build: (u: string) => `https://skizo.tech/api/ytmp3?url=${encodeURIComponent(u)}&apikey=free`,
    parse: (d: any) => d?.result?.download || d?.result?.url || d?.url,
  },
  {
    name: 'vreden',
    build: (u: string) => `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(u)}`,
    parse: (d: any) => d?.result?.download?.url || d?.result?.url,
  },
]

export async function fetchAudioSource(videoUrl: string): Promise<AudioSource | null> {
  console.log(`[Downloader] 🔍 Mencoba ${YTMP3_APIS.length} API...`)

  const results = await Promise.allSettled(
    YTMP3_APIS.map(async (api) => {
      const t0 = Date.now()
      try {
        const res = await axios.get(api.build(videoUrl), {
          timeout: 20000,
          validateStatus: (s) => s >= 200 && s < 500,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        })
        const url = api.parse(res.data)
        if (url && typeof url === 'string' && url.startsWith('http')) {
          const ms = Date.now() - t0
          console.log(`[Downloader] ✅ ${api.name} (${ms}ms)`)
          return { name: api.name, url, ms }
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
    name: valid[0].name,
    url: valid[0].url,
  }
}
