'use client'

import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase untuk BROWSER (dipakai di komponen 'use client': LoginPage,
 * RegisterPage, App, dsb). Memakai ANON KEY -- aman dipakai di sisi klien.
 * Session login tersimpan otomatis di localStorage oleh supabase-js.
 */
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowser() {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local lalu restart `npm run dev`.'
    )
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return browserClient
}

/**
 * Ekstrak dan normalisasi NIM standar 9-digit dari email mahasiswa ITPLN.
 * Mendukung format:
 * - 'SITI2411010@itpln.ac.id' -> '202411010' (24 -> 2024)
 * - 'FATIH2311001@itpln.ac.id' -> '202311001' (23 -> 2023)
 * - '202411010@itpln.ac.id'   -> '202411010'
 * - '2411010@itpln.ac.id'     -> '202411010'
 */
export function extractNimFromItplnEmail(email?: string | null): string | null {
  if (!email) return null
  const username = (email.split('@')[0] || '').trim().toUpperCase()

  // Ambil deretan angka (misal 2411010 dari SITI2411010)
  const match = username.match(/\d+$/) || username.match(/\d+/)
  if (!match) return null

  const digits = match[0]

  // Jika sudah lengkap 9 digit (cth: 202411010, 202311005)
  if (digits.length === 9 && digits.startsWith('20')) {
    return digits
  }

  // Jika format 7 digit dengan 2 digit tahun di depan (cth: 2411010 -> 202411010)
  if (digits.length === 7) {
    return `20${digits}`
  }

  // Jika format 8 digit tanpa prefix 20 (cth: 24110010)
  if (digits.length === 8 && !digits.startsWith('20')) {
    return `20${digits}`
  }

  return digits
}
