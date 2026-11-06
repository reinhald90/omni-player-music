import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'

// ⚠️ Ubah dari 'edge' ke 'nodejs' karena firebase-admin tidak jalan di edge
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

// GET: Ambil semua favorit user
export async function GET(req: NextRequest) {
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${realUid}`
    if (userRes.length === 0) return NextResponse.json({ success: true, data: [] })
    
    const userId = userRes[0].id

    const rows = await sql`
      SELECT song_data FROM favorites WHERE user_id = ${userId} ORDER BY created_at DESC
    `
    return NextResponse.json({ success: true, data: rows.map(r => r.song_data) })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Tambah favorit
export async function POST(req: NextRequest) {
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // HAPUS uid, email, name dari body!
  const { song } = await req.json()
  if (!song) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${realUid}`
    if (userRes.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const userId = userRes[0].id

    await sql`
      INSERT INTO favorites (user_id, song_id, song_data)
      VALUES (${userId}, ${song.id}, ${JSON.stringify(song)})
      ON CONFLICT (user_id, song_id) DO NOTHING
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: Hapus favorit
export async function DELETE(req: NextRequest) {
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // uid dihapus dari URL, hanya ambil songId
  const songId = req.nextUrl.searchParams.get('songId')
  if (!songId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${realUid}`
    if (userRes.length === 0) return NextResponse.json({ success: true })
    
    await sql`
      DELETE FROM favorites WHERE user_id = ${userRes[0].id} AND song_id = ${songId}
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
