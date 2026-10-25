import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'edge'
// 🔥 Mematikan cache agar update langsung terlihat
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
    console.error('[GET Profile Error]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: Update Profile (Nama, Avatar, Cover)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid, name, avatar_url, cover_url } = body

    if (!uid) {
      return NextResponse.json({ error: 'UID required' }, { status: 400 })
    }

    // 🔥 Cek ukuran payload (Base64 bisa sangat besar)
    const payloadSize = JSON.stringify(body).length
    if (payloadSize > 4 * 1024 * 1024) { // Limit 4MB
      return NextResponse.json({ 
        error: 'Ukuran gambar terlalu besar. Gunakan gambar di bawah 3MB.' 
      }, { status: 413 })
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
    console.error('[PUT Profile Error]', error)
    // Kirim pesan error yang lebih informatif
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Terjadi kesalahan pada server' 
    }, { status: 500 })
  }
}
