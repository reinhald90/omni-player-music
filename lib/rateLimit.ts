// Catatan: Ini rate limit berbasis RAM. 
// Sangat cepat, tapi akan ter-reset jika VPS di-restart atau jika pakai PM2 cluster.
const requests = new Map<string, { count: number, resetTime: number }>()

// Pembersih memori otomatis setiap 2 menit agar tidak memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) requests.delete(key)
    }
  }, 2 * 60 * 1000)
}

/**
 * @param key Identifier unik (UID, API Key, atau IP)
 * @param limit Maksimal request
 * @param windowMs Durasi dalam milidetik (default 1 menit)
 */
export function rateLimit(key: string, limit: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = requests.get(key)

  if (!record) {
    requests.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (now > record.resetTime) {
    requests.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}
