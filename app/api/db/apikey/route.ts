import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: Ambil semua API Key milik user
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

  try {
    const keys = await sql`
      SELECT id, name, api_key, created_at FROM api_keys 
      WHERE user_id = ${uid} ORDER BY created_at DESC
    `
    return NextResponse.json({ success: true, data: keys })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Generate API Key Baru
export async function POST(req: NextRequest) {
  try {
    const { uid, name } = await req.json()
    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

    // Cek batas maksimal (misal maksimal 3 key per user biar gak spam)
    const countRes = await sql`SELECT COUNT(*) as count FROM api_keys WHERE user_id = ${uid}`
    if (parseInt(countRes[0].count) >= 3) {
      return NextResponse.json({ error: 'Maksimal 3 API Key per akun.' }, { status: 400 })
    }

    // Generate API Key: "Opm-" + 32 karakter random
    const randomString = crypto.randomBytes(16).toString('hex')
    const apiKey = `Opm-${randomString}`

    await sql`
      INSERT INTO api_keys (user_id, name, api_key)
      VALUES (${uid}, ${name || 'My API Key'}, ${apiKey})
    `

    return NextResponse.json({ success: true, apiKey })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
