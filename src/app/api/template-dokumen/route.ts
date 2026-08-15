import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

// Daftar template dokumen (metadata saja). File asli (docx/pptx) statis di
// public/template/, dilayani langsung oleh Vercel -- tidak lewat Supabase.
export async function GET() {
  try {
    const sb = getSupabaseAdmin()

    // Update database records if they still have old naming
    await sb.from('template_dokumen').update({ nama: 'Pedoman Laporan Modul 1' }).eq('nama', 'Laporan Praktikum Modul 1')
    await sb.from('template_dokumen').update({ nama: 'Pedoman Laporan Modul 2' }).eq('nama', 'Laporan Praktikum Modul 2')
    await sb.from('template_dokumen').update({ nama: 'Pedoman Laporan Modul 3' }).eq('nama', 'Laporan Praktikum Modul 3')
    await sb.from('template_dokumen').update({ nama: 'Pedoman Laporan Modul 4' }).eq('nama', 'Laporan Praktikum Modul 4')
    await sb.from('template_dokumen').update({ nama: 'Pedoman Laporan Modul 5' }).eq('nama', 'Laporan Praktikum Modul 5')

    const { data, error } = await sb
      .from('template_dokumen')
      .select('id, nama, deskripsi, kategori, file_path, urutan')
      .order('kategori', { ascending: true })
      .order('urutan', { ascending: true })
    if (error) throw error

    const mapped = (data || []).map((item) => ({
      ...item,
      nama: item.nama ? item.nama.replace(/Laporan Praktikum Modul/gi, 'Pedoman Laporan Modul') : item.nama,
    }))

    return NextResponse.json({ templates: mapped })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan' }, { status: 500 })
  }
}
