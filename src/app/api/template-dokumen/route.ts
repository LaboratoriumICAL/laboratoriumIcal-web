import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

// Daftar template dokumen (metadata saja). File asli (docx/pptx) statis di
// public/template/, dilayani langsung oleh Vercel -- tidak lewat Supabase.
export async function GET() {
  try {
    const sb = getSupabaseAdmin()

    const { data, error } = await sb
      .from('template_dokumen')
      .select('id, nama, deskripsi, kategori, file_path, urutan')
      .order('kategori', { ascending: true })
      .order('urutan', { ascending: true })
    if (error) throw error

    return NextResponse.json({ templates: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
