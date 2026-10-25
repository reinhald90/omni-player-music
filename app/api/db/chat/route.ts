import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// GET: Ambil 50 pesan terakhir
export async function GET() {
  try {
    const messages = await sql`
      SELECT * FROM chat_messages 
      ORDER BY created_at DESC 
      LIMIT 50
    `
    // Balikin urutannya (lama ke baru) biar pas di-render dari atas ke bawah
    return NextResponse.json({ success: true, data: messages.reverse() })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Kirim pesan baru
export async function POST(req: NextRequest) {
  try {
    const { uid, name, avatar, isVerified, message } = await req.json()

    if (!uid || !message || message.trim() === '') {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    if (message.length > 250) {
      return NextResponse.json({ error: 'Pesan maksimal 250 karakter' }, { status: 400 })
    }

    await sql`
      INSERT INTO chat_messages (user_id, user_name, user_avatar, is_verified, message)
      VALUES (${uid}, ${name}, ${avatar || null}, ${isVerified || false}, ${message.trim()})
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
