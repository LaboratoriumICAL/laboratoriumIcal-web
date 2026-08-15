import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

// GET /api/student/info?nim=2022110001
export async function GET(req: NextRequest) {
  try {
    const nim = req.nextUrl.searchParams.get('nim')
    if (!nim) {
      return NextResponse.json({ error: 'NIM wajib diisi' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // 1. Cari data anggota kelompok berdasarkan NIM
    const { data: anggotaList, error: eAnggota } = await sb
      .from('anggota_kelompok')
      .select(`
        id,
        nama_praktikan,
        nim,
        kelompok_id,
        kelompok:kelompok_id (
          id,
          nama_kelompok,
          shift,
          hari,
          jam_mulai,
          jam_selesai,
          ruangan,
          asisten:asisten_id (
            nama_lengkap
          ),
          kelas_praktikum:kelas_praktikum_id (
            id,
            nama_kelas,
            praktikum:praktikum_id (
              id,
              kode_singkat,
              nama,
              jurusan:jurusan_id (
                id,
                kode,
                nama
              )
            )
          )
        )
      `)
      .eq('nim', nim)

    if (eAnggota) throw eAnggota

    if (!anggotaList || anggotaList.length === 0) {
      return NextResponse.json({
        ok: true,
        registered: false,
        message: 'NIM belum terdaftar pada kelompok praktikum manapun.',
        praktikumList: [],
      })
    }

    // Map info per praktikum yang diikuti praktikan
    const praktikumList = await Promise.all(
      anggotaList.map(async (item: any) => {
        const k = item.kelompok
        const kp = k?.kelas_praktikum
        const p = kp?.praktikum
        const j = p?.jurusan

        // Ambil daftar pertemuan untuk kelompok ini
        let meetings: any[] = []
        if (k?.id) {
          const { data: pertemuanData } = await sb
            .from('pertemuan')
            .select('id, urutan_ke, jenis, keterangan, tanggal')
            .eq('kelompok_id', k.id)
            .order('urutan_ke', { ascending: true })

          meetings = (pertemuanData || []).map((m: any) => ({
            id: m.id,
            label: m.keterangan || (m.jenis === 'uap' ? 'UAP' : m.jenis === 'pengarahan' ? 'Pengarahan' : `Pertemuan ${m.urutan_ke}`),
            date: m.tanggal ? new Date(m.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : 'Jadwal belum ditentukan',
            tanggalRaw: m.tanggal || null,
            jenis: m.jenis,
            urutan_ke: m.urutan_ke,
          }))
        }

        return {
          anggotaId: item.id,
          nama: item.nama_praktikan,
          nim: item.nim,
          kelompokId: k?.id,
          namaKelompok: k?.nama_kelompok || '-',
          shift: k?.shift ? `Shift ${k.shift}` : 'Shift 1',
          asisten: k?.asisten?.nama_lengkap || 'Asisten Praktikum',
          namaKelas: kp?.nama_kelas || '-',
          hari: k?.hari || '-',
          jamMulai: k?.jam_mulai ? String(k.jam_mulai).slice(0, 5) : '-',
          jamSelesai: k?.jam_selesai ? String(k.jam_selesai).slice(0, 5) : '-',
          ruangan: k?.ruangan || 'Laboratorium ICAL',
          praktikumKode: p?.kode_singkat || '-',
          praktikumNama: p?.nama || '-',
          jurusanNama: j?.nama || '-',
          jurusanKode: j?.kode || '-',
          meetings,
        }
      })
    )

    return NextResponse.json({
      ok: true,
      registered: true,
      primaryInfo: praktikumList[0] || null,
      praktikumList,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat data praktikan' }, { status: 500 })
  }
}
