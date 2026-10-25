import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 })

  try {
    const res = await sql`
      SELECT role, is_verified FROM users WHERE firebase_uid = ${uid}
    `
    
    if (res.length === 0) {
      return NextResponse.json({ success: true, role: 'user', is_verified: false })
    }

    return NextResponse.json({ 
      success: true, 
      role: res[0].role, 
      is_verified: res[0].is_verified 
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
