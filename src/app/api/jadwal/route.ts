import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  try {
    const praktikumKode = req.nextUrl.searchParams.get('praktikum')
    const kelasNama = req.nextUrl.searchParams.get('kelas')
    const jurusanKode = req.nextUrl.searchParams.get('jurusan')
    if (!praktikumKode || !kelasNama) {
      return NextResponse.json({ error: 'Parameter praktikum dan kelas wajib diisi' }, { status: 400 })
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

    const { data: periode } = await sb
      .from('periode_akademik')
      .select('id')
      .eq('is_active', true)
      .order('tanggal_mulai', { ascending: false, nullsFirst: false })
      .limit(1)
      .single()

    let kelasQuery = sb.from('kelas_praktikum').select('id').in('praktikum_id', praktikumIds).eq('nama_kelas', kelasNama)
    if (periode) kelasQuery = kelasQuery.eq('periode_id', periode.id)
    const { data: kelas } = await kelasQuery.maybeSingle()

    if (!kelas) {
      return NextResponse.json({ groups: [], scheduleDates: [] })
    }

    const { data: kelompokRows, error: eK } = await sb
      .from('kelompok')
      .select('id, nama_kelompok, shift, hari, jam_mulai, jam_selesai, ruangan, asisten:asisten_id(nama_lengkap)')
      .eq('kelas_praktikum_id', kelas.id)
      .order('nama_kelompok')
    if (eK) throw eK

    const kelompokIds = (kelompokRows || []).map((k) => k.id)

    const { data: anggotaRows } = kelompokIds.length
      ? await sb.from('anggota_kelompok').select('kelompok_id, nama_praktikan, nim, nomor_urut, praktikan_id').in('kelompok_id', kelompokIds).order('nomor_urut')
      : { data: [] as any[] }

    const { data: pertemuanRows } = kelompokIds.length
      ? await sb.from('pertemuan').select('kelompok_id, jenis, urutan_ke, tanggal, keterangan').in('kelompok_id', kelompokIds).order('urutan_ke')
      : { data: [] as any[] }

    const groups = (kelompokRows || []).map((k: any) => ({
      id: k.nama_kelompok,
      shift: k.shift ? Number(k.shift) : null,
      assistant: k.asisten?.nama_lengkap || 'Belum ditentukan',
      hari: k.hari,
      jamMulai: k.jam_mulai,
      jamSelesai: k.jam_selesai,
      ruangan: k.ruangan,
      members: (anggotaRows || [])
        .filter((a) => a.kelompok_id === k.id)
        .map((a) => ({ name: a.nama_praktikan, nim: a.nim, hasAccount: !!a.praktikan_id })),
    }))

    // Gabungkan tanggal pertemuan unik lintas kelompok (semua kelompok di kelas yg sama biasanya sejadwal sama)
    const dateMap = new Map<string, { label: string; date: string }>()
    for (const p of pertemuanRows || []) {
      const label = p.keterangan || (p.jenis === 'pengarahan' ? 'Pengarahan' : p.jenis === 'uap' ? 'UAP' : `Pertemuan ${p.urutan_ke}`)
      const key = `${p.urutan_ke}-${label}`
      if (!dateMap.has(key)) {
        dateMap.set(key, {
          label,
          date: new Date(p.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
        })
      }
    }

    return NextResponse.json({ groups, scheduleDates: Array.from(dateMap.values()) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
