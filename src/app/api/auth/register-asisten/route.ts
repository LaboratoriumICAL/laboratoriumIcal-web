import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

// Domain internal untuk email auto-generate -- tidak pernah dipakai untuk mengirim email sungguhan,
// hanya sebagai identitas unik yang dibutuhkan Supabase Auth. Asisten login pakai nama lengkap,
// jadi email ini sepenuhnya tersembunyi dari mereka.
const INTERNAL_EMAIL_DOMAIN = 'asisten.ical.internal'

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // hapus aksen/diakritik
    .replace(/[^a-z0-9\s]/g, '') // hapus karakter selain huruf/angka/spasi
    .trim()
    .replace(/\s+/g, '.') // spasi -> titik, mis. "Budi Santoso" -> "budi.santoso"
}

/**
 * Cari email internal yang belum dipakai untuk nama ini.
 * Kalau "budi.santoso@..." sudah dipakai (nama sama persis), coba tambah angka
 * di belakang: "budi.santoso2@...", "budi.santoso3@...", dst.
 */
async function generateUniqueInternalEmail(sb: ReturnType<typeof getSupabaseAdmin>, name: string) {
  const base = slugifyName(name) || 'asisten'
  let candidate = `${base}@${INTERNAL_EMAIL_DOMAIN}`
  let suffix = 2

  // Batasi percobaan supaya tidak infinite loop kalau ada hal aneh.
  for (let i = 0; i < 50; i++) {
    const { data: existing } = await sb.from('profiles').select('id').eq('email', candidate).limit(1)
    if (!existing || existing.length === 0) return candidate
    candidate = `${base}${suffix}@${INTERNAL_EMAIL_DOMAIN}`
    suffix += 1
  }

  // Fallback terakhir: tempel angka random supaya pasti unik.
  return `${base}${Date.now()}@${INTERNAL_EMAIL_DOMAIN}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body.name || '').trim()
    const password = String(body.password || '')
    const accessCode = String(body.accessCode || '')

    if (!name || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 })
    }

    const expectedCode = process.env.ASISTEN_SIGNUP_CODE
    if (expectedCode && accessCode !== expectedCode) {
      return NextResponse.json({ error: 'Kode akses asisten salah.' }, { status: 403 })
    }

    const sb = getSupabaseAdmin()

    const email = await generateUniqueInternalEmail(sb, name)

    const { data: created, error: eCreate } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'asisten', nama_lengkap: name },
    })
    if (eCreate) {
      return NextResponse.json({ error: eCreate.message || 'Gagal membuat akun.' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, userId: created.user?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
