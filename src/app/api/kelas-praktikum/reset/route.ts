import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'
import { resetKelasData } from '../../../../lib/classReset'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const praktikumKode = String(body.praktikumKode || '').trim()
    const jurusanKode = String(body.jurusanKode || '').trim()
    const kelasNama = String(body.kelasNama || '').trim()
    const onlyNumbers = Boolean(body.onlyNumbers || body.scope === 'only_numbers')

    if (!praktikumKode || !jurusanKode || !kelasNama) {
      return NextResponse.json(
        { error: 'Parameter jurusan, praktikum, dan kelas wajib diisi.' },
        { status: 400 }
      )
    }

    const sb = getSupabaseAdmin()

    // 1. Cari jurusan
    const { data: jurusanRow, error: eJ } = await sb
      .from('jurusan')
      .select('id')
      .eq('kode', jurusanKode)
      .maybeSingle()
    if (eJ) throw eJ
    if (!jurusanRow) {
      return NextResponse.json({ error: 'Jurusan tidak ditemukan.' }, { status: 404 })
    }

    // 2. Cari praktikum
    const { data: praktikum, error: eP } = await sb
      .from('praktikum')
      .select('id')
      .eq('kode_singkat', praktikumKode)
      .eq('jurusan_id', jurusanRow.id)
      .maybeSingle()
    if (eP) throw eP
    if (!praktikum) {
      return NextResponse.json({ error: 'Praktikum tidak ditemukan untuk jurusan ini.' }, { status: 404 })
    }

    // 3. Cari periode aktif
    const { data: periode } = await sb
      .from('periode_akademik')
      .select('id')
      .eq('is_active', true)
      .order('tanggal_mulai', { ascending: false, nullsFirst: false })
      .limit(1)
      .single()
    if (!periode) {
      return NextResponse.json({ error: 'Belum ada periode akademik aktif.' }, { status: 400 })
    }

    // 4. Cari kelas_praktikum
    const { data: kelas, error: eK } = await sb
      .from('kelas_praktikum')
      .select('id, nama_kelas')
      .eq('praktikum_id', praktikum.id)
      .eq('periode_id', periode.id)
      .eq('nama_kelas', kelasNama)
      .maybeSingle()
    if (eK) throw eK
    if (!kelas) {
      return NextResponse.json({ error: `Kelas ${kelasNama} belum memiliki data.` }, { status: 404 })
    }

    // 5. Eksekusi reset menggunakan helper yang aman
    const result = await resetKelasData(sb, {
      kelasId: kelas.id,
      onlyNumbers,
    })

    return NextResponse.json({
      ok: true,
      message: onlyNumbers
        ? `Berhasil membersihkan ${result.kelompokCount} kelompok angka sisa di Kelas ${kelasNama}.`
        : `Berhasil mereset seluruh data (${result.kelompokCount} kelompok) di Kelas ${kelasNama}.`,
      result,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan saat mereset kelas.' },
      { status: 500 }
    )
  }
}
