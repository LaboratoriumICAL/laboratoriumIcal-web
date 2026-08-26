import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

// GET /api/auth/check-nim?nim=202411001
export async function GET(req: NextRequest) {
  try {
    const nim = String(req.nextUrl.searchParams.get('nim') || '').trim()

    if (!nim || nim.length < 5) {
      return NextResponse.json(
        { ok: false, error: 'Masukkan minimal 5 digit NIM.' },
        { status: 400 }
      )
    }

    const sb = getSupabaseAdmin()

    // 1. Cek apakah NIM ini sudah terdaftar memiliki akun di profiles
    const { data: existingProfile } = await sb
      .from('profiles')
      .select('id, email, nama_lengkap')
      .eq('nim', nim)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json({
        ok: false,
        alreadyRegistered: true,
        error: 'NIM ini sudah memiliki akun terdaftar. Silakan login atau gunakan fitur Lupa Password jika lupa kata sandi.',
      })
    }

    // 2. Cari data mahasiswa di tabel anggota_kelompok (hasil import asisten)
    const { data: anggotaList, error: eAnggota } = await sb
      .from('anggota_kelompok')
      .select(`
        id,
        nama_praktikan,
        nim,
        kelompok:kelompok_id (
          id,
          nama_kelompok,
          shift,
          kelas_praktikum:kelas_praktikum_id (
            nama_kelas,
            praktikum:praktikum_id (
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
      .limit(1)

    if (eAnggota) {
      throw eAnggota
    }

    if (!anggotaList || anggotaList.length === 0) {
      return NextResponse.json({
        ok: false,
        registered: false,
        error: `NIM ${nim} belum terdaftar di kelompok praktikum manapun. Silakan hubungi asisten laboratorium untuk dimasukkan ke kelompok.`,
      })
    }

    const anggota = anggotaList[0]
    const kelompokData = anggota.kelompok as any
    const kelasData = kelompokData?.kelas_praktikum as any
    const praktikumData = kelasData?.praktikum as any
    const jurusanData = praktikumData?.jurusan as any

    const namaPraktikan = (anggota.nama_praktikan || '').trim()
    const namaKelompok = kelompokData?.nama_kelompok || '-'
    const shift = kelompokData?.shift ? `Shift ${kelompokData.shift}` : ''
    const jurusanKode = jurusanData?.kode || ''
    const jurusanNama = jurusanData?.nama || ''
    const praktikumNama = praktikumData?.nama || ''

    return NextResponse.json({
      ok: true,
      registered: true,
      data: {
        nama: namaPraktikan,
        nim,
        namaKelompok: shift ? `${namaKelompok} (${shift})` : namaKelompok,
        jurusanKode,
        jurusanNama,
        praktikumNama,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal memverifikasi NIM.' },
      { status: 500 }
    )
  }
}
