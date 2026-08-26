import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { createClient } from '@supabase/supabase-js'

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return email
  if (user.length <= 2) {
    return `${user[0]}***@${domain}`
  }
  const visibleLength = Math.min(3, Math.floor(user.length / 2))
  const visibleStart = user.slice(0, visibleLength)
  return `${visibleStart}${'*'.repeat(Math.max(3, user.length - visibleLength))}@${domain}`
}

// POST /api/auth/forgot-password
// Body: { identifier: string, origin?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const identifier = String(body.identifier || '').trim()
    const reqOrigin = String(body.origin || '').trim() || req.nextUrl.origin

    if (!identifier) {
      return NextResponse.json(
        { ok: false, error: 'Silakan masukkan NIM atau Alamat Email Anda.' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const isEmail = identifier.includes('@')

    let targetEmail = ''
    let studentName = ''
    let studentNim = ''

    if (isEmail) {
      // Cari profil berdasarkan Email
      const { data: profile, error: eProfile } = await admin
        .from('profiles')
        .select('id, email, nama_lengkap, role, nim')
        .eq('email', identifier.toLowerCase())
        .maybeSingle()

      if (eProfile || !profile) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Alamat email ini tidak terdaftar pada sistem praktikum ICAL.',
          },
          { status: 404 }
        )
      }

      targetEmail = profile.email || identifier.toLowerCase()
      studentName = profile.nama_lengkap || ''
      studentNim = profile.nim || ''
    } else {
      // Cari profil berdasarkan NIM
      const { data: profile, error: eProfile } = await admin
        .from('profiles')
        .select('id, email, nama_lengkap, role, nim')
        .eq('nim', identifier)
        .maybeSingle()

      if (eProfile || !profile) {
        // Cek apakah NIM ada di anggota_kelompok tapi belum buat akun
        const { data: anggota } = await admin
          .from('anggota_kelompok')
          .select('nama_praktikan')
          .eq('nim', identifier)
          .limit(1)

        if (anggota && anggota.length > 0) {
          return NextResponse.json(
            {
              ok: false,
              error: `NIM ${identifier} (${anggota[0].nama_praktikan}) belum memiliki akun. Silakan lakukan "Daftar Akun Praktikan" terlebih dahulu.`,
            },
            { status: 400 }
          )
        }

        return NextResponse.json(
          {
            ok: false,
            error: `NIM ${identifier} tidak ditemukan pada sistem. Pastikan Anda memasukkan NIM dengan benar.`,
          },
          { status: 404 }
        )
      }

      if (!profile.email) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Akun dengan NIM ini belum memiliki email terdaftar. Silakan hubungi asisten lab.',
          },
          { status: 400 }
        )
      }

      targetEmail = profile.email
      studentName = profile.nama_lengkap || ''
      studentNim = profile.nim || identifier
    }

    // Buat client auth publik untuk memicu resetPasswordForEmail
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) {
      return NextResponse.json(
        { ok: false, error: 'Konfigurasi Supabase belum lengkap di server.' },
        { status: 500 }
      )
    }

    const authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const redirectTo = `${reqOrigin}/reset-password`

    const { error: resetError } = await authClient.auth.resetPasswordForEmail(targetEmail, {
      redirectTo,
    })

    if (resetError) {
      if (resetError.message?.toLowerCase().includes('rate limit')) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Batas pengiriman email sedang penuh. Silakan coba lagi beberapa saat atau hubungi asisten laboratorium.',
          },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { ok: false, error: resetError.message || 'Gagal mengirim email reset password.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        maskedEmail: maskEmail(targetEmail),
        name: studentName,
        nim: studentNim,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}
