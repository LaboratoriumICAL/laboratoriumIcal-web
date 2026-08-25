'use client'

import { useState, useEffect } from 'react'
import { Icon } from '../components/Icon'
import { getSupabaseBrowser } from '../lib/supabaseClient'

interface ResetPasswordPageProps {
  setCurrentPage: (page: string) => void
}

export default function ResetPasswordPage({ setCurrentPage }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    let isMounted = true

    const safetyTimer = setTimeout(() => {
      if (isMounted) setCheckingSession(false)
    }, 2500)

    const checkRecoverySession = async () => {
      try {
        const sb = getSupabaseBrowser()

        const { data: { session } } = await sb.auth.getSession()
        if (session && isMounted) {
          setHasValidSession(true)
          setCheckingSession(false)
          return
        }

        if (typeof window !== 'undefined') {
          const hash = window.location.hash
          const search = window.location.search
          const isRecoveryUrl =
            hash.includes('type=recovery') ||
            hash.includes('access_token') ||
            search.includes('type=recovery') ||
            search.includes('code=')

          if (isRecoveryUrl) {
            setTimeout(async () => {
              if (!isMounted) return
              const { data: { session: retrySession } } = await sb.auth.getSession()
              if (retrySession) {
                setHasValidSession(true)
              } else {
                setHasValidSession(true)
              }
              setCheckingSession(false)
            }, 800)
            return
          }
        }

        if (isMounted) {
          setHasValidSession(false)
          setCheckingSession(false)
        }
      } catch {
        if (isMounted) {
          setHasValidSession(false)
          setCheckingSession(false)
        }
      }
    }

    try {
      const sb = getSupabaseBrowser()
      const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          if (isMounted) {
            setHasValidSession(true)
            setCheckingSession(false)
          }
        }
      })

      checkRecoverySession()

      return () => {
        isMounted = false
        clearTimeout(safetyTimer)
        subscription.unsubscribe()
      }
    } catch {
      checkRecoverySession()
      return () => {
        isMounted = false
        clearTimeout(safetyTimer)
      }
    }
  }, [])

  useEffect(() => {
    if (!success) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCurrentPage('login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [success, setCurrentPage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password baru minimal 8 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password baru.')
      return
    }

    setLoading(true)

    try {
      const sb = getSupabaseBrowser()
      const { error: updateError } = await sb.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw new Error(updateError.message || 'Gagal memperbarui password.')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(
        err.message?.includes('Auth session missing')
          ? 'Sesi reset password telah kadaluarsa. Silakan minta link reset baru.'
          : err.message || 'Terjadi kesalahan saat mengubah kata sandi.'
      )
    } finally {
      setLoading(false)
    }
  }

  const bubbleColors = [
    { bg: 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)', opacity: 0.5 }, // Sky Blue
    { bg: 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)', opacity: 0.45 }, // Lavender Purple
    { bg: 'linear-gradient(135deg, #6EE7B7 0%, #10B981 100%)', opacity: 0.5 }, // Mint Emerald
    { bg: 'linear-gradient(135deg, #FBCFE8 0%, #EC4899 100%)', opacity: 0.45 }, // Rose Pink
    { bg: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)', opacity: 0.5 }, // Warm Amber
    { bg: 'linear-gradient(135deg, #A5F3FC 0%, #06B6D4 100%)', opacity: 0.5 }, // Cyan Teal
    { bg: 'linear-gradient(135deg, #FED7AA 0%, #FB923C 100%)', opacity: 0.45 }, // Coral Peach
    { bg: 'linear-gradient(135deg, #A5B4FC 0%, #6366F1 100%)', opacity: 0.45 }, // Royal Indigo
  ]

  const particles = [
    { id: 0, size: 85, left: 8, delay: 0, duration: 11, ...bubbleColors[0] },
    { id: 1, size: 45, left: 22, delay: 2.2, duration: 8.5, ...bubbleColors[1] },
    { id: 2, size: 75, left: 35, delay: 0.8, duration: 12, ...bubbleColors[2] },
    { id: 3, size: 100, left: 55, delay: 3.1, duration: 14, ...bubbleColors[3] },
    { id: 4, size: 50, left: 68, delay: 1.4, duration: 9.5, ...bubbleColors[4] },
    { id: 5, size: 80, left: 82, delay: 2.8, duration: 13, ...bubbleColors[5] },
    { id: 6, size: 42, left: 92, delay: 0.5, duration: 8, ...bubbleColors[6] },
    { id: 7, size: 65, left: 3, delay: 1.9, duration: 10.5, ...bubbleColors[7] },
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: '#EEF5FA' }}
    >
      <div className="absolute inset-0 dots-bg opacity-30 pointer-events-none" />

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: '-120px',
            background: p.bg,
            opacity: p.opacity,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            animation: `bubble ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-md">
        {/* Header Back Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setCurrentPage('login')}
            className="inline-flex items-center gap-2 text-sm text-[#2F4D7B] hover:text-[#1B3258] transition-colors mb-4 font-semibold cursor-pointer"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            ← Kembali ke Login
          </button>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.8rem',
              color: '#1B3258',
              lineHeight: 1.2,
            }}
          >
            Reset Password
          </div>
          <p style={{ color: '#2F4D7B', marginTop: '6px', fontSize: '0.9rem' }}>
            Buat kata sandi baru yang kuat untuk akun Anda
          </p>
        </div>

        {checkingSession ? (
          <div
            className="rounded-3xl p-10 text-center animate-fadeInUp bg-white"
            style={{
              border: '2px solid #C6DBF2',
              boxShadow: '0 16px 60px rgba(92, 139, 200,0.12)',
            }}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <Icon name="loader" size={36} className="animate-spin text-[#5C8BC8]" />
              <p style={{ color: '#2F4D7B', fontSize: '0.95rem' }}>Memverifikasi tautan reset password...</p>
            </div>
          </div>
        ) : !hasValidSession && !success ? (
          <div
            className="rounded-3xl p-8 text-center animate-scaleIn bg-white"
            style={{
              border: '2px solid #FED7AA',
              boxShadow: '0 16px 60px rgba(234,88,12,0.12)',
            }}
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-orange-50 border border-orange-200">
              <Icon name="warning" size={32} color="#ea580c" strokeWidth={1.5} />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.3rem',
                color: '#9a3412',
                marginBottom: '0.5rem',
              }}
            >
              Link Tidak Valid atau Kadaluarsa
            </h2>

            <p style={{ color: '#2F4D7B', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Tautan reset password mungkin sudah pernah digunakan, tidak lengkap, atau telah kadaluarsa demi alasan keamanan.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setCurrentPage('forgot-password')}
                className="btn-primary w-full cursor-pointer"
              >
                Minta Link Reset Baru
              </button>
              <button
                onClick={() => setCurrentPage('login')}
                className="btn-secondary w-full cursor-pointer"
              >
                Kembali ke Login
              </button>
            </div>
          </div>
        ) : !success ? (
          <div
            className="rounded-3xl p-8 animate-fadeInUp bg-white"
            style={{
              border: '2px solid #C6DBF2',
              boxShadow: '0 16px 60px rgba(92, 139, 200,0.12)',
            }}
          >
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{
                  background: '#EEF5FA',
                  boxShadow: '0 4px 15px rgba(92, 139, 200,0.15)',
                }}
              >
                <Icon name="key" size={32} color="#2F4D7B" strokeWidth={1.5} />
              </div>
              <p style={{ color: '#2F4D7B', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Silakan masukkan kata sandi baru untuk akun Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    color: '#2F4D7B',
                    marginBottom: '6px',
                  }}
                >
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2F4D7B] transition-colors p-1 cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                  </button>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#5D789B', marginTop: '4px' }}>
                  Gunakan minimal 8 karakter dengan kombinasi huruf dan angka
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    color: '#2F4D7B',
                    marginBottom: '6px',
                  }}
                >
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2F4D7B] transition-colors p-1 cursor-pointer"
                    title={showConfirm ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    <Icon name={showConfirm ? 'eye-off' : 'eye'} size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-2xl px-4 py-3 text-sm flex items-start gap-1.5"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  <Icon name="warning" size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full text-center cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Icon name="loader" size={16} className="inline mr-1.5 align-text-bottom animate-spin" />
                    Menyimpan Password...
                  </>
                ) : (
                  <>
                    <Icon name="shield-check" size={16} className="inline mr-1.5 align-text-bottom" />
                    Simpan Password Baru
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div
            className="rounded-3xl p-8 text-center animate-scaleIn bg-white"
            style={{
              border: '2px solid #C6DBF2',
              boxShadow: '0 16px 60px rgba(92, 139, 200,0.15)',
            }}
          >
            <div className="mb-5 animate-float flex justify-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: '#EEF5FA',
                  boxShadow: '0 8px 25px rgba(92, 139, 200,0.18)',
                }}
              >
                <Icon name="check-circle" size={44} color="#2F4D7B" strokeWidth={1.5} />
              </div>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.4rem',
                color: '#1B3258',
                marginBottom: '0.75rem',
              }}
            >
              Password Berhasil Diubah!
            </h2>

            <p style={{ color: '#2F4D7B', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Kata sandi akun Anda telah berhasil diperbarui. Silakan login kembali menggunakan password baru Anda.
            </p>

            <div
              className="rounded-2xl p-3 mb-6"
              style={{ background: '#EEF4FB', border: '1px solid #C6DBF2' }}
            >
              <p style={{ color: '#2F4D7B', fontSize: '0.8rem' }}>
                Mengalihkan ke halaman login otomatis dalam <strong>{countdown}</strong> detik...
              </p>
            </div>

            <button
              onClick={() => setCurrentPage('login')}
              className="btn-primary w-full cursor-pointer"
            >
              Masuk Sekarang →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
