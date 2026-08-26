import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

// GET /api/asisten/praktikan?jurusan=SITE&praktikum=PLC&kelas=A
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jurusanKode = String(searchParams.get('jurusan') || '').trim()
    const praktikumKode = String(searchParams.get('praktikum') || '').trim()
    const kelasNama = String(searchParams.get('kelas') || '').trim()

    if (!praktikumKode) {
      return NextResponse.json({ error: 'Parameter praktikum wajib diisi.' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // 1. Dapatkan jurusan_id jika ada
    let jurusanId: string | null = null
    if (jurusanKode) {
      const { data: jur } = await sb.from('jurusan').select('id').eq('kode', jurusanKode).maybeSingle()
      if (jur) jurusanId = jur.id
    }

    // 2. Dapatkan praktikum_id
    let praktikumQuery = sb.from('praktikum').select('id').eq('kode_singkat', praktikumKode)
    if (jurusanId) {
      praktikumQuery = praktikumQuery.eq('jurusan_id', jurusanId)
    }
    const { data: praktikumList } = await praktikumQuery
    if (!praktikumList || praktikumList.length === 0) {
      return NextResponse.json({ ok: true, students: [], total: 0, registeredCount: 0, unregisteredCount: 0 })
    }
    const praktikumIds = praktikumList.map((p) => p.id)

    // 3. Periode aktif
    const { data: periode } = await sb
      .from('periode_akademik')
      .select('id')
      .eq('is_active', true)
      .order('tanggal_mulai', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()

    // 4. Cari kelas_praktikum
    let kelasQuery = sb.from('kelas_praktikum').select('id, nama_kelas').in('praktikum_id', praktikumIds)
    if (periode) {
      kelasQuery = kelasQuery.eq('periode_id', periode.id)
    }
    if (kelasNama) {
      kelasQuery = kelasQuery.eq('nama_kelas', kelasNama)
    }
    const { data: kelasList } = await kelasQuery
    if (!kelasList || kelasList.length === 0) {
      return NextResponse.json({ ok: true, students: [], total: 0, registeredCount: 0, unregisteredCount: 0 })
    }
    const kelasIds = kelasList.map((k) => k.id)
    const kelasMap = new Map(kelasList.map((k) => [k.id, k.nama_kelas]))

    // 5. Cari kelompok
    const { data: kelompokList } = await sb
      .from('kelompok')
      .select('id, nama_kelompok, shift, kelas_praktikum_id, asisten:asisten_id(id, nama_lengkap)')
      .in('kelas_praktikum_id', kelasIds)
      .order('nama_kelompok')

    if (!kelompokList || kelompokList.length === 0) {
      return NextResponse.json({ ok: true, students: [], total: 0, registeredCount: 0, unregisteredCount: 0 })
    }
    const kelompokIds = kelompokList.map((k) => k.id)
    const kelompokMap = new Map(
      kelompokList.map((k: any) => [
        k.id,
        {
          nama_kelompok: k.nama_kelompok,
          shift: k.shift ? `Shift ${k.shift}` : '—',
          nama_kelas: kelasMap.get(k.kelas_praktikum_id) || '—',
          asisten: k.asisten?.nama_lengkap || '—',
        },
      ])
    )

    // 6. Ambil semua anggota kelompok
    const { data: anggotaList } = await sb
      .from('anggota_kelompok')
      .select('id, kelompok_id, nama_praktikan, nim, nomor_urut, praktikan_id')
      .in('kelompok_id', kelompokIds)
      .order('nim')

    if (!anggotaList || anggotaList.length === 0) {
      return NextResponse.json({ ok: true, students: [], total: 0, registeredCount: 0, unregisteredCount: 0 })
    }

    // 7. Ambil info akun di profiles berdasarkan NIM untuk memastikan akurasi
    const nims = anggotaList.map((a) => a.nim).filter(Boolean)
    const { data: profilesList } = await sb
      .from('profiles')
      .select('id, nim, email, created_at')
      .in('nim', nims)

    const profileByNim = new Map((profilesList || []).map((p) => [p.nim, p]))

    let registeredCount = 0
    let unregisteredCount = 0

    const students = anggotaList.map((a, idx) => {
      const kInfo = kelompokMap.get(a.kelompok_id)
      const userProfile = profileByNim.get(a.nim)
      const hasAccount = !!a.praktikan_id || !!userProfile

      if (hasAccount) {
        registeredCount++
      } else {
        unregisteredCount++
      }

      return {
        id: a.id,
        no: idx + 1,
        nama: a.nama_praktikan,
        nim: a.nim,
        kelompok: kInfo?.nama_kelompok || '—',
        shift: kInfo?.shift || '—',
        kelas: kInfo?.nama_kelas || '—',
        asisten: kInfo?.asisten || '—',
        hasAccount,
        email: userProfile?.email || null,
        registeredAt: userProfile?.created_at || null,
      }
    })

    return NextResponse.json({
      ok: true,
      students,
      total: students.length,
      registeredCount,
      unregisteredCount,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat data praktikan.' }, { status: 500 })
  }
}

// DELETE /api/asisten/praktikan
// Body: { jurusan: string, praktikum: string, kelas?: string }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const jurusanKode = String(body.jurusan || '').trim()
    const praktikumKode = String(body.praktikum || '').trim()
    const kelasNama = String(body.kelas || '').trim()

    if (!praktikumKode) {
      return NextResponse.json({ error: 'Parameter praktikum wajib diisi.' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // 1. Dapatkan jurusan_id jika ada
    let jurusanId: string | null = null
    if (jurusanKode) {
      const { data: jur } = await sb.from('jurusan').select('id').eq('kode', jurusanKode).maybeSingle()
      if (jur) jurusanId = jur.id
    }

    // 2. Dapatkan praktikum_id
    let praktikumQuery = sb.from('praktikum').select('id').eq('kode_singkat', praktikumKode)
    if (jurusanId) praktikumQuery = praktikumQuery.eq('jurusan_id', jurusanId)
    const { data: praktikumList } = await praktikumQuery
    if (!praktikumList || praktikumList.length === 0) {
      return NextResponse.json({ error: 'Praktikum tidak ditemukan.' }, { status: 404 })
    }
    const praktikumIds = praktikumList.map((p) => p.id)

    // 3. Dapatkan kelas_praktikum_id
    let kelasQuery = sb.from('kelas_praktikum').select('id, nama_kelas').in('praktikum_id', praktikumIds)
    if (kelasNama) {
      kelasQuery = kelasQuery.eq('nama_kelas', kelasNama)
    }
    const { data: kelasList } = await kelasQuery
    if (!kelasList || kelasList.length === 0) {
      return NextResponse.json({ error: 'Kelas praktikum tidak ditemukan.' }, { status: 404 })
    }
    const kelasIds = kelasList.map((k) => k.id)

    // 4. Dapatkan kelompok_id
    const { data: kelompokList } = await sb.from('kelompok').select('id').in('kelas_praktikum_id', kelasIds)
    const kelompokIds = (kelompokList || []).map((k) => k.id)

    let deletedMahasiswaCount = 0
    if (kelompokIds.length > 0) {
      // 5. Hitung anggota_kelompok yang akan dihapus
      const { data: anggotaList } = await sb.from('anggota_kelompok').select('id').in('kelompok_id', kelompokIds)
      const anggotaIds = (anggotaList || []).map((a) => a.id)
      deletedMahasiswaCount = anggotaIds.length

      if (anggotaIds.length > 0) {
        // Hapus absensi terkait
        await sb.from('absensi').delete().in('anggota_kelompok_id', anggotaIds)
        // Hapus nilai terkait
        await sb.from('nilai_komponen').delete().in('anggota_kelompok_id', anggotaIds)
        // Hapus anggota_kelompok
        await sb.from('anggota_kelompok').delete().in('id', anggotaIds)
      }

      // Hapus pertemuan terkait
      await sb.from('pertemuan').delete().in('kelompok_id', kelompokIds)
      // Hapus kelompok
      await sb.from('kelompok').delete().in('id', kelompokIds)
    }

    // Hapus kelas_praktikum
    await sb.from('kelas_praktikum').delete().in('id', kelasIds)

    return NextResponse.json({
      ok: true,
      message: `Berhasil menghapus data praktikan (${deletedMahasiswaCount} mahasiswa, ${kelompokIds.length} kelompok).`,
      deletedMahasiswa: deletedMahasiswaCount,
      deletedKelompok: kelompokIds.length,
      deletedKelas: kelasList.map((k) => k.nama_kelas),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus data praktikan.' }, { status: 500 })
  }
}
