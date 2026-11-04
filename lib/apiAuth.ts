import { sql } from '@/lib/db'

export async function validateApiKey(req: Request): Promise<boolean> {
  const clientType = req.headers.get('x-opm-client')
  if (clientType === 'web') {
    return true
  }

  const url = new URL(req.url)
  const headerKey = req.headers.get('x-api-key')
  const queryKey = url.searchParams.get('api_key')
  const apiKey = headerKey || queryKey

  if (!apiKey || !apiKey.startsWith('Opm-')) {
    return false
  }

  try {
    const res = await sql`
      SELECT id FROM api_keys WHERE api_key = ${apiKey} AND is_active = TRUE
    `
    return res.length > 0
  } catch (error) {
    console.error('API Key validation error:', error)
    return false
  }
}
