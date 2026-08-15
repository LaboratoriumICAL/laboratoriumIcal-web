import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'
import { verifyQrAttendToken } from '../../../lib/qrAttendance'

// Menyamakan urutan_ke '' (query string kosong, dipakai untuk jenis tanpa nomor urut
// seperti 'presentasi') menjadi null supaya cocok dengan kolom pertemuan.urutan_ke.
function parseUrutanKe(raw: string | null): number | null {
  if (raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// Resolusi filter (jurusan, praktikum, kelas_praktikum_id) -> daftar id kelompok yang berada
// dalam cakupan filter tsb. Dipakai bersama oleh GET (roster) dan POST (scan QR).
async function resolveKelompokScope(
  sb: ReturnType<typeof getSupabaseAdmin>,
  params: { praktikumKode: string; jurusanKode?: string | null; kelasPraktikumId?: string | null }
) {
  let praktikumQuery = sb.from('praktikum').select('id').eq('kode_singkat', params.praktikumKode)
  if (params.jurusanKode) {
    const { data: jurusanRow } = await sb.from('jurusan').select('id').eq('kode', params.jurusanKode).maybeSingle()
    if (!jurusanRow) return { error: 'Jurusan tidak ditemukan', status: 404 as const }
    praktikumQuery = praktikumQuery.eq('jurusan_id', jurusanRow.id)
  }
  const { data: praktikumRows, error: eP } = await praktikumQuery
  if (eP) throw eP
  if (!praktikumRows || praktikumRows.length === 0) {
    return { error: 'Praktikum tidak ditemukan', status: 404 as const }
  }
  const praktikumIds = praktikumRows.map((p) => p.id)

  let kelasQuery = sb.from('kelas_praktikum').select('id, nama_kelas').in('praktikum_id', praktikumIds)
  if (params.kelasPraktikumId) kelasQuery = kelasQuery.eq('id', params.kelasPraktikumId)
  const { data: kelas, error: eK } = await kelasQuery
  if (eK) throw eK
  const kelasIds = (kelas || []).map((k) => k.id)
  if (kelasIds.length === 0) return { kelompokIds: [] as string[], kelasById: new Map<string, string>() }

  const { data: kelompok, error: eKp } = await sb
    .from('kelompok')
    .select('id, nama_kelompok, kelas_praktikum_id')
    .in('kelas_praktikum_id', kelasIds)
  if (eKp) throw eKp

  const kelasById = new Map((kelas || []).map((k) => [k.id, k.nama_kelas]))
  return { kelompok: kelompok || [], kelasById }
}

const JENIS_ORDER: Record<string, number> = { pengarahan: 0, pertemuan: 1, presentasi: 2, uap: 3 }

export async function GET(req: NextRequest) {
  try {
    const praktikumKode = req.nextUrl.searchParams.get('praktikum')
    const jurusanKode = req.nextUrl.searchParams.get('jurusan')
    const jenis = req.nextUrl.searchParams.get('jenis')
    const urutanKe = parseUrutanKe(req.nextUrl.searchParams.get('urutan_ke'))
    const kelasPraktikumId = req.nextUrl.searchParams.get('kelas_praktikum_id')
    const full = req.nextUrl.searchParams.get('mode') === 'full'

    if (!praktikumKode) return NextResponse.json({ error: 'Parameter praktikum wajib diisi' }, { status: 400 })
    if (!full && !jenis) return NextResponse.json({ error: 'Parameter jenis (jadwal praktikum) wajib diisi' }, { status: 400 })

    const sb = getSupabaseAdmin()
    const scope = await resolveKelompokScope(sb, { praktikumKode, jurusanKode, kelasPraktikumId })
    if ('error' in scope) return NextResponse.json({ error: scope.error }, { status: scope.status })

    const kelompok = scope.kelompok || []
    const kelompokIds = kelompok.map((k) => k.id)
    if (kelompokIds.length === 0) return NextResponse.json(full ? { columns: [], roster: [] } : { roster: [] })

    // --- Mode rekap penuh: satu baris per praktikan, satu kolom per jadwal (Pengarahan,
    // Pertemuan-1..n, Presentasi/UAP) — dipakai untuk ekspor rekap absensi lengkap. ---
    if (full) {
      const { data: pertemuanRows, error: ePt } = await sb
        .from('pertemuan')
        .select('id, kelompok_id, jenis, urutan_ke')
        .in('kelompok_id', kelompokIds)
      if (ePt) throw ePt

      const { data: anggota, error: eA } = await sb
        .from('anggota_kelompok')
        .select('id, kelompok_id, nama_praktikan, nim')
        .in('kelompok_id', kelompokIds)
        .order('nama_praktikan', { ascending: true })
      if (eA) throw eA

      const pertemuanIds = (pertemuanRows || []).map((p) => p.id)
      let absensiRows: { anggota_kelompok_id: string; pertemuan_id: string; status: string }[] = []
      if (pertemuanIds.length > 0 && anggota && anggota.length > 0) {
        const { data, error: eAb } = await sb
          .from('absensi')
          .select('anggota_kelompok_id, pertemuan_id, status')
          .in('pertemuan_id', pertemuanIds)
          .in('anggota_kelompok_id', anggota.map((a) => a.id))
        if (eAb) throw eAb
        absensiRows = data || []
      }

      // Kolom = gabungan semua slot (jenis, urutan_ke) yang ada pada kelompok-kelompok tsb,
      // diurutkan: Pengarahan -> Pertemuan 1..n -> Presentasi -> UAP.
      const colKey = (jenis: string, urutan_ke: number | null) => `${jenis}|${urutan_ke}`
      const colMap = new Map<string, { jenis: string; urutan_ke: number | null; label: string }>()
      for (const p of pertemuanRows || []) {
        const key = colKey(p.jenis, p.urutan_ke)
        if (!colMap.has(key)) {
          const label = p.jenis === 'pengarahan' ? 'Pengarahan' : p.jenis === 'presentasi' ? 'Presentasi' : p.jenis === 'uap' ? 'UAP' : `Pertemuan ${p.urutan_ke}`
          colMap.set(key, { jenis: p.jenis, urutan_ke: p.urutan_ke, label })
        }
      }
      const columns = Array.from(colMap.values()).sort((a, b) => {
        const oa = JENIS_ORDER[a.jenis] ?? 99
        const ob = JENIS_ORDER[b.jenis] ?? 99
        if (oa !== ob) return oa - ob
        return (a.urutan_ke ?? 0) - (b.urutan_ke ?? 0)
      })

      const pertemuanById = new Map((pertemuanRows || []).map((p) => [p.id, p]))
      const statusByAnggotaPertemuan = new Map(absensiRows.map((r) => [`${r.anggota_kelompok_id}::${r.pertemuan_id}`, r.status]))
      const kelompokById = new Map(kelompok.map((k) => [k.id, k]))

      const roster = (anggota || []).map((a) => {
        const k = kelompokById.get(a.kelompok_id)
        const attendance: Record<string, string | null> = {}
        for (const p of pertemuanRows || []) {
          if (p.kelompok_id !== a.kelompok_id) continue
          const key = colKey(p.jenis, p.urutan_ke)
          attendance[key] = statusByAnggotaPertemuan.get(`${a.id}::${p.id}`) || null
        }
        return {
          anggota_kelompok_id: a.id,
          nama: a.nama_praktikan,
          nim: a.nim,
          nama_kelompok: k?.nama_kelompok || '-',
          nama_kelas: k ? scope.kelasById.get(k.kelas_praktikum_id) || '-' : '-',
          attendance,
        }
      })

      return NextResponse.json({ columns, roster })
    }

    const { data: pertemuanRows, error: ePt } = await sb
      .from('pertemuan')
      .select('id, kelompok_id, jenis, urutan_ke')
      .in('kelompok_id', kelompokIds)
      .eq('jenis', jenis)
      .eq('urutan_ke', urutanKe as any)
    if (ePt) throw ePt
    const pertemuanByKelompok = new Map((pertemuanRows || []).map((p) => [p.kelompok_id, p.id]))
    const pertemuanIds = (pertemuanRows || []).map((p) => p.id)

    const { data: anggota, error: eA } = await sb
      .from('anggota_kelompok')
      .select('id, kelompok_id, nama_praktikan, nim, nomor_urut')
      .in('kelompok_id', kelompokIds)
      .order('nama_praktikan', { ascending: true })
    if (eA) throw eA

    let absensiByAnggota = new Map<string, { status: string; waktu_absen: string; metode: string }>()
    if (pertemuanIds.length > 0 && anggota && anggota.length > 0) {
      const { data: absensiRows, error: eAb } = await sb
        .from('absensi')
        .select('anggota_kelompok_id, pertemuan_id, status, waktu_absen, metode')
        .in('pertemuan_id', pertemuanIds)
        .in('anggota_kelompok_id', anggota.map((a) => a.id))
      if (eAb) throw eAb
      absensiByAnggota = new Map((absensiRows || []).map((r) => [r.anggota_kelompok_id, { status: r.status, waktu_absen: r.waktu_absen, metode: r.metode }]))
    }

    const kelompokById = new Map(kelompok.map((k) => [k.id, k]))

    const roster = (anggota || []).map((a) => {
      const k = kelompokById.get(a.kelompok_id)
      const pertemuanId = pertemuanByKelompok.get(a.kelompok_id) || null
      const ab = absensiByAnggota.get(a.id)
      return {
        anggota_kelompok_id: a.id,
        nama: a.nama_praktikan,
        nim: a.nim,
        kelompok_id: a.kelompok_id,
        nama_kelompok: k?.nama_kelompok || '-',
        kelas_praktikum_id: k?.kelas_praktikum_id || null,
        nama_kelas: k ? scope.kelasById.get(k.kelas_praktikum_id) || '-' : '-',
        pertemuan_id: pertemuanId,
        status: ab?.status || null,
        waktu_absen: ab?.waktu_absen || null,
        metode: ab?.metode || null,
      }
    })

    return NextResponse.json({ roster })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sb = getSupabaseAdmin()

    // Mode manual: klik tombol H/I/S/A langsung di tabel rekap, semua id sudah diketahui dari roster.
    if (body.mode === 'manual') {
      const { anggota_kelompok_id, pertemuan_id, status } = body
      if (!anggota_kelompok_id || !pertemuan_id || !['H', 'I', 'S', 'A'].includes(status)) {
        return NextResponse.json({ error: 'anggota_kelompok_id, pertemuan_id, dan status (H/I/S/A) wajib diisi' }, { status: 400 })
      }
      const { error } = await sb.from('absensi').upsert(
        { anggota_kelompok_id, pertemuan_id, status, metode: 'manual', waktu_absen: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'anggota_kelompok_id,pertemuan_id' }
      )
      if (error) throw error
      return NextResponse.json({ success: true, status })
    }

    // Mode scan (default): body berisi TEKS MENTAH hasil decode QR (bukan NIM yang sudah
    // ditebak di client) + filter jadwal yang sedang aktif di layar Scan QR. Validasi format,
    // tanda tangan (HMAC), dan kadaluarsa dilakukan di sini, di server -- lihat qrAttendance.ts.
    // Ini menutup dua celah lama: (1) client dulu menerima "sembarang angka >=5 digit" sebagai
    // NIM lewat regex, dan (2) QR statis bisa di-screenshot & dipakai berulang kapan saja.
    const { qr, praktikum, jurusan, jenis, kelas_praktikum_id } = body
    const urutanKe = parseUrutanKe(body.urutan_ke === undefined || body.urutan_ke === null ? null : String(body.urutan_ke))
    if (!praktikum || !jenis) return NextResponse.json({ error: 'Filter praktikum & jadwal praktikum wajib dipilih sebelum scan.' }, { status: 400 })

    const verified = verifyQrAttendToken(qr)
    if (!verified.valid) {
      const message =
        verified.reason === 'expired'
          ? 'QR sudah kadaluarsa. Minta praktikan membuka ulang halaman QR Absensi lalu scan ulang.'
          : verified.reason === 'signature'
          ? 'QR tidak valid (tanda tangan tidak cocok / bukan berasal dari sistem ICAL).'
          : 'QR tidak dikenali (bukan format QR absensi ICAL).'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const nim = verified.nim

    const scope = await resolveKelompokScope(sb, { praktikumKode: praktikum, jurusanKode: jurusan, kelasPraktikumId: kelas_praktikum_id })
    if ('error' in scope) return NextResponse.json({ error: scope.error }, { status: scope.status })
    const kelompokIds = (scope.kelompok || []).map((k) => k.id)
    if (kelompokIds.length === 0) {
      return NextResponse.json({ error: `NIM ${nim} tidak terdaftar pada kelas ini.` }, { status: 404 })
    }

    const { data: anggotaRow, error: eA } = await sb
      .from('anggota_kelompok')
      .select('id, kelompok_id, nama_praktikan, nim')
      .in('kelompok_id', kelompokIds)
      .eq('nim', nim)
      .maybeSingle()
    if (eA) throw eA
    if (!anggotaRow) {
      return NextResponse.json({ error: `NIM ${nim} tidak terdaftar pada kelas/kelompok yang dipilih.` }, { status: 404 })
    }

    const { data: pertemuanRow, error: ePt } = await sb
      .from('pertemuan')
      .select('id')
      .eq('kelompok_id', anggotaRow.kelompok_id)
      .eq('jenis', jenis)
      .eq('urutan_ke', urutanKe as any)
      .maybeSingle()
    if (ePt) throw ePt
    if (!pertemuanRow) {
      return NextResponse.json({ error: 'Jadwal praktikum yang dipilih belum ada untuk kelompok praktikan ini.' }, { status: 404 })
    }

    const { error: eUp } = await sb.from('absensi').upsert(
      {
        anggota_kelompok_id: anggotaRow.id,
        pertemuan_id: pertemuanRow.id,
        status: 'H',
        metode: 'scan_qr',
        waktu_absen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'anggota_kelompok_id,pertemuan_id' }
    )
    if (eUp) throw eUp

    return NextResponse.json({
      success: true,
      nama: anggotaRow.nama_praktikan,
      nim: anggotaRow.nim,
      anggota_kelompok_id: anggotaRow.id,
      pertemuan_id: pertemuanRow.id,
      status: 'H',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
