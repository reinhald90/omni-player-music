import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    return null // Token tidak valid, palsu, atau expired
  }
}

// ==========================================
// GET: Ambil Data Profil Sendiri
// ==========================================
export async function GET(req: NextRequest) {
  try {
    // 1. Ambil UID dari Token (Bukan dari URL)
    const realUid = await getVerifiedUid(req)
    
    // Jika tidak ada token / token invalid, tolak!
    if (!realUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Token tidak valid.' }, { status: 401 })
    }

    // 2. Query database menggunakan UID yang sudah terverifikasi
    const res = await sql`
      SELECT id_number, username, name, email, avatar_url, role, role_color, is_verified, cover_url, bio, border_style, layout_theme,
             avatar_scale, avatar_x, avatar_y, avatar_start_time, avatar_end_time,
             cover_scale, cover_x, cover_y, cover_start_time, cover_end_time, created_at
      FROM users WHERE firebase_uid = ${realUid}
    `
    
    if (res.length === 0) {
      return NextResponse.json({ success: true, exists: false, role: 'user', is_verified: false, cover_url: null })
    }

    const u = res[0]
    return NextResponse.json(
      { 
        success: true,
        exists: true,
        id_number: u.id_number ? Number(u.id_number) : null,
        idNumber: u.id_number ? Number(u.id_number) : null,
        username: u.username || '',
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url,
        role: u.role || 'user',
        role_color: u.role_color || (u.role === 'owner' ? '#f59e0b' : '#ffffff'),
        is_verified: Boolean(u.is_verified),
        cover_url: u.cover_url,
        bio: u.bio || '',
        border_style: u.border_style || '',
        layout_theme: u.layout_theme || 'default',
        avatar_scale: Number(u.avatar_scale ?? 1),
        avatar_x: Number(u.avatar_x ?? 0),
        avatar_y: Number(u.avatar_y ?? 0),
        avatar_start_time: Number(u.avatar_start_time ?? 0),
        avatar_end_time: Number(u.avatar_end_time ?? 10),
        cover_scale: Number(u.cover_scale ?? 1),
        cover_x: Number(u.cover_x ?? 0),
        cover_y: Number(u.cover_y ?? 0),
        cover_start_time: Number(u.cover_start_time ?? 0),
        cover_end_time: Number(u.cover_end_time ?? 10),
        joined_at: u.created_at ? new Date(u.created_at).getTime() : Date.now()
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ==========================================
// POST: Daftarkan User Baru (Jika Belum Ada)
// ==========================================
export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi Token
    const realUid = await getVerifiedUid(req)
    if (!realUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Ambil data (Hanya name, email, avatar. TIDAK ADA uid di sini)
    const { name, email, avatar_url } = await req.json()

    const existing = await sql`SELECT id, name, avatar_url, id_number FROM users WHERE firebase_uid = ${realUid}`
    
    if (existing.length === 0) {
      // Generate ID Number (mulai dari 11)
      const maxRes = await sql`SELECT GREATEST(COALESCE(MAX(id_number), 10), 10) + 1 AS next_id FROM users`
      const nextId = maxRes[0]?.next_id || 11

      await sql`
        INSERT INTO users (firebase_uid, id_number, name, email, avatar_url, last_login, login_count) 
        VALUES (${realUid}, ${nextId}, ${name || 'User'}, ${email || ''}, ${avatar_url || null}, CURRENT_TIMESTAMP, 1)
      `
    } else {
      // Update minor (login count & last login)
      await sql`
        UPDATE users 
        SET 
          name = COALESCE(NULLIF(name, ''), ${name || 'User'}),
          email = COALESCE(${email || null}, email),
          avatar_url = COALESCE(NULLIF(avatar_url, ''), ${avatar_url || null}),
          last_login = CURRENT_TIMESTAMP, 
          login_count = COALESCE(login_count, 0) + 1 
        WHERE firebase_uid = ${realUid}
      `
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ==========================================
// PUT: Update Profil (Nama, Bio, Tema, dll)
// ==========================================
export async function PUT(req: NextRequest) {
  try {
    // 1. Verifikasi Token
    const realUid = await getVerifiedUid(req)
    if (!realUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Ambil data (TIDAK ADA uid di body)
    const body = await req.json()

    const name = body.name !== undefined ? body.name : null
    const email = body.email !== undefined ? body.email : null
    const username = body.username !== undefined ? String(body.username).toLowerCase().replace(/[^a-z0-9_]/g, '') : null
    const avatar_url = body.avatar_url !== undefined ? body.avatar_url : null
    const cover_url = body.cover_url !== undefined ? body.cover_url : null
    const bio = body.bio !== undefined ? body.bio : null
    const border_style = body.border_style !== undefined ? body.border_style : null
    const layout_theme = body.layout_theme !== undefined ? body.layout_theme : null

    const avatar_scale = body.avatar_scale !== undefined ? Number(body.avatar_scale) : null
    const avatar_x = body.avatar_x !== undefined ? Number(body.avatar_x) : null
    const avatar_y = body.avatar_y !== undefined ? Number(body.avatar_y) : null
    const avatar_start_time = body.avatar_start_time !== undefined ? Number(body.avatar_start_time) : null
    const avatar_end_time = body.avatar_end_time !== undefined ? Number(body.avatar_end_time) : null

    const cover_scale = body.cover_scale !== undefined ? Number(body.cover_scale) : null
    const cover_x = body.cover_x !== undefined ? Number(body.cover_x) : null
    const cover_y = body.cover_y !== undefined ? Number(body.cover_y) : null
    const cover_start_time = body.cover_start_time !== undefined ? Number(body.cover_start_time) : null
    const cover_end_time = body.cover_end_time !== undefined ? Number(body.cover_end_time) : null

    // Cek apakah username sudah dipakai orang lain (Kecuali diri sendiri)
    if (username) {
      const taken = await sql`SELECT firebase_uid FROM users WHERE LOWER(username) = ${username} AND firebase_uid != ${realUid}`
      if (taken.length > 0) {
        return NextResponse.json({ success: false, error: 'Username sudah dipakai pengguna lain!' }, { status: 400 })
      }
    }

    // Pastikan user ada di DB sebelum update
    const existing = await sql`SELECT id FROM users WHERE firebase_uid = ${realUid}`
    if (existing.length === 0) {
      const maxRes = await sql`SELECT GREATEST(COALESCE(MAX(id_number), 10), 10) + 1 AS next_id FROM users`
      const nextId = maxRes[0]?.next_id || 11
      await sql`
        INSERT INTO users (firebase_uid, id_number, name, email, avatar_url, last_login, login_count)
        VALUES (${realUid}, ${nextId}, ${name || 'User'}, ${email || ''}, ${avatar_url}, CURRENT_TIMESTAMP, 1)
      `
    }

    await sql`
      UPDATE users 
      SET 
        name = COALESCE(${name}, name),
        username = COALESCE(NULLIF(${username}, ''), username),
        avatar_url = COALESCE(${avatar_url}, avatar_url),
        cover_url = COALESCE(${cover_url}, cover_url),
        bio = COALESCE(${bio}, bio),
        border_style = COALESCE(${border_style}, border_style),
        layout_theme = COALESCE(${layout_theme}, layout_theme),
        avatar_scale = COALESCE(${avatar_scale}, avatar_scale),
        avatar_x = COALESCE(${avatar_x}, avatar_x),
        avatar_y = COALESCE(${avatar_y}, avatar_y),
        avatar_start_time = COALESCE(${avatar_start_time}, avatar_start_time),
        avatar_end_time = COALESCE(${avatar_end_time}, avatar_end_time),
        cover_scale = COALESCE(${cover_scale}, cover_scale),
        cover_x = COALESCE(${cover_x}, cover_x),
        cover_y = COALESCE(${cover_y}, cover_y),
        cover_start_time = COALESCE(${cover_start_time}, cover_start_time),
        cover_end_time = COALESCE(${cover_end_time}, cover_end_time)
      WHERE firebase_uid = ${realUid}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT /api/db/profile error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
