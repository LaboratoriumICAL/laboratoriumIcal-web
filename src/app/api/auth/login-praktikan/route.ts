import { NextResponse } from 'next/server'

/**
 * Login praktikan via NIM + password tidak lagi tersedia.
 * Autentikasi praktikan kini dilakukan via OAuth SSO kampus (Microsoft Azure AD)
 * langsung dari sisi client tanpa melalui endpoint ini.
 *
 * Endpoint ini dinonaktifkan untuk mencegah akses langsung yang melewati
 * alur SSO resmi. Kembalikan 403 secara eksplisit agar client lama yang
 * masih memanggil endpoint ini menerima pesan yang jelas.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'Login via NIM/password tidak tersedia. Silakan gunakan tombol "Login dengan Akun Kampus" (OAuth SSO) untuk masuk.',
    },
    { status: 403 }
  )
}
