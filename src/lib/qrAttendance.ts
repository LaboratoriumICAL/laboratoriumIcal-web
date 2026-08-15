import crypto from 'crypto'

/**
 * QR Absensi berputar: server yang membuat DAN memvalidasi kode, bukan client.
 *
 * Format payload (persis 4 bagian dipisah ':'):
 *   ICAL-ATTEND:<nim>:<exp>:<sig>
 *
 * - exp   = unix epoch detik saat kode ini kadaluarsa.
 * - sig   = HMAC-SHA256(secret, "<nim>:<exp>") dalam hex (24 karakter pertama),
 *           jadi client (browser praktikan) TIDAK PERNAH memegang secret-nya --
 *           kode hanya bisa dibuat lewat endpoint /api/absensi/qr-token di server.
 *
 * Kenapa ini mencegah titip-absen via screenshot lama:
 * - Kode kadaluarsa dalam hitungan detik (lihat TOKEN_TTL_SECONDS) dan halaman
 *   praktikan otomatis meminta kode baru sebelum kode lama habis masa berlaku.
 * - Screenshot QR lama akan berisi payload dengan `exp` yang sudah lewat -> saat
 *   di-scan asisten, /api/absensi menolaknya di server (bukan hanya di UI).
 * - `sig` mengikat nim & exp jadi satu; nilai exp tidak bisa "diperpanjang" oleh
 *   siapa pun yang tidak tahu secret, dan sig tidak bisa dipakai ulang untuk exp lain.
 */

const PREFIX = 'ICAL-ATTEND'
const TOKEN_TTL_SECONDS = 35 // client regenerasi tiap 30 detik; 5 detik toleransi jeda jaringan
const SIG_HEX_LENGTH = 24

function getSecret(): string {
  // QR_ATTEND_SECRET idealnya diisi sendiri di .env.local. SUPABASE_SERVICE_ROLE_KEY
  // dipakai sebagai fallback supaya tetap jalan di deployment yang belum diisi,
  // tapi sebaiknya set QR_ATTEND_SECRET terpisah di production.
  const secret = process.env.QR_ATTEND_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error(
      'QR_ATTEND_SECRET (atau SUPABASE_SERVICE_ROLE_KEY sebagai fallback) belum diatur di .env.local'
    )
  }
  return secret
}

function sign(nim: string, exp: number): string {
  return crypto.createHmac('sha256', getSecret()).update(`${nim}:${exp}`).digest('hex').slice(0, SIG_HEX_LENGTH)
}

export interface QrAttendToken {
  payload: string
  nim: string
  exp: number
  ttlMs: number
}

/** Dipanggil HANYA dari API route (server) -- lihat /api/absensi/qr-token. */
export function generateQrAttendToken(nimRaw: string): QrAttendToken {
  const nim = nimRaw.trim()
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  const sig = sign(nim, exp)
  return {
    payload: `${PREFIX}:${nim}:${exp}:${sig}`,
    nim,
    exp,
    ttlMs: exp * 1000 - Date.now(),
  }
}

export type QrAttendVerifyResult =
  | { valid: true; nim: string }
  | { valid: false; reason: 'format' | 'expired' | 'signature' }

/**
 * Validasi KETAT hasil scan. Menolak apa pun yang bukan diawali persis "ICAL-ATTEND:"
 * dengan struktur & tanda tangan yang benar -- BUKAN cuma "ada deretan angka di suatu
 * tempat pada teks" (celah lama: regex /(\d{5,})/ menerima QR/nomor apa saja).
 */
export function verifyQrAttendToken(raw: unknown): QrAttendVerifyResult {
  if (typeof raw !== 'string') return { valid: false, reason: 'format' }
  const text = raw.trim()

  if (!text.startsWith(`${PREFIX}:`)) return { valid: false, reason: 'format' }

  const parts = text.split(':')
  if (parts.length !== 4) return { valid: false, reason: 'format' }
  const [, nim, expStr, sig] = parts

  if (!/^\d{3,20}$/.test(nim)) return { valid: false, reason: 'format' }
  if (!/^\d+$/.test(expStr)) return { valid: false, reason: 'format' }
  if (!new RegExp(`^[0-9a-f]{${SIG_HEX_LENGTH}}$`, 'i').test(sig)) return { valid: false, reason: 'format' }

  const exp = Number(expStr)
  if (!Number.isFinite(exp)) return { valid: false, reason: 'format' }

  const expected = sign(nim, exp)
  const sigBuf = Buffer.from(sig.toLowerCase(), 'hex')
  const expectedBuf = Buffer.from(expected.toLowerCase(), 'hex')
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, reason: 'signature' }
  }

  if (Date.now() > exp * 1000) return { valid: false, reason: 'expired' }

  return { valid: true, nim }
}
