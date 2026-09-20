import { NextRequest } from 'next/server'

interface RateLimitConfig {
  key: string
  max: number
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetMs: number
}

// In-memory store berbasis Map: key="${prefix}:${ip}" -> array timestamp [ms, ms, ...]
const rateLimitMap = new Map<string, number[]>()

/**
 * Mengambil alamat IP pengirim dari header x-forwarded-for (standar Vercel/proxy)
 * dengan fallback ke x-real-ip atau localhost.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    // Ambil IP pertama jika terdapat chain proxy
    return forwarded.split(',')[0].trim()
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

/**
 * Mengecek dan mencatat request ke rate limiter in-memory.
 * Mengembalikan success: false jika jumlah request dalam windowMs sudah mencapai max.
 */
export function checkRateLimit(req: NextRequest, { key, max, windowMs }: RateLimitConfig): RateLimitResult {
  const ip = getClientIp(req)
  const mapKey = `${key}:${ip}`
  const now = Date.now()
  const windowStart = now - windowMs

  let timestamps = rateLimitMap.get(mapKey) || []
  // Bersihkan timestamp yang sudah berada di luar window waktu
  timestamps = timestamps.filter((t) => t > windowStart)

  if (timestamps.length >= max) {
    const oldest = timestamps[0]
    const resetMs = Math.max(0, oldest + windowMs - now)
    rateLimitMap.set(mapKey, timestamps)
    return { success: false, remaining: 0, resetMs }
  }

  // Tambahkan timestamp saat ini
  timestamps.push(now)
  rateLimitMap.set(mapKey, timestamps)

  // Pembersihan berkala jika cache in-memory terlalu besar (mencegah memory leak)
  if (rateLimitMap.size > 5000) {
    for (const [k, v] of rateLimitMap.entries()) {
      const active = v.filter((t) => t > windowStart)
      if (active.length === 0) rateLimitMap.delete(k)
      else rateLimitMap.set(k, active)
    }
  }

  return {
    success: true,
    remaining: Math.max(0, max - timestamps.length),
    resetMs: windowMs,
  }
}

/**
 * Mengecek apakah IP saat ini sedang terblokir karena melebihi batas percobaan (misal gagal login).
 * Fungsi ini HANYA mengecek tanpa menambah hitungan.
 */
export function isRateLimited(req: NextRequest, { key, max, windowMs }: RateLimitConfig): boolean {
  const ip = getClientIp(req)
  const mapKey = `${key}:${ip}`
  const now = Date.now()
  const windowStart = now - windowMs

  const timestamps = (rateLimitMap.get(mapKey) || []).filter((t) => t > windowStart)
  rateLimitMap.set(mapKey, timestamps)

  return timestamps.length >= max
}

/**
 * Mencatat satu kali kegagalan/kejadian untuk IP saat ini.
 */
export function recordRateLimitHit(req: NextRequest, key: string) {
  const ip = getClientIp(req)
  const mapKey = `${key}:${ip}`
  const now = Date.now()

  const timestamps = rateLimitMap.get(mapKey) || []
  timestamps.push(now)
  rateLimitMap.set(mapKey, timestamps)
}

/**
 * Mereset hitungan untuk IP saat ini (misalnya setelah login berhasil).
 */
export function resetRateLimit(req: NextRequest, key: string) {
  const ip = getClientIp(req)
  const mapKey = `${key}:${ip}`
  rateLimitMap.delete(mapKey)
}
