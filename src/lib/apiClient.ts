'use client'

import { getSupabaseBrowser } from './supabaseClient'

/**
 * Client-side wrapper pengganti `fetch()` standar untuk memanggil API route internal ICAL.
 *
 * Fungsi ini otomatis menyisipkan header `Authorization: Bearer <access_token>` dari sesi Supabase
 * yang sedang aktif di browser, sehingga request ke endpoint yang diproteksi tidak ditolak (401/403).
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)

  try {
    const sb = getSupabaseBrowser()
    const { data } = await sb.auth.getSession()
    const token = data?.session?.access_token

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  } catch (err) {
    // Tangani error pengambilan session secara graceful
    console.warn('apiFetch: Tidak dapat membaca sesi Supabase aktif', err)
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
