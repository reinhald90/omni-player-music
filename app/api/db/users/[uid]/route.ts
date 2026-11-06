import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> | { uid: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const uid = resolvedParams.uid

    if (!uid) {
      return NextResponse.json({ success: false, error: 'UID tidak valid' }, { status: 400 })
    }

    const userRes = await sql`
      SELECT firebase_uid, name, email, avatar_url, cover_url, bio, is_verified, role, role_color, created_at, border_style, layout_theme,
             avatar_scale, avatar_x, avatar_y, avatar_start_time, avatar_end_time,
             cover_scale, cover_x, cover_y, cover_start_time, cover_end_time
      FROM users WHERE firebase_uid = ${uid}
    `
    if (userRes.length === 0) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 })
    }

    const user = userRes[0]
    const songsRes = await sql`SELECT * FROM community_songs WHERE user_id = ${uid} ORDER BY created_at DESC`

    return NextResponse.json(
      { 
        success: true, 
        data: {
          user: {
            id: user.firebase_uid,
            name: user.name || 'User',
            email: user.email || '',
            avatar: user.avatar_url || null,
            coverUrl: user.cover_url || null,
            bio: user.bio || '',
            borderStyle: user.border_style || '',
            layoutTheme: user.layout_theme || 'default',
            avatarScale: Number(user.avatar_scale ?? 1),
            avatarX: Number(user.avatar_x ?? 0),
            avatarY: Number(user.avatar_y ?? 0),
            avatarStart: Number(user.avatar_start_time ?? 0),
            avatarEnd: Number(user.avatar_end_time ?? 10),
            coverScale: Number(user.cover_scale ?? 1),
            coverX: Number(user.cover_x ?? 0),
            coverY: Number(user.cover_y ?? 0),
            coverStart: Number(user.cover_start_time ?? 0),
            coverEnd: Number(user.cover_end_time ?? 10),
            isVerified: Boolean(user.is_verified),
            role: user.role || 'user',
            roleColor: user.role_color || (user.role === 'owner' ? '#f59e0b' : '#ffffff'),
            joinedAt: user.created_at ? new Date(user.created_at).getTime() : Date.now()
          },
          songs: songsRes
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
