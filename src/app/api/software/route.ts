import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

// GET /api/software -> Ambil daftar software praktikum dari database Supabase
export async function GET() {
  try {
    const sb = getSupabaseAdmin()
    const { data, error } = await sb
      .from('software_pendukung')
      .select('*')
      .order('urutan', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error

    const softwareList = (data || []).map((s: any) => ({
      id: s.id,
      name: s.nama,
      version: s.versi || '',
      icon: s.icon || 'laptop',
      description: s.deskripsi || '',
      color: s.warna || '#015c61',
      tags: s.tags || [],
      downloadUrl: s.download_url || '',
      guideUrl: s.guide_url || '',
      youtubeId: s.youtube_id || '',
      driveId: s.drive_id || '',
    }))

    return NextResponse.json({ ok: true, software: softwareList })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat data software' }, { status: 500 })
  }
}

// POST /api/software -> Tambah software baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const nama = String(body.name || body.nama || '').trim()
    const versi = String(body.version || body.versi || '').trim()
    const deskripsi = String(body.description || body.deskripsi || '').trim()
    const icon = String(body.icon || 'laptop')
    const warna = String(body.color || body.warna || '#015c61')
    const tags = Array.isArray(body.tags) ? body.tags : []
    const downloadUrl = String(body.downloadUrl || body.download_url || '').trim()
    const guideUrl = String(body.guideUrl || body.guide_url || '').trim()
    const youtubeId = String(body.youtubeId || body.youtube_id || '').trim()
    const driveId = String(body.driveId || body.drive_id || '').trim()
    const urutan = Number(body.urutan || 0)

    if (!nama) {
      return NextResponse.json({ error: 'Nama software wajib diisi' }, { status: 400 })
    }

    const sb = getSupabaseAdmin()
    const { data, error } = await sb
      .from('software_pendukung')
      .insert({
        nama,
        versi,
        deskripsi,
        icon,
        warna,
        tags,
        download_url: downloadUrl,
        guide_url: guideUrl,
        youtube_id: youtubeId,
        drive_id: driveId,
        urutan,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, software: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menambahkan data software' }, { status: 500 })
  }
}

// PATCH /api/software -> Update software
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'ID software wajib diisi' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (typeof body.name === 'string' || typeof body.nama === 'string') updates.nama = (body.name || body.nama).trim()
    if (typeof body.version === 'string' || typeof body.versi === 'string') updates.versi = (body.version || body.versi).trim()
    if (typeof body.description === 'string' || typeof body.deskripsi === 'string') updates.deskripsi = (body.description || body.deskripsi).trim()
    if (typeof body.icon === 'string') updates.icon = body.icon
    if (typeof body.color === 'string' || typeof body.warna === 'string') updates.warna = body.color || body.warna
    if (Array.isArray(body.tags)) updates.tags = body.tags
    if (typeof body.downloadUrl === 'string' || typeof body.download_url === 'string') updates.download_url = body.downloadUrl || body.download_url
    if (typeof body.guideUrl === 'string' || typeof body.guide_url === 'string') updates.guide_url = body.guideUrl || body.guide_url
    if (typeof body.youtubeId === 'string' || typeof body.youtube_id === 'string') updates.youtube_id = body.youtubeId || body.youtube_id
    if (typeof body.driveId === 'string' || typeof body.drive_id === 'string') updates.drive_id = body.driveId || body.drive_id
    if (typeof body.urutan === 'number') updates.urutan = body.urutan

    const sb = getSupabaseAdmin()
    const { data, error } = await sb.from('software_pendukung').update(updates).eq('id', id).select().single()
    if (error) throw error

    return NextResponse.json({ ok: true, software: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui software' }, { status: 500 })
  }
}

// DELETE /api/software?id=xxx -> Hapus software
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID software wajib diisi' }, { status: 400 })

    const sb = getSupabaseAdmin()
    const { error } = await sb.from('software_pendukung').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus software' }, { status: 500 })
  }
}
