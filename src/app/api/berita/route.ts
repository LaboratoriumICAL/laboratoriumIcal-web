import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

// GET /api/berita?scope=public   -> hanya yang is_published=true, dipakai halaman publik (Home)
// GET /api/berita?scope=all      -> semua (termasuk draft), dipakai Dashboard Asisten utk kelola
export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get('scope') || 'public'
    const sb = getSupabaseAdmin()

    let query = sb
      .from('berita')
      .select('id, judul, isi, kategori, tanggal_terbit, is_published, ditulis_oleh, created_at, profiles(nama_lengkap)')
      .order('tanggal_terbit', { ascending: false })
      .order('created_at', { ascending: false })

    if (scope === 'public') {
      query = query.eq('is_published', true).limit(6)
    }

    const { data, error } = await query
    if (error) throw error

    const berita = (data || []).map((b: any) => ({
      id: b.id,
      judul: b.judul,
      isi: b.isi,
      kategori: b.kategori,
      tanggal_terbit: b.tanggal_terbit,
      is_published: b.is_published,
      penulis: b.profiles?.nama_lengkap || null,
    }))

    return NextResponse.json({ berita })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat berita' }, { status: 500 })
  }
}

// POST /api/berita -> buat berita baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const judul = String(body.judul || '').trim()
    const isi = String(body.isi || '').trim()
    const kategori = String(body.kategori || 'info')
    const tanggalTerbit = body.tanggal_terbit || new Date().toISOString().slice(0, 10)
    const isPublished = body.is_published !== false
    const ditulisOleh = body.ditulis_oleh || null

    if (!judul || !isi) {
      return NextResponse.json({ error: 'Judul dan isi wajib diisi' }, { status: 400 })
    }
    if (!['pengumuman', 'info', 'kegiatan'].includes(kategori)) {
      return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()
    const { data, error } = await sb
      .from('berita')
      .insert({
        judul,
        isi,
        kategori,
        tanggal_terbit: tanggalTerbit,
        is_published: isPublished,
        ditulis_oleh: ditulisOleh,
      })
      .select('id, judul, isi, kategori, tanggal_terbit, is_published')
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, berita: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat berita' }, { status: 500 })
  }
}

// PATCH /api/berita -> toggle publish/draft, atau edit judul/isi
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (typeof body.is_published === 'boolean') updates.is_published = body.is_published
    if (typeof body.judul === 'string') updates.judul = body.judul.trim()
    if (typeof body.isi === 'string') updates.isi = body.isi.trim()
    if (typeof body.kategori === 'string') updates.kategori = body.kategori

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan yang dikirim' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()
    const { data, error } = await sb.from('berita').update(updates).eq('id', id).select().single()
    if (error) throw error

    return NextResponse.json({ ok: true, berita: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui berita' }, { status: 500 })
  }
}

// DELETE /api/berita?id=xxx -> hapus berita
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

    const sb = getSupabaseAdmin()
    const { error } = await sb.from('berita').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus berita' }, { status: 500 })
  }
}
