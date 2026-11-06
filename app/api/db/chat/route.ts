import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ==========================================
// HELPER: VERIFIKASI TOKEN FIREBASE
// ==========================================
async function getVerifiedUid(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken.uid
  } catch (error) {
    return null // Token palsu, expired, atau tidak ada
  }
}

// ==========================================
// GET: Ambil Pesan Chat & Update last_seen
// ==========================================
export async function GET(req: NextRequest) {
  try {
    // 1. Coba verifikasi token (jika user login, update last_seen)
    const realUid = await getVerifiedUid(req)
    if (realUid) {
      // Update last_seen pakai UID asli dari token, bukan dari URL
      await sql`UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE firebase_uid = ${realUid}`
    }

    // 2. Ambil pesan chat
    const messages = await sql`
      SELECT 
        c.id, c.user_id, c.user_name, c.user_avatar, c.is_verified, c.message, c.created_at,
        c.reply_to_id, c.reply_to_name, c.reply_to_message, c.media_url, c.media_type,
        u.role, u.role_color
      FROM chat_messages c
      LEFT JOIN users u ON c.user_id = u.firebase_uid
      ORDER BY c.created_at ASC 
      LIMIT 50
    `
    return NextResponse.json({ success: true, data: messages })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ==========================================
// POST: Kirim Pesan Chat Baru
// ==========================================
export async function POST(req: NextRequest) {
  try {
    // 1. WAJIB LOGIN
    const realUid = await getVerifiedUid(req)
    if (!realUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Silakan login.' }, { status: 401 })
    }

    // 2. HANYA terima isi pesan (Jangan terima uid, name, isVerified dari frontend!)
    const { 
      message, 
      replyToId, replyToName, replyToMessage, 
      mediaUrl, mediaType 
    } = await req.json()

    if (!message && !mediaUrl) {
      return NextResponse.json({ success: false, error: 'Pesan atau media tidak boleh kosong' }, { status: 400 })
    }

    // 3. Ambil identitas ASLI dari database berdasarkan token
    const userRes = await sql`
      SELECT name, avatar_url, is_verified FROM users WHERE firebase_uid = ${realUid}
    `
    
    if (userRes.length === 0) {
      return NextResponse.json({ success: false, error: 'Profil user tidak ditemukan' }, { status: 404 })
    }

    const dbUser = userRes[0]
    const realName = dbUser.name || 'User'
    const realAvatar = dbUser.avatar_url || null
    const realIsVerified = Boolean(dbUser.is_verified)

    // 4. Simpan pesan dengan identitas yang PASTI VALID
    await sql`
      INSERT INTO chat_messages (
        user_id, user_name, user_avatar, is_verified, message,
        reply_to_id, reply_to_name, reply_to_message,
        media_url, media_type
      )
      VALUES (
        ${realUid}, ${realName}, ${realAvatar}, ${realIsVerified}, ${message || ''},
        ${replyToId || null}, ${replyToName || null}, ${replyToMessage || null},
        ${mediaUrl || null}, ${mediaType || null}
      )
    `
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
