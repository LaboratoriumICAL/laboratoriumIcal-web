import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

// Daftar modul (metadata saja: judul, deskripsi, dll -- BUKAN file PDF-nya).
// Ini query kecil ke Postgres, jadi tidak masalah untuk bandwidth Supabase.
// File PDF sendiri disimpan & di-download langsung dari Cloudflare R2 (lihat /api/modul/download).
export async function GET() {
  try {
    const sb = getSupabaseAdmin()
    const { data, error } = await sb
      .from('modul_utama')
      .select('id, kode_singkat, nama, deskripsi, file_path, urutan')
      .order('urutan', { ascending: true })
    if (error) throw error

    return NextResponse.json({ modules: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
