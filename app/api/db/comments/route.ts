import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const songId = req.nextUrl.searchParams.get('songId')
  if (!songId) return NextResponse.json({ success: false }, { status: 400 })
  try {
    const comments = await sql`SELECT * FROM community_comments WHERE song_id = ${songId} ORDER BY created_at DESC`
    return NextResponse.json({ success: true, data: comments })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { songId, uid, name, avatar, message } = await req.json()
  try {
    await sql`
      INSERT INTO community_comments (song_id, user_id, user_name, user_avatar, message)
      VALUES (${songId}, ${uid}, ${name}, ${avatar || null}, ${message})
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
