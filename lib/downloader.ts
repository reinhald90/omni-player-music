import axios from 'axios'

const PRIMARY_API = 'https://api.ikyyxd.my.id/search/ytplayv2'

export interface AudioSource {
  provider: string
  title: string
  thumbnail: string
  duration: number
  source: string
  audioUrl: string
}

/**
 * Ambil sumber audio dari API iKyyXD.
 * @param query Judul lagu atau URL YouTube
 */
export async function fetchAudioSource(query: string): Promise<AudioSource | null> {
  const url = `${PRIMARY_API}?q=${encodeURIComponent(query)}`
  console.log(`[Downloader] 🔍 Request ke iKyyXD: ${url}`)

  try {
    const t0 = Date.now()
    const res = await axios.get(url, {
      timeout: 30000, // 30 detik
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    const data = res.data
    const ms = Date.now() - t0

    // Validasi response
    if (!data || data.status !== true || !data.result?.audio?.url) {
      console.error(`[Downloader] ❌ Response tidak valid:`, JSON.stringify(data).slice(0, 200))
      return null
    }

    const resData = data.result

    console.log(`[Downloader] ✅ Sukses (${ms}ms): ${resData.title}`)

    return {
      provider: 'ikyyxd',
      title: resData.title || query,
      thumbnail: resData.thumbnail || '',
      duration: resData.duration || 0,
      source: resData.source || '',
      audioUrl: resData.audio.url,
    }
  } catch (error: any) {
    console.error(`[Downloader] ❌ Gagal request:`, error.message)
    return null
  }
}
