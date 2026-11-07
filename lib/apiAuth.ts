import { sql } from '@/lib/db'
import { adminAuth } from '@/lib/firebase-admin'

export interface AuthResult {
  isValid: boolean
  uid: string | null
  type: 'web' | 'api' | 'none'
}

/**
 * Memvalidasi request secara ketat.
 * 1. Web Frontend  -> Wajib Firebase Bearer Token
 * 2. Bot / Eksternal -> Wajib API Key yang valid di database
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  // --- JALUR 1: CEK BEARER TOKEN (Web Frontend) ---
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1]
      if (adminAuth) {
        const decoded = await adminAuth.verifyIdToken(token)
        return { isValid: true, uid: decoded.uid, type: 'web' }
      }
    } catch (error) {
      // Token kedaluwarsa atau palsu, lanjut cek API Key
    }
  }

  // --- JALUR 2: CEK API KEY (Bot WhatsApp / Eksternal) ---
  const url = new URL(req.url)
  const headerKey = req.headers.get('x-api-key')
  const queryKey = url.searchParams.get('api_key')
  const apiKey = headerKey || queryKey

  if (!apiKey || !apiKey.startsWith('Opm-')) {
    return { isValid: false, uid: null, type: 'none' }
  }

  try {
    const res = await sql`
      SELECT user_id FROM api_keys WHERE api_key = ${apiKey} AND is_active = TRUE
    `
    if (res.length > 0) {
      return { isValid: true, uid: res[0].user_id, type: 'api' }
    }
  } catch (error) {
    console.error('API Key validation error:', error)
  }

  return { isValid: false, uid: null, type: 'none' }
}
