import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

/**
 * Login khusus Asisten memakai NAMA LENGKAP (bukan email).
 * Alasan: akun asisten dibuatkan langsung oleh admin (nama lengkap + password),
 * sehingga asisten tidak perlu tahu/mengingat email akunnya.
 *
 * Alur:
 * 1. Cari profil dengan role='asisten' yang nama_lengkap-nya cocok (case-insensitive).
 * 2. Ambil email tersembunyi milik profil tersebut.
 * 3. Login ke Supabase Auth pakai email + password yang diinput (di server, jadi email tidak perlu diketik ulang di client).
 * 4. Kembalikan session (access_token, refresh_token) supaya browser bisa setSession().
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const namaLengkap = String(body.namaLengkap || '').trim()
    const password = String(body.password || '')

    if (!namaLengkap || !password) {
      return NextResponse.json({ error: 'Nama lengkap dan password wajib diisi.' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    const { data: matches, error: eFind } = await admin
      .from('profiles')
      .select('id, email, nama_lengkap, role, nim')
      .eq('role', 'asisten')
      .ilike('nama_lengkap', namaLengkap)

    if (eFind) throw eFind

    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: 'Nama lengkap atau password salah.' }, { status: 400 })
    }
    if (matches.length > 1) {
      return NextResponse.json(
        { error: 'Ditemukan lebih dari satu akun asisten dengan nama yang sama. Hubungi admin.' },
        { status: 400 }
      )
    }

    const profile = matches[0] as { id: string; email: string | null; nama_lengkap: string; role: string; nim: string | null }
    if (!profile.email) {
      return NextResponse.json({ error: 'Akun ini belum memiliki email terdaftar. Hubungi admin.' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Supabase belum dikonfigurasi.' }, { status: 500 })
    }

    const authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: signInData, error: eSignIn } = await authClient.auth.signInWithPassword({
      email: profile.email,
      password,
    })

    if (eSignIn || !signInData.session) {
      return NextResponse.json({ error: 'Nama lengkap atau password salah.' }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      profile: {
        id: profile.id,
        role: profile.role,
        nama_lengkap: profile.nama_lengkap,
        nim: profile.nim,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
