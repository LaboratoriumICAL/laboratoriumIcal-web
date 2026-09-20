import { NextResponse } from 'next/server'

/**
 * Registrasi akun praktikan via form (NIM + email + password) tidak lagi tersedia.
 * Akun praktikan kini dibuat otomatis saat pertama kali login via OAuth SSO kampus
 * (Microsoft Azure AD). Tidak ada registrasi mandiri yang diperlukan.
 *
 * Endpoint ini dinonaktifkan untuk:
 * 1. Mencegah pembuatan akun duplikat di luar alur SSO.
 * 2. Mencegah eksploitasi untuk membuat akun dengan NIM orang lain.
 * 3. Memastikan seluruh onboarding praktikan melewati verifikasi identitas kampus.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Pendaftaran akun via form tidak tersedia. Akun Anda akan dibuat otomatis saat pertama kali login menggunakan "Login dengan Akun Kampus" (OAuth SSO).',
    },
    { status: 403 }
  )
}
