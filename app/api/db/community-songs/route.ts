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

export async function GET() {
  try {
    const songs = await sql`
      SELECT id, user_id, uploader_name, title, artist, cover_url, audio_url, created_at 
      FROM community_songs ORDER BY created_at DESC
    `
    return NextResponse.json({ success: true, data: songs })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const realUid = await getVerifiedUid(req)
  if (!realUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, artist, cover_url, audio_url } = await req.json()

  if (!title || !audio_url) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  try {
    const userRes = await sql`SELECT name FROM users WHERE firebase_uid = ${realUid}`
    const realName = userRes.length > 0 ? userRes[0].name : 'User'

    const res = await sql`
      INSERT INTO community_songs (user_id, uploader_name, title, artist, cover_url, audio_url)
      VALUES (${realUid}, ${realName}, ${title}, ${artist || 'Unknown'}, ${cover_url || null}, ${audio_url})
      RETURNING id
    `

    return NextResponse.json({ success: true, id: res[0].id })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
