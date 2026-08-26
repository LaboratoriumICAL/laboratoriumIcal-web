import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

// GET /api/stats-publik -> Statistik ringkas untuk landing page (Beranda & Tentang Lab).
// Opsi 2: totalPraktikan menghitung seluruh mahasiswa aktif yang terdaftar di praktikum (hasil import Excel / anggota_kelompok).
export async function GET() {
  try {
    const sb = getSupabaseAdmin()
    const [rpcRes, anggotaRes] = await Promise.all([
      sb.rpc('get_public_stats').maybeSingle(),
      sb.from('anggota_kelompok').select('nim'),
    ])

    const rpcData = rpcRes.data as any
    const anggotaRows = (anggotaRes.data as { nim: string }[] | null) || []
    const distinctNims = new Set(anggotaRows.map((a) => a.nim).filter(Boolean))
    const totalPraktikanImport = distinctNims.size

    return NextResponse.json({
      ok: true,
      stats: {
        // Menggunakan jumlah praktikan riil dari hasil import Excel jika ada, fallback ke data akun / 200
        totalPraktikan: totalPraktikanImport > 0 ? totalPraktikanImport : (rpcData?.total_praktikan ?? 200),
        totalAsisten: rpcData?.total_asisten ?? 10,
        totalJurusan: rpcData?.total_jurusan ?? 4,
        totalModul: (rpcData?.total_modul && rpcData.total_modul > 0) ? rpcData.total_modul : 3,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat statistik' }, { status: 500 })
  }
}
