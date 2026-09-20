import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { requireAuth } from '../../../../lib/apiAuth'

// GET /api/student/info -> Ambil info praktikum milik pengguna yang sedang login
export async function GET(req: NextRequest) {
  // Wajib login: verifikasi token pengguna
  const auth = await requireAuth(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const sb = getSupabaseAdmin()
    const user = auth.user
    const profile = auth.profile

    // 1. Cari data anggota kelompok milik user yang login (cocokkan praktikan_id dengan user.id, atau fallback nim)
    let anggotaQuery = sb
      .from('anggota_kelompok')
      .select(`
        id,
        nama_praktikan,
        nim,
        praktikan_id,
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

    if (profile.nim) {
      anggotaQuery = anggotaQuery.or(`praktikan_id.eq.${user.id},nim.eq.${profile.nim}`)
    } else {
      anggotaQuery = anggotaQuery.eq('praktikan_id', user.id)
    }

    const { data: anggotaList, error: eAnggota } = await anggotaQuery

    if (eAnggota) throw eAnggota

    // Sinkronisasi praktikan_id jika ada baris yang belum tertaut
    if (anggotaList && anggotaList.length > 0) {
      for (const item of anggotaList) {
        if (!item.praktikan_id) {
          await sb.from('anggota_kelompok').update({ praktikan_id: user.id }).eq('id', item.id)
        }
      }
    }

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

function formatIndoDateStr(dateStr: string): string {
  if (!dateStr) return ''
  const parts = String(dateStr).split('T')[0].split('-').map(Number)
  if (parts.length < 3) return dateStr
  const [y, m, d] = parts
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const hari = HARI[dateObj.getUTCDay()]
  const bulan = BULAN[m - 1]
  return `${hari}, ${d} ${bulan} ${y}`
}

          meetings = (pertemuanData || []).map((m: any) => ({
            id: m.id,
            label: m.keterangan || (m.jenis === 'uap' ? 'UAP' : m.jenis === 'pengarahan' ? 'Pengarahan' : `Pertemuan ${m.urutan_ke}`),
            date: m.tanggal ? formatIndoDateStr(m.tanggal) : 'Jadwal belum ditentukan',
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
