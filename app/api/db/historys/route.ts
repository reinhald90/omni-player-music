import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

  try {
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${uid}`
    if (userRes.length === 0) return NextResponse.json({ data: [] })
    
    const rows = await sql`
      SELECT song_data, played_at FROM history 
      WHERE user_id = ${userRes[0].id} 
      ORDER BY played_at DESC LIMIT 50
    `
    
    // Format ulang agar sesuai dengan format HistoryItem di frontend
    const data = rows.map(r => ({
      ...r.song_data,
      playedAt: new Date(r.played_at).getTime()
    }))
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { uid, email, name, song } = await req.json()
  if (!uid || !song) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  try {
    let userId;
    const userRes = await sql`SELECT id FROM users WHERE firebase_uid = ${uid}`
    if (userRes.length === 0) {
      const newUser = await sql`INSERT INTO users (firebase_uid, email, name) VALUES (${uid}, ${email}, ${name}) RETURNING id`
      userId = newUser[0].id
    } else {
      userId = userRes[0].id
    }

    // Hapus history lagu ini kalau sudah ada (biar gak duplikat, pindah ke atas)
    await sql`DELETE FROM history WHERE user_id = ${userId} AND song_id = ${song.id}`

    await sql`
      INSERT INTO history (user_id, song_id, song_data)
      VALUES (${userId}, ${song.id}, ${JSON.stringify(song)})
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
