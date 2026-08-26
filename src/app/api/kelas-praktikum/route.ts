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

    const onlyWithData = req.nextUrl.searchParams.get('onlyWithData') === 'true'

    const { data: kelas, error: eK } = await sb
      .from('kelas_praktikum')
      .select(`
        id,
        nama_kelas,
        periode_id,
        kelompok (
          id,
          anggota_kelompok (id)
        )
      `)
      .in('praktikum_id', praktikumIds)
      .order('nama_kelas', { ascending: true })
    if (eK) throw eK

    const result = (kelas || []).map((k: any) => {
      const kelompokList = k.kelompok || []
      const totalMahasiswa = kelompokList.reduce((acc: number, g: any) => acc + (g.anggota_kelompok?.length || 0), 0)
      return {
        id: k.id,
        nama_kelas: k.nama_kelas,
        periode_id: k.periode_id,
        totalKelompok: kelompokList.length,
        totalMahasiswa,
      }
    })

    const finalKelas = onlyWithData ? result.filter((k) => k.totalMahasiswa > 0) : result

    return NextResponse.json({ kelas: finalKelas })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
