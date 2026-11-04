import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = params.uid
  try {
    const userRes = await sql`
      SELECT firebase_uid, name, email, avatar_url, cover_url, is_verified, role, role_color, created_at 
      FROM users WHERE firebase_uid = ${uid}
    `
    if (userRes.length === 0) return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 })

    const user = userRes[0]
    const songsRes = await sql`SELECT * FROM community_songs WHERE user_id = ${uid} ORDER BY created_at DESC`

    return NextResponse.json({ 
      success: true, 
      data: {
        user: {
          id: user.firebase_uid,
          name: user.name,
          email: user.email,
          avatar: user.avatar_url,
          coverUrl: user.cover_url,
          isVerified: user.is_verified,
          role: user.role,
          roleColor: user.role_color,
          joinedAt: new Date(user.created_at).getTime()
        },
        songs: songsRes
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
