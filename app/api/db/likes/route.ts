import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  try {
    const likes = await sql`SELECT song_id, user_id FROM community_likes`
    return NextResponse.json({ success: true, data: likes })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { songId, uid } = await req.json()
  try {
    const existing = await sql`SELECT id FROM community_likes WHERE song_id = ${songId} AND user_id = ${uid}`
    if (existing.length > 0) {
      await sql`DELETE FROM community_likes WHERE song_id = ${songId} AND user_id = ${uid}`
      return NextResponse.json({ success: true, action: 'unliked' })
    } else {
      await sql`INSERT INTO community_likes (song_id, user_id) VALUES (${songId}, ${uid})`
      return NextResponse.json({ success: true, action: 'liked' })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
