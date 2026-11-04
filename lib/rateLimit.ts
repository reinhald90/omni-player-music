const requests = new Map<string, { count: number, resetTime: number }>()

export function rateLimit(ip: string, limit: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = requests.get(ip)

  if (requests.size > 10000) {
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) requests.delete(key)
    }
  }

  if (!record) {
    requests.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (now > record.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}
