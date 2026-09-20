import { NextRequest } from 'next/server'
import { createClient, User } from '@supabase/supabase-js'
import { getSupabaseAdmin } from './supabaseAdmin'

export interface Profile {
  id: string
  role: 'praktikan' | 'asisten' | string
  nama_lengkap: string
  nim?: string | null
  email?: string | null
  [key: string]: any
}

export type AuthResult =
  | { ok: true; user: User; profile: Profile }
  | { ok: false; status: number; error: string }

/**
 * Helper verifikasi otentikasi terpusat untuk API routes (Server-Side).
 *
 * Alur:
 * 1. Membaca header `Authorization: Bearer <access_token>`.
 * 2. Memvalidasi token ke Supabase Auth via client Anon Key (bukan service role)
 *    menggunakan `supabase.auth.getUser(token)`.
 * 3. Jika token valid, mengambil data profil user dari tabel `profiles` via Admin Client.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized: Header Authorization Bearer token wajib disertakan.',
    }
  }

  const token = authHeader.slice(7).trim()
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized: Token autentikasi tidak boleh kosong.',
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return {
      ok: false,
      status: 500,
      error: 'Server Error: Konfigurasi Supabase URL/Anon Key belum diatur.',
    }
  }

  // Client Supabase dengan Anon Key untuk memvalidasi JWT user ke Supabase Auth
  const anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await anonClient.auth.getUser(token)
  if (userError || !userData?.user) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized: Token tidak valid atau sesi login Anda telah berakhir.',
    }
  }

  const user = userData.user
  const admin = getSupabaseAdmin()

  // Ambil data profil dari database menggunakan Service Role Admin
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized: Profil pengguna tidak ditemukan di database.',
    }
  }

  return {
    ok: true,
    user,
    profile: profile as Profile,
  }
}

/**
 * Memastikan request dikirim oleh user yang login dengan role tertentu.
 * Mengembalikan error status 403 jika role tidak sesuai.
 */
export async function requireRole(
  req: NextRequest,
  allowedRole: string | string[]
): Promise<AuthResult> {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth

  const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole]
  if (!roles.includes(auth.profile.role)) {
    return {
      ok: false,
      status: 403,
      error: `Forbidden: Akses ditolak. Role '${auth.profile.role}' tidak memiliki izin untuk tindakan ini.`,
    }
  }

  return auth
}
