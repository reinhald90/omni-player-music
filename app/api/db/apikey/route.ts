import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'
import crypto from 'crypto'

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
// GET: Ambil semua API Key milik user
// ==========================================
export async function GET(req: NextRequest) {
  try {
    // 1. Verifikasi Token (BUKAN dari query parameter)
    const realUid = await getVerifiedUid(req)
    if (!realUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Query database menggunakan UID terverifikasi
    const keys = await sql`
      SELECT id, name, api_key, created_at FROM api_keys 
      WHERE user_id = ${realUid} ORDER BY created_at DESC
    `
    return NextResponse.json({ success: true, data: keys })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ==========================================
// POST: Generate API Key Baru
// ==========================================
export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi Token
    const realUid = await getVerifiedUid(req)
    if (!realUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Ambil name dari body (TIDAK ADA uid)
    const { name } = await req.json()

    // 3. Cek batas maksimal (maksimal 3 key per user)
    const countRes = await sql`SELECT COUNT(*) as count FROM api_keys WHERE user_id = ${realUid}`
    if (parseInt(countRes[0].count) >= 3) {
      return NextResponse.json({ success: false, error: 'Maksimal 3 API Key per akun.' }, { status: 400 })
    }

    // 4. Generate API Key: "Opm-" + 32 karakter random
    const randomString = crypto.randomBytes(16).toString('hex')
    const apiKey = `Opm-${randomString}`

    // 5. Insert ke DB pakai realUid
    await sql`
      INSERT INTO api_keys (user_id, name, api_key)
      VALUES (${realUid}, ${name || 'My API Key'}, ${apiKey})
    `

    return NextResponse.json({ success: true, apiKey })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
