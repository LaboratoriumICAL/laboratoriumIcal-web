import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

// GET /api/stats-publik -> Statistik ringkas untuk landing page (Beranda & Tentang Lab).
// Sumber: RPC get_public_stats() di Supabase (read-only, security definer).
export async function GET() {
  try {
    const sb = getSupabaseAdmin()
    const { data: rawData, error } = await sb.rpc('get_public_stats').maybeSingle()
    if (error) throw error
    const data = rawData as any

    return NextResponse.json({
      ok: true,
      stats: {
        totalPraktikan: data?.total_praktikan ?? 0,
        totalAsisten: data?.total_asisten ?? 0,
        totalJurusan: data?.total_jurusan ?? 0,
        totalModul: data?.total_modul ?? 0,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat statistik' }, { status: 500 })
  }
}
