import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'edge'

// GET: Ambil semua lagu komunitas (untuk Halaman Explore nanti)
export async function GET() {
  try {
    const songs = await sql`
      SELECT * FROM community_songs ORDER BY created_at DESC
    `
    return NextResponse.json({ success: true, data: songs })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Simpan metadata lagu baru setelah upload ke Firebase selesai
export async function POST(req: NextRequest) {
  try {
    const { uid, uploader_name, title, artist, cover_url, audio_url } = await req.json()

    if (!uid || !title || !audio_url) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const res = await sql`
      INSERT INTO community_songs (user_id, uploader_name, title, artist, cover_url, audio_url)
      VALUES (${uid}, ${uploader_name}, ${title}, ${artist || 'Unknown'}, ${cover_url || null}, ${audio_url})
      RETURNING id
    `

    return NextResponse.json({ success: true, id: res[0].id })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
