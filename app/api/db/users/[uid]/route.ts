import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  const uid = params.uid

  try {
    // 1. Ambil data user berdasarkan firebase_uid
    const userRes = await sql`
      SELECT firebase_uid, name, email, avatar_url, cover_url, is_verified, role, created_at 
      FROM users 
      WHERE firebase_uid = ${uid}
    `

    if (userRes.length === 0) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 })
    }

    const user = userRes[0]

    // 2. Ambil lagu-lagu yang di-upload oleh user ini
    const songsRes = await sql`
      SELECT * FROM community_songs 
      WHERE user_id = ${uid} 
      ORDER BY created_at DESC
    `

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
          joinedAt: new Date(user.created_at).getTime()
        },
        songs: songsRes
      }
    })

  } catch (error: any) {
    console.error('[API Public Profile Error]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
