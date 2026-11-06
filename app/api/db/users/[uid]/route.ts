import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper cek token (tidak wajib login untuk lihat profil)
async function getOptionalUid(req: NextRequest): Promise<string | null> {
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> | { uid: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const identifier = resolvedParams.uid?.trim()

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Identifier tidak valid' }, { status: 400 })
    }

    // Cek apakah yang request adalah pemilik profil
    const requesterUid = await getOptionalUid(req)
    const isNumeric = /^\d+$/.test(identifier)

    let userRes
    if (isNumeric) {
      const numericId = parseInt(identifier, 10)
      userRes = await sql`
        SELECT firebase_uid, id_number, username, name, email, avatar_url, cover_url, bio, is_verified, role, role_color, created_at, border_style, layout_theme,
               avatar_scale, avatar_x, avatar_y, avatar_start_time, avatar_end_time,
               cover_scale, cover_x, cover_y, cover_start_time, cover_end_time
        FROM users WHERE id_number = ${numericId}
      `
    } else {
      userRes = await sql`
        SELECT firebase_uid, id_number, username, name, email, avatar_url, cover_url, bio, is_verified, role, role_color, created_at, border_style, layout_theme,
               avatar_scale, avatar_x, avatar_y, avatar_start_time, avatar_end_time,
               cover_scale, cover_x, cover_y, cover_start_time, cover_end_time
        FROM users WHERE username ILIKE ${identifier} OR firebase_uid = ${identifier}
      `
    }

    if (userRes.length === 0) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 })
    }

    const user = userRes[0]
    const targetFirebaseUid = user.firebase_uid
    const isOwner = requesterUid === targetFirebaseUid

    // Jangan pakai SELECT * agar kolom sensitif tidak bocor
    const songsRes = await sql`
      SELECT id, user_id, uploader_name, title, artist, cover_url, audio_url, created_at 
      FROM community_songs WHERE user_id = ${targetFirebaseUid} ORDER BY created_at DESC
    `

    return NextResponse.json(
      { 
        success: true, 
        data: {
          user: {
            id: user.firebase_uid,
            idNumber: user.id_number || null,
            username: user.username || null,
            name: user.name || 'User',
            // 🛡️ SEMBUNYIKAN EMAIL DARI PUBLIK
            email: isOwner ? user.email : '', 
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
