import { NextRequest, NextResponse } from 'next/server'
import { generateQrAttendToken } from '../../../../lib/qrAttendance'

// Dipanggil berulang oleh halaman "QR Absensi" praktikan (tiap ~30 detik) untuk
// mengambil kode baru yang ditandatangani server & kadaluarsa dalam hitungan detik.
export async function GET(req: NextRequest) {
  try {
    const nim = req.nextUrl.searchParams.get('nim')
    if (!nim || !/^\d{3,20}$/.test(nim.trim())) {
      return NextResponse.json({ error: 'NIM tidak valid' }, { status: 400 })
    }

    const token = generateQrAttendToken(nim)
    return NextResponse.json({ payload: token.payload, exp: token.exp, ttlMs: token.ttlMs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat QR absensi' }, { status: 500 })
  }
}
