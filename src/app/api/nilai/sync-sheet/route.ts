import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { requireRole } from '../../../../lib/apiAuth'
import { petakanKeSheet, kirimKeSheet } from '../../../../lib/sheetSync'

export async function POST(req: NextRequest) {
  // Hanya role asisten yang boleh melakukan sinkronisasi massal ke sheet
  const auth = await requireRole(req, 'asisten')
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const praktikumKode = body.praktikum
    const jurusanKode = body.jurusan
    const kelasPraktikumId = body.kelas_praktikum_id
    const kelasNama = body.kelas
    const offset = typeof body.offset === 'number' && body.offset >= 0 ? body.offset : 0
    const limit = typeof body.limit === 'number' && body.limit > 0 ? body.limit : 25

    if (!praktikumKode) {
      return NextResponse.json({ error: 'Parameter praktikum wajib diisi' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // 1. Tentukan praktikumIds (mengikuti pola cakupan GET /api/nilai)
    let praktikumQuery = sb.from('praktikum').select('id').eq('kode_singkat', praktikumKode)
    if (jurusanKode) {
      const { data: jurusanRow } = await sb.from('jurusan').select('id').eq('kode', jurusanKode).maybeSingle()
      if (!jurusanRow) {
        return NextResponse.json({ error: 'Jurusan tidak ditemukan' }, { status: 404 })
      }
      praktikumQuery = praktikumQuery.eq('jurusan_id', jurusanRow.id)
    }

    const { data: praktikumRows, error: eP } = await praktikumQuery
    if (eP) throw eP
    if (!praktikumRows || praktikumRows.length === 0) {
      return NextResponse.json({ error: 'Praktikum tidak ditemukan' }, { status: 404 })
    }
    const praktikumIds = praktikumRows.map((p) => p.id)

    // 2. Tentukan kelasIds
    let kelasQuery = sb.from('kelas_praktikum').select('id').in('praktikum_id', praktikumIds)
    if (kelasPraktikumId) {
      kelasQuery = kelasQuery.eq('id', kelasPraktikumId)
    } else if (kelasNama) {
      kelasQuery = kelasQuery.eq('nama_kelas', kelasNama)
    }

    const { data: kelas, error: eK } = await kelasQuery
    if (eK) throw eK
    const kelasIds = (kelas || []).map((k) => k.id)
    if (kelasIds.length === 0) {
      return NextResponse.json({ total: 0, diproses: 0, selesai: true, gagal: [] })
    }

    // 3. Tentukan kelompokIds
    const { data: kelompok, error: eKel } = await sb
      .from('kelompok')
      .select('id')
      .in('kelas_praktikum_id', kelasIds)
    if (eKel) throw eKel
    const kelompokIds = (kelompok || []).map((k) => k.id)
    if (kelompokIds.length === 0) {
      return NextResponse.json({ total: 0, diproses: 0, selesai: true, gagal: [] })
    }

    // 4. Tentukan anggotaIds
    const { data: anggota, error: eAng } = await sb
      .from('anggota_kelompok')
      .select('id')
      .in('kelompok_id', kelompokIds)
    if (eAng) throw eAng
    const anggotaIds = (anggota || []).map((a) => a.id)
    if (anggotaIds.length === 0) {
      return NextResponse.json({ total: 0, diproses: 0, selesai: true, gagal: [] })
    }

    // 5. Ambil irisan nilai_komponen [offset, offset + limit), KECUALI KEHADIRAN dan KECUALI nilai null
    const { data: sliceRows, count, error: eNilai } = await sb
      .from('nilai_komponen')
      .select('id, anggota_kelompok_id, pertemuan_id, kode_komponen, nomor_modul, nilai', { count: 'exact' })
      .in('anggota_kelompok_id', anggotaIds)
      .neq('kode_komponen', 'KEHADIRAN')
      .not('nilai', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1)

    if (eNilai) throw eNilai

    const total = count ?? 0
    const diproses = sliceRows?.length ?? 0
    const selesai = offset + diproses >= total || diproses === 0

    if (diproses === 0) {
      return NextResponse.json({ total, diproses: 0, selesai: true, gagal: [] })
    }

    // 6. Kirim lewat sheetSync
    const sheetUpdates = await petakanKeSheet(sliceRows || [])
    const syncRes = await kirimKeSheet(sheetUpdates)

    return NextResponse.json({
      total,
      diproses,
      selesai,
      gagal: syncRes.gagal || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
