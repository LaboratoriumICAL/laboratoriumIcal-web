import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  try {
    const praktikumKode = req.nextUrl.searchParams.get('praktikum')
    const jurusanKode = req.nextUrl.searchParams.get('jurusan')
    if (!praktikumKode) {
      return NextResponse.json({ error: 'Parameter praktikum wajib diisi' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // Satu kode_singkat (mis. "DSK") bisa dipakai lebih dari satu jurusan, jadi baris
    // praktikum-nya bisa lebih dari satu. Kalau parameter jurusan dikirim, persempit ke
    // baris itu saja. Kalau tidak, gabungkan kelas dari semua jurusan yang punya kode itu.
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

    const { data: kelas, error: eK } = await sb
      .from('kelas_praktikum')
      .select('id, nama_kelas, periode_id')
      .in('praktikum_id', praktikumIds)
      .order('nama_kelas', { ascending: true })
    if (eK) throw eK

    return NextResponse.json({ kelas: kelas || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
