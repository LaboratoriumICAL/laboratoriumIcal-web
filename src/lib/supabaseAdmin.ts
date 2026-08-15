import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase khusus SERVER (dipakai di dalam API routes saja).
 * Memakai Service Role Key sehingga bisa membaca/menulis tanpa terikat RLS
 * berbasis auth.uid() -- karena Dashboard Praktikan/Asisten di aplikasi ini
 * masih memakai login mock (belum terhubung ke Supabase Auth yang sesungguhnya).
 *
 * PENTING: jangan pernah import file ini dari komponen 'use client'.
 * SUPABASE_SERVICE_ROLE_KEY tidak boleh bocor ke browser.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local'
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
