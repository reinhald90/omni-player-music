import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'edge' // Pakai Edge biar super cepat

// GET: Ambil semua favorit user
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

  try {
    // Pastikan user ada di tabel users, kalau belum insert
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${uid}`
    if (userRes.length === 0) return NextResponse.json({ data: [] })
    
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
  const { uid, email, name, song } = await req.json()
  if (!uid || !song) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  try {
    // 1. Cek/Insert User
    let userId;
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${uid}`
    if (userRes.length === 0) {
      const newUser = await sql`
        INSERT INTO users (firebase_uid, email, name) 
        VALUES (${uid}, ${email}, ${name}) 
        RETURNING id
      `
      userId = newUser[0].id
    } else {
      userId = userRes[0].id
    }

    // 2. Insert Favorit
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
  const uid = req.nextUrl.searchParams.get('uid')
  const songId = req.nextUrl.searchParams.get('songId')
  if (!uid || !songId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${uid}`
    if (userRes.length === 0) return NextResponse.json({ success: true })
    
    await sql`
      DELETE FROM favorites WHERE user_id = ${userRes[0].id} AND song_id = ${songId}
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
