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

// GET: Ambil semua likes (Public)
export async function GET(req: NextRequest) {
  try {
    const likes = await sql`SELECT song_id, user_id FROM community_likes`
    return NextResponse.json({ success: true, data: likes })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Toggle Like (Wajib Login)
export async function POST(req: NextRequest) {
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // HAPUS uid dari body, hanya ambil songId
  const { songId } = await req.json()
  if (!songId) return NextResponse.json({ error: 'Missing songId' }, { status: 400 })

  try {
    const existing = await sql`SELECT id FROM community_likes WHERE song_id = ${songId} AND user_id = ${realUid}`
    if (existing.length > 0) {
      // Jika sudah like, maka unlike
      await sql`DELETE FROM community_likes WHERE song_id = ${songId} AND user_id = ${realUid}`
      return NextResponse.json({ success: true, action: 'unliked' })
    } else {
      // Jika belum, maka like
      await sql`INSERT INTO community_likes (song_id, user_id) VALUES (${songId}, ${realUid})`
      return NextResponse.json({ success: true, action: 'liked' })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
