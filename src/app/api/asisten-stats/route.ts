import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'
import { requireRole } from '../../../lib/apiAuth'

// GET /api/asisten-stats?id=<profiles.id> -> Statistik kartu Beranda Dashboard Asisten
// (kelompok diampu, total praktikan, pertemuan selesai, nilai belum input).
// Sumber: RPC get_asisten_dashboard_stats(uuid) di Supabase.
export async function GET(req: NextRequest) {
  // Hanya role asisten yang boleh mengakses statistik dashboard asisten
  const auth = await requireRole(req, 'asisten')
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const id = req.nextUrl.searchParams.get('id') || auth.user.id

    const sb = getSupabaseAdmin()
    const { data: rawData, error } = await sb.rpc('get_asisten_dashboard_stats', { p_asisten_id: id }).maybeSingle()
    if (error) throw error
    const data = rawData as any

    return NextResponse.json({
      ok: true,
      stats: {
        kelompokDiampu: data?.kelompok_diampu ?? 0,
        totalPraktikan: data?.total_praktikan ?? 0,
        pertemuanSelesai: data?.pertemuan_selesai ?? 0,
        pertemuanTotal: data?.pertemuan_total ?? 0,
        nilaiBelumInput: data?.nilai_belum_input ?? 0,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat statistik asisten' }, { status: 500 })
  }
}
