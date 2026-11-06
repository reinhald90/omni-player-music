import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getVerifiedUid(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    if (!adminAuth) return null
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken.uid
  } catch (error) {
    return null
  }
}

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
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // HAPUS uid, name, avatar dari body!
  const { songId, message } = await req.json()
  
  try {
    // Ambil identitas asli dari DB
    const userRes = await sql`SELECT name, avatar_url FROM users WHERE firebase_uid = ${realUid}`
    if (userRes.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    
    const dbUser = userRes[0]

    await sql`
      INSERT INTO community_comments (song_id, user_id, user_name, user_avatar, message)
      VALUES (${songId}, ${realUid}, ${dbUser.name || 'User'}, ${dbUser.avatar_url || null}, ${message})
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
