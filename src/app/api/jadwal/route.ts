import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'
import { requireAuth } from '../../../lib/apiAuth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function maskNim(nim?: string | null): string {
  if (!nim) return ''
  const str = nim.trim()
  if (str.length <= 4) return '****'
  return `${str.slice(0, 4)}***${str.slice(-2)}`
}

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

    // Cek apakah pengunjung sudah login. Jika belum login, sembunyikan sebagian digit NIM mahasiswa
    const auth = await requireAuth(req)
    const isLoggedIn = auth.ok

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
        .map((a) => ({
          name: a.nama_praktikan,
          nim: isLoggedIn ? a.nim : maskNim(a.nim),
          hasAccount: !!a.praktikan_id,
        })),
    }))

    // Buat map kelompokId -> shift untuk grouping tanggal per shift
    const kelompokShiftMap = new Map<string, number>()
    for (const k of kelompokRows || []) {
      if (k.shift != null) kelompokShiftMap.set(k.id, Number(k.shift))
    }

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

    // Kelompokkan tanggal pertemuan per shift (deduped per shift)
    const scheduleDatesByShift: Record<number, { label: string; date: string; urutan: number }[]> = {}
    for (const p of pertemuanRows || []) {
      const shift = kelompokShiftMap.get(p.kelompok_id) ?? 0
      if (!scheduleDatesByShift[shift]) scheduleDatesByShift[shift] = []
      const label = p.keterangan || (p.jenis === 'pengarahan' ? 'Pengarahan' : p.jenis === 'uap' ? 'UAP' : `Pertemuan ${p.urutan_ke}`)
      const formattedDate = formatIndoDateStr(p.tanggal)
      const alreadyAdded = scheduleDatesByShift[shift].some((x) => x.label === label && x.date === formattedDate)
      if (!alreadyAdded) {
        scheduleDatesByShift[shift].push({
          label,
          urutan: p.jenis === 'pengarahan' ? -1 : p.jenis === 'uap' ? 9999 : (p.urutan_ke ?? 0),
          date: formattedDate,
        })
      }
    }
    // Urutkan tiap shift: pengarahan dulu, lalu pertemuan 1,2,3,..., UAP terakhir
    for (const shiftKey of Object.keys(scheduleDatesByShift)) {
      scheduleDatesByShift[Number(shiftKey)].sort((a, b) => a.urutan - b.urutan)
    }

    return NextResponse.json({ groups, scheduleDatesByShift })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
