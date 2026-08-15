import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body.name || '').trim()
    const nim = String(body.nim || '').trim()
    const jurusanKode = String(body.jurusanKode || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!name || !nim || !email || !password) {
      return NextResponse.json({ error: 'Semua field wajib diisi.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter.' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()

    // Cek dulu apakah NIM sudah terdaftar sebagai anggota kelompok (oleh asisten lewat Import Praktikan).
    // Ini validasi awal yang ramah -- validasi final tetap dijaga oleh trigger DB.
    const { data: anggota } = await sb.from('anggota_kelompok').select('id').eq('nim', nim).limit(1)
    if (!anggota || anggota.length === 0) {
      return NextResponse.json(
        { error: `NIM ${nim} belum terdaftar di kelompok praktikum manapun. Hubungi asisten untuk didaftarkan terlebih dahulu.` },
        { status: 400 }
      )
    }

    let jurusanId: string | null = null
    if (jurusanKode) {
      const { data: jurusan } = await sb.from('jurusan').select('id').eq('kode', jurusanKode).single()
      jurusanId = jurusan?.id || null
    }

    // Buat user Auth sungguhan, langsung dikonfirmasi (tanpa perlu setup email server) supaya bisa langsung login untuk uji coba.
    const { data: created, error: eCreate } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'praktikan', nama_lengkap: name },
    })
    if (eCreate) {
      const msg = eCreate.message?.includes('already been registered')
        ? 'Email ini sudah terdaftar. Silakan login.'
        : eCreate.message || 'Gagal membuat akun.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const userId = created.user?.id
    if (!userId) return NextResponse.json({ error: 'Gagal membuat akun.' }, { status: 500 })

    // Trigger on_auth_user_created sudah membuat baris profiles (role, nama_lengkap, email).
    // Lengkapi dengan nim & jurusan_id -- update ini akan divalidasi ulang oleh trigger
    // validasi_nim_praktikan_terdaftar (memastikan NIM memang terdaftar di anggota_kelompok).
    const { error: eUpdate } = await sb
      .from('profiles')
      .update({ nim, jurusan_id: jurusanId })
      .eq('id', userId)

    if (eUpdate) {
      // Rollback: hapus user auth yang baru dibuat supaya tidak menyisakan akun "setengah jadi"
      await sb.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: eUpdate.message || 'NIM tidak valid.' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, userId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
