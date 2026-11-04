import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  try {
    // Update last_seen user yang lagi buka chat
    if (uid) {
      await sql`UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE firebase_uid = ${uid}`
    }

    // Ambil chat beserta role dan warna user
    const messages = await sql`
      SELECT 
        c.id, c.user_id, c.user_name, c.user_avatar, c.is_verified, c.message, c.created_at,
        u.role, u.role_color
      FROM chat_messages c
      LEFT JOIN users u ON c.user_id = u.firebase_uid
      ORDER BY c.created_at ASC 
      LIMIT 50
    `
    return NextResponse.json({ success: true, data: messages })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid, name, avatar, isVerified, message } = await req.json()
    if (!uid || !message || message.trim() === '') return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })

    await sql`
      INSERT INTO chat_messages (user_id, user_name, user_avatar, is_verified, message)
      VALUES (${uid}, ${name}, ${avatar || null}, ${isVerified || false}, ${message.trim()})
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
