import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OWNER_EMAIL = 'reinhald90@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    // Proteksi: Hanya Owner yang bisa generate
    if (email !== OWNER_EMAIL) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Owner yang bisa membuat API Key.' }, { status: 403 })
    }

    // Generate API Key: "Opm-" + 32 karakter random hex
    const randomString = crypto.randomBytes(16).toString('hex')
    const apiKey = `Opm-${randomString}`

    // Simpan ke Database
    await sql`
      INSERT INTO api_keys (name, api_key)
      VALUES (${name || 'Default Key'}, ${apiKey})
    `

    return NextResponse.json({ 
      success: true, 
      message: 'API Key berhasil dibuat!',
      apiKey 
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
