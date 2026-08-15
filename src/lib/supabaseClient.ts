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
