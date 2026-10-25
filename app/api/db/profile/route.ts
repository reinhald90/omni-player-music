import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'edge'
export const dynamic = 'force-dynamic' 

// GET: Ambil data profile (role, verified, cover)
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

  try {
    const res = await sql`
      SELECT role, is_verified, cover_url FROM users WHERE firebase_uid = ${uid}
    `
    
    if (res.length === 0) {
      return NextResponse.json({ success: true, role: 'user', is_verified: false, cover_url: null })
    }

    return NextResponse.json({ 
      success: true, 
      role: res[0].role, 
      is_verified: res[0].is_verified,
      cover_url: res[0].cover_url
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Daftarkan user ke DB jika belum ada (Upsert)
export async function POST(req: NextRequest) {
  try {
    const { uid, name, email, avatar_url } = await req.json()
    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

    // Cek apakah user sudah ada
    const existing = await sql`SELECT id FROM users WHERE firebase_uid = ${uid}`
    
    if (existing.length === 0) {
      // Jika belum ada, daftarkan
      await sql`
        INSERT INTO users (firebase_uid, name, email, avatar_url)
        VALUES (${uid}, ${name}, ${email}, ${avatar_url || null})
      `
    } else {
      // Jika sudah ada, update nama/email/avatar barunya (jaga-jaga kalau ganti nama di Google)
      await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, avatar_url = ${avatar_url || null}
        WHERE firebase_uid = ${uid}
      `
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: Update Profile (Edit Profil)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid, name, avatar_url, cover_url } = body

    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

    const payloadSize = JSON.stringify(body).length
    if (payloadSize > 4 * 1024 * 1024) { 
      return NextResponse.json({ error: 'Ukuran gambar terlalu besar.' }, { status: 413 })
    }

    await sql`
      UPDATE users 
      SET 
        name = COALESCE(${name}, name),
        avatar_url = COALESCE(${avatar_url}, avatar_url),
        cover_url = COALESCE(${cover_url}, cover_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = ${uid}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
