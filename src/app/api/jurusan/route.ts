import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET() {
  try {
    const sb = getSupabaseAdmin()
    const { data: jurusan, error: eJ } = await sb.from('jurusan').select('id, kode, nama, kelas_tersedia').order('nama')
    if (eJ) throw eJ
    const { data: praktikum, error: eP } = await sb.from('praktikum').select('id, kode_singkat, nama, jurusan_id').order('nama')
    if (eP) throw eP

    const result = (jurusan || []).map((j) => ({
      id: j.id,
      kode: j.kode,
      nama: j.nama,
      kelasTersedia: j.kelas_tersedia || [],
      praktikum: (praktikum || [])
        .filter((p) => p.jurusan_id === j.id)
        .map((p) => ({ id: p.id, kode: p.kode_singkat, nama: p.nama })),
    }))

    return NextResponse.json({ jurusan: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
