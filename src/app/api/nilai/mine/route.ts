import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

const VISIBLE_KOMPONEN = ['TR', 'TA', 'P'] // sesuai kebijakan: praktikan tidak melihat komponen Laporan (LP)

export async function GET(req: NextRequest) {
  try {
    const nim = req.nextUrl.searchParams.get('nim')
    const praktikumKode = req.nextUrl.searchParams.get('praktikum')
    if (!nim) return NextResponse.json({ error: 'Parameter nim wajib diisi' }, { status: 400 })

    const sb = getSupabaseAdmin()

    let anggotaQuery = sb.from('anggota_kelompok').select('id, kelompok_id, nim').eq('nim', nim)
    const { data: anggotaRows, error: eA } = await anggotaQuery
    if (eA) throw eA
    if (!anggotaRows || anggotaRows.length === 0) return NextResponse.json({ pertemuan: [], nilai: [] })

    let anggota = anggotaRows[0]
    if (praktikumKode && anggotaRows.length > 1) {
      const { data: kelompokRows } = await sb.from('kelompok').select('id, kelas_praktikum_id').in('id', anggotaRows.map((a) => a.kelompok_id))
      const { data: kelasRows } = await sb.from('kelas_praktikum').select('id, praktikum_id').in('id', (kelompokRows || []).map((k) => k.kelas_praktikum_id))
      const { data: praktikum } = await sb.from('praktikum').select('id').eq('kode_singkat', praktikumKode).single()
      const kelasIdToPraktikum = new Map((kelasRows || []).map((k) => [k.id, k.praktikum_id]))
      const kelompokIdToKelas = new Map((kelompokRows || []).map((k) => [k.id, k.kelas_praktikum_id]))
      const match = anggotaRows.find((a) => {
        const kelasId = kelompokIdToKelas.get(a.kelompok_id)
        const pId = kelasId ? kelasIdToPraktikum.get(kelasId) : undefined
        return praktikum && pId === praktikum.id
      })
      if (match) anggota = match
    }

    const { data: pertemuanRows } = await sb
      .from('pertemuan')
      .select('id, urutan_ke, jenis, keterangan')
      .eq('kelompok_id', anggota.kelompok_id)
      .order('urutan_ke', { ascending: true })

    const { data: nilaiRows } = await sb
      .from('nilai_komponen')
      .select('pertemuan_id, kode_komponen, nilai')
      .eq('anggota_kelompok_id', anggota.id)
      .in('kode_komponen', VISIBLE_KOMPONEN)

    return NextResponse.json({
      pertemuan: (pertemuanRows || []).map((p) => {
        const fallbackLabel = p.jenis === 'pertemuan' && p.urutan_ke != null ? `Pertemuan ${p.urutan_ke}` : p.jenis === 'uap' ? 'UAP' : p.jenis
        return { id: p.id, urutan_ke: p.urutan_ke, jenis: p.jenis, label: p.keterangan || fallbackLabel }
      }),
      nilai: nilaiRows || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
