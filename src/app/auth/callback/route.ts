import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Route handler untuk callback OAuth Supabase (PKCE flow).
 * Ketika Azure AD berhasil mengautentikasi user, Supabase mengembalikan kode exchange ke endpoint ini.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || searchParams.get('returnTo') || 'module'

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      try {
        await supabase.auth.exchangeCodeForSession(code)
      } catch (err) {
        console.error('Error saat exchangeCodeForSession:', err)
      }
    }
  }

  // Redirect ke halaman web yang dituju (misal halaman modul)
  return NextResponse.redirect(`${origin}/?page=${encodeURIComponent(next)}`)
}
