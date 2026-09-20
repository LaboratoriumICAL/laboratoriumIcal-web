import { NextRequest, NextResponse } from 'next/server'
import { generateQrAttendToken } from '../../../../lib/qrAttendance'
import { requireAuth } from '../../../../lib/apiAuth'

// Dipanggil untuk mengambil kode QR absensi baru yang ditandatangani server & kadaluarsa dalam hitungan detik.
// Asisten: dapat membuat QR untuk NIM manapun.
// Praktikan: hanya dapat membuat QR untuk NIM miliknya sendiri (ownership check).
export async function GET(req: NextRequest) {
  // Wajib login: endpoint ini memerlukan sesi aktif
  const auth = await requireAuth(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const nim = req.nextUrl.searchParams.get('nim')
    if (!nim || !/^\d{3,20}$/.test(nim.trim())) {
      return NextResponse.json({ error: 'NIM tidak valid' }, { status: 400 })
    }

    const trimmedNim = nim.trim()

    // Praktikan hanya boleh membuat QR untuk NIM miliknya sendiri
    if (auth.profile.role === 'praktikan') {
      if (!auth.profile.nim || auth.profile.nim !== trimmedNim) {
        return NextResponse.json(
          { error: 'Forbidden: Anda hanya dapat membuat QR absensi untuk NIM Anda sendiri.' },
          { status: 403 }
        )
      }
    }

    const token = generateQrAttendToken(trimmedNim)
    return NextResponse.json({ payload: token.payload, exp: token.exp, ttlMs: token.ttlMs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat QR absensi' }, { status: 500 })
  }
}
