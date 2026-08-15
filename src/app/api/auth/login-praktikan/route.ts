import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

/**
 * Login khusus Praktikan memakai NIM + Password (bukan email).
 *
 * Alur:
 * 1. Cari profil dengan role='praktikan' yang nim-nya cocok.
 * 2. Ambil email milik profil tersebut.
 * 3. Login ke Supabase Auth pakai email + password yang diinput (di server).
 * 4. Kembalikan session (access_token, refresh_token) supaya browser bisa setSession().
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const nim = String(body.nim || '').trim()
    const password = String(body.password || '')

    if (!nim || !password) {
      return NextResponse.json({ error: 'NIM dan password wajib diisi.' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Cari profil praktikan berdasarkan NIM
    const { data: profileRaw, error: eFind } = await admin
      .from('profiles')
      .select('id, email, nama_lengkap, role, nim')
      .eq('role', 'praktikan')
      .eq('nim', nim)
      .maybeSingle()

    if (eFind || !profileRaw) {
      return NextResponse.json({ error: 'NIM atau password salah.' }, { status: 400 })
    }

    const profile = profileRaw as {
      id: string
      email: string | null
      nama_lengkap: string
      role: string
      nim: string | null
    }

    if (!profile.email) {
      return NextResponse.json(
        { error: 'Akun ini belum memiliki email terdaftar. Hubungi asisten.' },
        { status: 400 }
      )
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
      return NextResponse.json({ error: 'NIM atau password salah.' }, { status: 400 })
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
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan saat login.' }, { status: 500 })
  }
}
