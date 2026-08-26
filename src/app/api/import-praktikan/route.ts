import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

interface ImportRow {
  nama: string
  nim: string
  kelompok: string
  shift?: string
  asisten?: string
}
interface ImportJadwal {
  hari?: string
  jamMulai?: string
  pengarahan?: string | null
  pertemuan?: { urutan: number; tanggal: string }[]
  uap?: string | null
}

const HARI_VALID = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

// Cocokkan nama hari tanpa peduli besar-kecil huruf (mis. "RABU", "rabu", "Rabu" semua dianggap sama),
// lalu kembalikan versi yang formatnya sudah benar sesuai HARI_VALID (huruf awal besar saja) supaya
// konsisten dengan yang diterima kolom `hari` di database.
function normalizeHari(hari?: string | null): string | null {
  if (!hari) return null
  const target = hari.trim().toLowerCase()
  if (!target) return null
  const match = HARI_VALID.find((h) => h.toLowerCase() === target)
  return match || null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const praktikumKode = String(body.praktikumKode || '').trim()
    const jurusanKode = String(body.jurusanKode || '').trim()
    const kelasNama = String(body.kelasNama || '').trim()
    const rows: ImportRow[] = Array.isArray(body.rows) ? body.rows : []
    const jadwal: ImportJadwal | null = body.jadwal || null

    if (!praktikumKode || !kelasNama) {
      return NextResponse.json({ error: 'Pilih Praktikum dan Kelas tujuan import terlebih dahulu.' }, { status: 400 })
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Tidak ada baris data yang bisa diimport dari file ini.' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // Satu kode_singkat (mis. "DSK") sekarang bisa dipakai lebih dari satu jurusan, jadi
    // wajib ada jurusanKode untuk menentukan baris praktikum yang tepat untuk diimport.
    if (!jurusanKode) {
      return NextResponse.json({ error: 'Pilih Jurusan tujuan import terlebih dahulu.' }, { status: 400 })
    }
    const { data: jurusanRow, error: eJ } = await sb.from('jurusan').select('id').eq('kode', jurusanKode).maybeSingle()
    if (eJ) throw eJ
    if (!jurusanRow) return NextResponse.json({ error: 'Jurusan tidak ditemukan.' }, { status: 404 })

    const { data: praktikum, error: eP } = await sb
      .from('praktikum')
      .select('id')
      .eq('kode_singkat', praktikumKode)
      .eq('jurusan_id', jurusanRow.id)
      .maybeSingle()
    if (eP) throw eP
    if (!praktikum) {
      return NextResponse.json({ error: 'Praktikum ini belum dibuka untuk jurusan yang dipilih.' }, { status: 404 })
    }

    const { data: periode } = await sb
      .from('periode_akademik')
      .select('id')
      .eq('is_active', true)
      .order('tanggal_mulai', { ascending: false, nullsFirst: false })
      .limit(1)
      .single()
    if (!periode) return NextResponse.json({ error: 'Belum ada periode akademik aktif. Atur dulu di tabel periode_akademik.' }, { status: 400 })

    // Cari atau buat kelas_praktikum untuk kombinasi praktikum + periode aktif + nama kelas ini
    let { data: kelas } = await sb
      .from('kelas_praktikum')
      .select('id')
      .eq('praktikum_id', praktikum.id)
      .eq('periode_id', periode.id)
      .eq('nama_kelas', kelasNama)
      .maybeSingle()

    if (!kelas) {
      const { data: newKelas, error: eNewKelas } = await sb
        .from('kelas_praktikum')
        .insert({ praktikum_id: praktikum.id, periode_id: periode.id, nama_kelas: kelasNama })
        .select('id')
        .single()
      if (eNewKelas) throw eNewKelas
      kelas = newKelas
    }
    const kelasId = kelas!.id

    // Ambil daftar asisten yang sudah punya akun, untuk mencocokkan nama asisten di file -> asisten_id.
    // File Excel biasanya cuma pakai nama panggilan singkat (mis. "HAKIIMI"), bukan nama lengkap persis,
    // jadi pencocokan dibuat fleksibel: exact match dulu, lalu partial match kata per kata.
    const { data: asistenProfiles } = await sb.from('profiles').select('id, nama_lengkap').eq('role', 'asisten')
    const findAsistenId = (nama?: string) => {
      if (!nama) return null
      const target = nama.trim().toLowerCase()
      if (!target) return null
      const list = asistenProfiles || []

      // 1. Exact match nama lengkap
      const exact = list.find((a) => (a.nama_lengkap || '').trim().toLowerCase() === target)
      if (exact) return exact.id

      // 2. Salah satu kata di nama lengkap asisten persis sama dengan nama singkat di file
      //    (mis. "HAKIIMI" cocok ke salah satu kata dalam "Hakimi Farhan Elfalah")
      const wordMatch = list.find((a) =>
        (a.nama_lengkap || '').trim().toLowerCase().split(/\s+/).some((w: string) => w === target)
      )
      if (wordMatch) return wordMatch.id

      // 3. Nama lengkap asisten mengandung teks singkat itu (fallback paling longgar)
      const contains = list.find((a) => (a.nama_lengkap || '').trim().toLowerCase().includes(target))
      if (contains) return contains.id

      return null
    }

    // Kelompokkan baris berdasarkan kode kelompok (mis. "A1", "A2")
    const groupMap = new Map<string, { shift?: string; asisten?: string; members: ImportRow[] }>()
    for (const row of rows) {
      if (!row.nama || !row.nim || !row.kelompok) continue
      const key = row.kelompok.trim()
      if (!groupMap.has(key)) groupMap.set(key, { shift: row.shift, asisten: row.asisten, members: [] })
      groupMap.get(key)!.members.push(row)
    }

    if (groupMap.size === 0) {
      return NextResponse.json({ error: 'Tidak ada baris valid (Nama/NIM/Kelompok kosong).' }, { status: 400 })
    }

    let kelompokCount = 0
    let anggotaCount = 0
    const errors: string[] = []

    for (const [kodeKelompok, info] of groupMap) {
      const nomorMatch = kodeKelompok.match(/(\d+)\s*$/)
      const nomorKelompok = nomorMatch ? parseInt(nomorMatch[1], 10) : groupMap.size
      const shiftValue = info.shift === '2' ? '2' : info.shift === '1' ? '1' : null

      // Upsert kelompok (unique: kelas_praktikum_id + nama_kelompok)
      const { data: existingKelompok } = await sb
        .from('kelompok')
        .select('id')
        .eq('kelas_praktikum_id', kelasId)
        .eq('nama_kelompok', kodeKelompok)
        .maybeSingle()

      let kelompokId: string
      const hariValue = normalizeHari(jadwal?.hari)
      const jamValue = jadwal?.jamMulai || null
      if (existingKelompok) {
        kelompokId = existingKelompok.id
        await sb
          .from('kelompok')
          .update({ shift: shiftValue, asisten_id: findAsistenId(info.asisten), hari: hariValue, jam_mulai: jamValue })
          .eq('id', kelompokId)
      } else {
        const { data: newKelompok, error: eKelompok } = await sb
          .from('kelompok')
          .insert({
            kelas_praktikum_id: kelasId,
            nama_kelompok: kodeKelompok,
            nomor_kelompok: nomorKelompok,
            shift: shiftValue,
            asisten_id: findAsistenId(info.asisten),
            hari: hariValue,
            jam_mulai: jamValue,
          })
          .select('id')
          .single()
        if (eKelompok) {
          errors.push(`Kelompok ${kodeKelompok}: ${eKelompok.message}`)
          continue
        }
        kelompokId = newKelompok.id
      }
      kelompokCount++

      // Simpan tanggal pertemuan (Pengarahan, Pertemuan ke-N sebanyak apapun, UAP) untuk kelompok ini,
      // kalau terdeteksi dari file Excel yang diupload. Jumlah pertemuan tidak dibatasi (bisa 4, 5, 8, dst).
      if (jadwal) {
        const pertemuanEntries: { jenis: string; urutan_ke: number; tanggal: string }[] = []
        if (jadwal.pengarahan) pertemuanEntries.push({ jenis: 'pengarahan', urutan_ke: 0, tanggal: jadwal.pengarahan })
        for (const p of jadwal.pertemuan || []) {
          if (p.tanggal) pertemuanEntries.push({ jenis: 'pertemuan', urutan_ke: p.urutan, tanggal: p.tanggal })
        }
        if (jadwal.uap) pertemuanEntries.push({ jenis: 'uap', urutan_ke: 999, tanggal: jadwal.uap })

        for (const pe of pertemuanEntries) {
          const { error: ePertemuan } = await sb
            .from('pertemuan')
            .upsert(
              { kelompok_id: kelompokId, jenis: pe.jenis, urutan_ke: pe.urutan_ke, tanggal: pe.tanggal },
              { onConflict: 'kelompok_id,jenis,urutan_ke' }
            )
          if (ePertemuan) errors.push(`Jadwal ${pe.jenis} kelompok ${kodeKelompok}: ${ePertemuan.message}`)
        }
      }

      for (let i = 0; i < info.members.length; i++) {
        const m = info.members[i]
        const nimTrimmed = m.nim.trim()
        const namaTrimmed = m.nama.trim()

        // SOLUSI 1 (OTOMATIS PINDAH KELOMPOK):
        // Cek apakah mahasiswa dengan NIM ini sudah pernah ada di kelompok lain pada kelas praktikum yang sama.
        // Jika sebelumnya ada di kelompok A1, dan di Excel baru dimasukkan ke A2,
        // sistem otomatis memindahkan kelompoknya ke A2 tanpa membuat duplikat di A1.
        let eAnggota: any = null

        // Ambil daftar kelompok di kelas ini untuk validasi perpindahan
        const { data: allKelompokInKelas } = await sb
          .from('kelompok')
          .select('id')
          .eq('kelas_praktikum_id', kelasId)
        const kelompokIdsInKelas = (allKelompokInKelas || []).map((k) => k.id)

        if (kelompokIdsInKelas.length > 0) {
          const { data: existingInKelas } = await sb
            .from('anggota_kelompok')
            .select('id, kelompok_id')
            .eq('nim', nimTrimmed)
            .in('kelompok_id', kelompokIdsInKelas)
            .limit(1)

          if (existingInKelas && existingInKelas.length > 0) {
            const currentRecord = existingInKelas[0]
            // Update kelompok_id ke kelompok baru beserta nama & nomor_urut terbaru
            const { error: errUpdate } = await sb
              .from('anggota_kelompok')
              .update({
                kelompok_id: kelompokId,
                nama_praktikan: namaTrimmed,
                nomor_urut: i + 1,
              })
              .eq('id', currentRecord.id)

            eAnggota = errUpdate

            // Bersihkan baris duplikat lain jika ada lebih dari satu di kelas ini
            await sb
              .from('anggota_kelompok')
              .delete()
              .eq('nim', nimTrimmed)
              .neq('id', currentRecord.id)
              .in('kelompok_id', kelompokIdsInKelas)
          } else {
            // Mahasiswa baru, masukkan via upsert
            const { error: errUpsert } = await sb
              .from('anggota_kelompok')
              .upsert(
                { kelompok_id: kelompokId, nama_praktikan: namaTrimmed, nim: nimTrimmed, nomor_urut: i + 1 },
                { onConflict: 'kelompok_id,nim' }
              )
            eAnggota = errUpsert
          }
        } else {
          const { error: errUpsert } = await sb
            .from('anggota_kelompok')
            .upsert(
              { kelompok_id: kelompokId, nama_praktikan: namaTrimmed, nim: nimTrimmed, nomor_urut: i + 1 },
              { onConflict: 'kelompok_id,nim' }
            )
          eAnggota = errUpsert
        }

        if (eAnggota) {
          errors.push(`${namaTrimmed} (${nimTrimmed}): ${eAnggota.message}`)
        } else {
          anggotaCount++
        }
      }
    }

    return NextResponse.json({
      ok: true,
      kelompokCount,
      anggotaCount,
      errors,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan saat import.' }, { status: 500 })
  }
}
