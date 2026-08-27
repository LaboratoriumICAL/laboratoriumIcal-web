'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '../lib/supabaseClient'
import { Icon } from './Icon'

interface AzureLoginButtonProps {
  returnTo?: string
  className?: string
  size?: 'md' | 'lg'
  fullWidth?: boolean
  label?: string
  showBadge?: boolean
  onSuccess?: () => void
}

/**
 * Microsoft 4-color tiles logo (Official Azure / Microsoft 365 branding)
 */
export const MicrosoftLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <rect x="1" y="1" width="9" height="9" fill="#F25022" rx="1" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" rx="1" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" rx="1" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" rx="1" />
  </svg>
)

export default function AzureLoginButton({
  returnTo = 'module',
  className = '',
  size = 'lg',
  fullWidth = true,
  label = 'Masuk dengan Akun ITPLN',
  showBadge = true,
  onSuccess,
}: AzureLoginButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAzureLogin = async () => {
    try {
      setLoading(true)
      setError('')

      if (typeof window !== 'undefined') {
        localStorage.setItem('ical_redirect_after_login', returnTo)
      }

      const sb = getSupabaseBrowser()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectUrl = `${origin}/?page=${encodeURIComponent(returnTo)}`

      const { data, error: oauthError } = await sb.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email',
          redirectTo: redirectUrl,
        },
      })

      if (oauthError) {
        throw oauthError
      }

      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url
      }

      onSuccess?.()
    } catch (err: any) {
      console.error('Azure OAuth Error:', err)
      setError(err.message || 'Gagal menghubungkan ke layanan Microsoft ITPLN.')
      setLoading(false)
    }
  }

  const isLarge = size === 'lg'

  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={handleAzureLogin}
        disabled={loading}
        className={`group relative overflow-hidden flex items-center justify-center gap-3 transition-all duration-300 font-semibold cursor-pointer select-none active:scale-[0.99] ${
          isLarge ? 'py-3.5 px-6 rounded-2xl text-sm sm:text-base' : 'py-2.5 px-4 rounded-xl text-xs sm:text-sm'
        } ${fullWidth ? 'w-full' : ''} ${className}`}
        style={{
          background: 'linear-gradient(135deg, #00142F 0%, #082F63 45%, #0284C7 100%)',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 24px rgba(0, 20, 47, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {/* Subtle hover sheen effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform pointer-events-none" />

        {loading ? (
          <>
            <Icon name="loader" size={isLarge ? 20 : 16} className="animate-spin text-white" />
            <span>Menghubungkan ke Microsoft...</span>
          </>
        ) : (
          <>
            <div className="p-1 rounded-lg bg-white shadow-xs shrink-0 flex items-center justify-center">
              <MicrosoftLogo size={isLarge ? 18 : 15} />
            </div>
            <span className="font-bold tracking-tight">{label}</span>
            {showBadge && (
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-blue-100 font-normal tracking-normal border border-white/20">
                @itpln.ac.id
              </span>
            )}
          </>
        )}
      </button>

      {error && (
        <div
          className="rounded-xl px-3.5 py-2.5 text-xs flex items-start gap-2 animate-fadeIn"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
        >
          <Icon name="warning" size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
