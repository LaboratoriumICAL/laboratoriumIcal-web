import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  try {
    const praktikumKode = req.nextUrl.searchParams.get('praktikum')
    const kelasNama = req.nextUrl.searchParams.get('kelas')
    const jurusanKode = req.nextUrl.searchParams.get('jurusan')
    if (!praktikumKode) {
      return NextResponse.json({ error: 'Parameter praktikum wajib diisi' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // Satu kode_singkat bisa dipakai lebih dari satu jurusan (baris praktikum lebih dari satu).
    // Kalau parameter jurusan dikirim, persempit ke baris itu saja; kalau tidak, gabungkan semua.
    let praktikumQuery = sb.from('praktikum').select('id').eq('kode_singkat', praktikumKode)
    if (jurusanKode) {
      const { data: jurusanRow } = await sb.from('jurusan').select('id').eq('kode', jurusanKode).maybeSingle()
      if (!jurusanRow) return NextResponse.json({ error: 'Jurusan tidak ditemukan' }, { status: 404 })
      praktikumQuery = praktikumQuery.eq('jurusan_id', jurusanRow.id)
    }
    const { data: praktikumRows, error: eP } = await praktikumQuery
    if (eP) throw eP
    if (!praktikumRows || praktikumRows.length === 0) {
      return NextResponse.json({ error: 'Praktikum tidak ditemukan' }, { status: 404 })
    }
    const praktikumIds = praktikumRows.map((p) => p.id)

    let kelasQuery = sb.from('kelas_praktikum').select('id, nama_kelas, dosen_pengampu, id_dosen, jumlah_peserta').in('praktikum_id', praktikumIds)
    if (kelasNama) kelasQuery = kelasQuery.eq('nama_kelas', kelasNama)
    const { data: kelas } = await kelasQuery
    const kelasIds = (kelas || []).map((k) => k.id)
    if (kelasIds.length === 0) return NextResponse.json({ anggota: [], pertemuan: [], pertemuanRows: [], nilai: [], kelas: [] })

    const { data: kelompok } = await sb.from('kelompok').select('id, nama_kelompok').in('kelas_praktikum_id', kelasIds)
    const kelompokIds = (kelompok || []).map((k) => k.id)
    if (kelompokIds.length === 0) return NextResponse.json({ anggota: [], pertemuan: [], pertemuanRows: [], nilai: [], kelas: kelas || [] })

    const { data: anggota } = await sb
      .from('anggota_kelompok')
      .select('id, kelompok_id, nama_praktikan, nim, nomor_urut, kelompok:kelompok_id(id, nama_kelompok)')
      .in('kelompok_id', kelompokIds)
      .order('nim', { ascending: true })

    const kelompokMap = new Map<string, string>()
    for (const k of kelompok || []) {
      kelompokMap.set(k.id, k.nama_kelompok || '')
    }

    const anggotaMapped = (anggota || [])
      .map((a: any) => ({
        id: a.id,
        kelompok_id: a.kelompok_id,
        nama_praktikan: a.nama_praktikan,
        nim: a.nim,
        nomor_urut: a.nomor_urut,
        nama_kelompok: a.kelompok?.nama_kelompok || kelompokMap.get(a.kelompok_id) || '',
      }))
      .sort((a: any, b: any) => (a.nim || '').localeCompare(b.nim || '', undefined, { numeric: true }))

    const { data: pertemuanRows } = await sb
      .from('pertemuan')
      .select('id, kelompok_id, jenis, urutan_ke, tanggal, keterangan')
      .in('kelompok_id', kelompokIds)
      .order('urutan_ke', { ascending: true })

    const anggotaIds = (anggota || []).map((a) => a.id)
    let nilai: any[] = []
    let absensi: any[] = []
    if (anggotaIds.length > 0) {
      const { data } = await sb
        .from('nilai_komponen')
        .select('anggota_kelompok_id, pertemuan_id, kode_komponen, nilai')
        .in('anggota_kelompok_id', anggotaIds)
      nilai = data || []

      const { data: absData } = await sb
        .from('absensi')
        .select('anggota_kelompok_id, pertemuan_id, status')
        .in('anggota_kelompok_id', anggotaIds)
      absensi = absData || []
    }

    // Dedupe pertemuan by urutan_ke+jenis for display purposes
    const seen = new Map<string, { urutan_ke: number | null; jenis: string; label: string }>()
    for (const p of pertemuanRows || []) {
      const key = `${p.jenis}-${p.urutan_ke}`
      if (!seen.has(key)) {
        const fallbackLabel = p.jenis === 'pertemuan' && p.urutan_ke != null ? `Pertemuan ${p.urutan_ke}` : p.jenis === 'uap' ? 'UAP' : p.jenis
        seen.set(key, { urutan_ke: p.urutan_ke, jenis: p.jenis, label: p.keterangan || fallbackLabel })
      }
    }

    return NextResponse.json({
      anggota: anggotaMapped,
      pertemuan: Array.from(seen.values()),
      pertemuanRows: pertemuanRows || [],
      nilai,
      absensi,
      kelas: kelas || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const updates: { anggota_kelompok_id: string; pertemuan_id: string; kode_komponen: string; nilai: number | null }[] = body.updates
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates wajib berupa array dan tidak boleh kosong' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()
    const { error } = await sb
      .from('nilai_komponen')
      .upsert(
        updates.map((u) => ({ ...u, updated_at: new Date().toISOString() })),
        { onConflict: 'anggota_kelompok_id,pertemuan_id,kode_komponen' }
      )
    if (error) throw error

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
