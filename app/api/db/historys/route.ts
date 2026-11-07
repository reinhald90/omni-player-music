import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'

// ⚠️ Wajib 'nodejs' untuk verifikasi firebase-admin
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
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${realUid}`
    if (userRes.length === 0) return NextResponse.json({ success: true, data: [] })
    
    const rows = await sql`
      SELECT song_data, played_at FROM history 
      WHERE user_id = ${userRes[0].id} 
      ORDER BY played_at DESC LIMIT 50
    `
    
    const data = rows.map(r => ({
      ...r.song_data,
      playedAt: new Date(r.played_at).getTime()
    }))
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { song } = await req.json() // Hapus uid, email, name
  if (!song) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${realUid}`
    if (userRes.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const userId = userRes[0].id

    await sql`DELETE FROM history WHERE user_id = ${userId} AND song_id = ${song.id}`
    await sql`INSERT INTO history (user_id, song_id, song_data) VALUES (${userId}, ${song.id}, ${JSON.stringify(song)})`
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
