import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Daftar model valid sesuai katalog Relay (codex-relay.codes)
const ALLOWED_MODELS = new Set([
  'gpt-6.1-sol',
  'claude-opus-5-5',
  'gemini-3.8-flash',
])

const DEFAULT_MODEL = 'gpt-6.1-sol'

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Format pesan tidak valid' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = (process.env.OPENAI_BASE_URL || 'https://codex-relay.codes/v1').replace(/\/$/, '')

    // Validasi model: jika tidak ada / tidak dikenal → pakai default
    const selectedModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key belum diatur di server' }, { status: 500 })
    }

    console.log(`[AI] Request ke model: ${selectedModel} via ${baseUrl}`)

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `Kamu adalah **Omni AI**, asisten kecerdasan buatan resmi dari platform **Omni Player Music** (omniplayermusic.web.id).

Tugasmu adalah membantu pengguna dengan ramah, cerdas, dan profesional menggunakan Bahasa Indonesia.

**Pengetahuan tentang Web Omni Player Music:**
- Web ini adalah pemutar musik modern berbasis browser.
- Fitur utamanya: Cari lagu YouTube, Lirik Sinkron, Visualizer, Favorit, Playlist, Riwayat.
- Ada fitur komunitas: Upload lagu sendiri (format MP3 + Cover), halaman Eksplorasi, dan Reels.
- Ada fitur sosial: Chat Global, Papan Peringkat, dan Custom Profil (Border Studio & Bio HTML).
- Pengguna bisa login menggunakan Google atau Email (via Firebase).
- Semua data pengguna disimpan dengan aman (Neon Postgres Database).
- Developer API tersedia untuk membuat bot WhatsApp.

**Aturan Menjawab:**
1. Gunakan format Markdown yang rapi (Tebal, List, Heading).
2. Jika ditanya tentang coding, berikan blok kode yang rapi beserta penjelasan singkat.
3. Jangan pernah mengarang fitur yang tidak ada di web ini.
4. Jawab dengan sopan sebagai asisten AI pintar.`,
          },
          ...messages,
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Relay Error]', response.status, errorText)

      let friendly = `Server AI Error (${response.status})`
      try {
        const parsed = JSON.parse(errorText)
        const code = parsed?.error?.code
        if (code === 'model_not_found') {
          friendly = 'Model AI yang dipilih tidak tersedia. Coba pilih model lain.'
        } else if (code === 'rate_limited' || code === 'rate_limit_exceeded') {
          friendly = 'Server AI sedang sibuk. Coba lagi sebentar.'
        } else if (code === 'concurrency_limit_exceeded') {
          friendly = 'Terlalu banyak permintaan sekaligus. Tunggu sebentar.'
        } else if (parsed?.error?.message) {
          friendly = parsed.error.message
        }
      } catch {
        friendly = `Server AI Error (${response.status}): ${errorText.slice(0, 120)}`
      }

      return NextResponse.json({ error: friendly }, { status: response.status })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Maaf, aku tidak bisa menjawab itu.'
    const usedModel = data.model || selectedModel

    return NextResponse.json({ success: true, reply, model: usedModel })

  } catch (error: any) {
    console.error('[AI Route Error]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
