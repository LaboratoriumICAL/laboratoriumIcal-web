import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'

// Warna avatar deterministik dari NIM, dipertahankan sama urutannya seperti data lama
// supaya kartu kontak yang sudah pernah tampil tidak berubah warna.
const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#0ea5e9', '#059669', '#db2777', '#d97706', '#0891b2', '#be185d',
  '#9333ea', '#b45309', '#16a34a', '#dc2626', '#4f46e5', '#0d9488', '#ca8a04', '#c026d3',
  '#65a30d', '#e11d48', '#1d4ed8', '#7e22ce', '#0369a1', '#15803d', '#a21caf', '#b91c1c', '#0f766e',
]
const colorForId = (id: string) => {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function mapProfileToAssistant(p: any) {
  const nama = p.nama_lengkap || ''
  return {
    id: p.id,
    name: nama,
    nim: p.nip_nim_asisten || p.nim || '',
    wa: p.no_whatsapp || '',
    ig: p.instagram || '',
    role: p.is_koordinator ? 'Koordinator' : 'Asisten',
    color: colorForId(p.id),
    initial: nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase(),
    photo: p.foto_url || '',
  }
}

// GET /api/asisten -> Ambil daftar asisten (atau cari by nim/name)
export async function GET(req: NextRequest) {
  try {
    const nim = req.nextUrl.searchParams.get('nim')
    const name = req.nextUrl.searchParams.get('name')
    const sb = getSupabaseAdmin()

    let query = sb.from('profiles').select('*').eq('role', 'asisten')
    if (nim) {
      query = query.eq('nip_nim_asisten', nim)
      const { data, error } = await query.maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ ok: false, assistant: null })
      return NextResponse.json({ ok: true, assistant: mapProfileToAssistant(data) })
    }

    if (name) {
      query = query.ilike('nama_lengkap', `%${name}%`)
      const { data, error } = await query.maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ ok: false, assistant: null })
      return NextResponse.json({ ok: true, assistant: mapProfileToAssistant(data) })
    }

    const { data, error } = await query.order('is_koordinator', { ascending: false }).order('nama_lengkap', { ascending: true })
    if (error) throw error

    const assistants = (data || []).map(mapProfileToAssistant)

    return NextResponse.json({ ok: true, assistants })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memuat data asisten' }, { status: 500 })
  }
}

// POST /api/asisten -> Asisten baru dibuat lewat alur pendaftaran (/api/auth/register-asisten),
// karena profiles.id wajib mengacu ke auth.users(id). Endpoint ini sengaja tidak melakukan insert
// langsung supaya tidak membuat baris profiles yatim tanpa akun auth.
export async function POST() {
  return NextResponse.json(
    { error: 'Pendaftaran asisten baru dilakukan lewat /api/auth/register-asisten, bukan endpoint ini.' },
    { status: 405 },
  )
}

// PATCH /api/asisten -> Update kontak / profil asisten (bisa by id, nim, atau nama)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const id = body.id ? String(body.id) : null
    const nim = body.nim ? String(body.nim).trim() : null
    const name = body.name || body.nama ? String(body.name || body.nama).trim() : null

    if (!id && !nim && !name) {
      return NextResponse.json({ error: 'ID, NIM, atau Nama asisten wajib disertakan' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof body.name === 'string' || typeof body.nama === 'string') updates.nama_lengkap = (body.name || body.nama).trim()
    if (typeof body.nim === 'string') updates.nip_nim_asisten = body.nim.trim()
    if (typeof body.wa === 'string') updates.no_whatsapp = body.wa.trim()
    if (typeof body.ig === 'string') updates.instagram = body.ig.trim()
    if (typeof body.photo === 'string') updates.foto_url = body.photo

    const sb = getSupabaseAdmin()
    let query = sb.from('profiles').update(updates).eq('role', 'asisten')

    if (id) {
      query = query.eq('id', id)
    } else if (nim) {
      query = query.eq('nip_nim_asisten', nim)
    } else if (name) {
      query = query.ilike('nama_lengkap', `%${name}%`)
    }

    const { data, error } = await query.select().maybeSingle()
    if (error) throw error

    return NextResponse.json({ ok: true, assistant: data ? mapProfileToAssistant(data) : null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui data asisten' }, { status: 500 })
  }
}

// DELETE /api/asisten?id=xxx -> Hapus asisten
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID asisten wajib diisi' }, { status: 400 })

    const sb = getSupabaseAdmin()
    const { error } = await sb.from('profiles').delete().eq('id', id).eq('role', 'asisten')
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus data asisten' }, { status: 500 })
  }
}
