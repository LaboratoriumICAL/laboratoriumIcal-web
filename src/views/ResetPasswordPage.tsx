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

  // Cek apakah ada sesi recovery atau token di URL
  useEffect(() => {
    let isMounted = true

    const safetyTimer = setTimeout(() => {
      if (isMounted) setCheckingSession(false)
    }, 2500)

    const checkRecoverySession = async () => {
      try {
        const sb = getSupabaseBrowser()

        // 1. Cek sesi yang sedang aktif
        const { data: { session } } = await sb.auth.getSession()
        if (session && isMounted) {
          setHasValidSession(true)
          setCheckingSession(false)
          return
        }

        // 2. Cek apakah ada hash atau query recovery di URL
        if (typeof window !== 'undefined') {
          const hash = window.location.hash
          const search = window.location.search
          const isRecoveryUrl =
            hash.includes('type=recovery') ||
            hash.includes('access_token') ||
            search.includes('type=recovery') ||
            search.includes('code=')

          if (isRecoveryUrl) {
            // Tunggu sebentar agar supabase-js selesai memproses hash URL
            setTimeout(async () => {
              if (!isMounted) return
              const { data: { session: retrySession } } = await sb.auth.getSession()
              if (retrySession) {
                setHasValidSession(true)
              } else {
                // Walau getSession belum ready, token ada di URL -- tetap izinkan coba submit
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
      } catch (e) {
        if (isMounted) {
          setHasValidSession(false)
          setCheckingSession(false)
        }
      }
    }

    // Dengarkan event auth state change jika event PASSWORD_RECOVERY datang asinkron
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

  // Auto redirect countdown saat sukses
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

  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: (i * 12) + 35,
    left: (i * 13) % 95,
    delay: (i * 0.6) % 4,
    duration: (i * 1.2) + 8,
    color: ['#48cae4', '#0077b6', '#023e8a', '#06aeb7', '#9ca3af'][i % 5],
  }))

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: 'linear-gradient(135deg, #f0fbfb, #e0f7fa, #ccf0f2)' }}
    >
      <div className="absolute inset-0 dots-bg opacity-40 pointer-events-none" />

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-25 pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: '-5%',
            background: `radial-gradient(circle, ${p.color}, transparent)`,
            animation: `bubble ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-md">
        {/* Header Back Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setCurrentPage('login')}
            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 transition-colors mb-4"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            ← Kembali ke Login
          </button>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.8rem',
              color: '#015c61',
              lineHeight: 1.2,
            }}
          >
            Reset Password
          </div>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '0.9rem' }}>
            Buat kata sandi baru yang kuat untuk akun Anda
          </p>
        </div>

        {checkingSession ? (
          <div
            className="rounded-3xl p-10 text-center animate-fadeInUp"
            style={{
              background: 'white',
              border: '2px solid #a5eef2',
              boxShadow: '0 16px 60px rgba(1,92,97,0.12)',
            }}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <Icon name="loader" size={36} className="animate-spin text-teal-600" />
              <p style={{ color: '#475569', fontSize: '0.95rem' }}>Memverifikasi tautan reset password...</p>
            </div>
          </div>
        ) : !hasValidSession && !success ? (
          <div
            className="rounded-3xl p-8 text-center animate-scaleIn"
            style={{
              background: 'white',
              border: '2px solid #fed7aa',
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

            <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Tautan reset password mungkin sudah pernah digunakan, tidak lengkap, atau telah kadaluarsa demi alasan keamanan.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setCurrentPage('forgot-password')}
                className="btn-primary w-full"
              >
                Minta Link Reset Baru
              </button>
              <button
                onClick={() => setCurrentPage('login')}
                className="btn-secondary w-full"
              >
                Kembali ke Login
              </button>
            </div>
          </div>
        ) : !success ? (
          <div
            className="rounded-3xl p-8 animate-fadeInUp"
            style={{
              background: 'white',
              border: '2px solid #a5eef2',
              boxShadow: '0 16px 60px rgba(1,92,97,0.12)',
            }}
          >
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #f0fbfb, #e0f7fa)',
                  boxShadow: '0 4px 15px rgba(1,92,97,0.1)',
                }}
              >
                <Icon name="key" size={32} color="#015c61" strokeWidth={1.5} />
              </div>
              <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.6 }}>
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
                    color: '#475569',
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-700 transition-colors p-1"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                  </button>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                  Gunakan minimal 8 karakter dengan kombinasi huruf dan angka
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    color: '#475569',
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-700 transition-colors p-1"
                    title={showConfirm ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    <Icon name={showConfirm ? 'eye-off' : 'eye'} size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
                >
                  <Icon name="warning" size={15} className="inline mr-1 align-text-bottom" /> {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #015c61, #06aeb7)',
                  fontFamily: 'var(--font-heading)',
                }}
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
            className="rounded-3xl p-8 text-center animate-scaleIn"
            style={{
              background: 'white',
              border: '2px solid #a5eef2',
              boxShadow: '0 16px 60px rgba(1,92,97,0.15)',
            }}
          >
            <div className="mb-5 animate-float flex justify-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #e6f9fa, #cbf4f6)',
                  boxShadow: '0 8px 25px rgba(1,92,97,0.15)',
                }}
              >
                <Icon name="check-circle" size={44} color="#015c61" strokeWidth={1.5} />
              </div>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.4rem',
                color: '#014346',
                marginBottom: '0.75rem',
              }}
            >
              Password Berhasil Diubah!
            </h2>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Kata sandi akun Anda telah berhasil diperbarui. Silakan login kembali menggunakan password baru Anda.
            </p>

            <div
              className="rounded-xl p-3 mb-6"
              style={{ background: '#f0fbfb', border: '1px solid #a5eef2' }}
            >
              <p style={{ color: '#015c61', fontSize: '0.8rem' }}>
                Mengalihkan ke halaman login otomatis dalam <strong>{countdown}</strong> detik...
              </p>
            </div>

            <button
              onClick={() => setCurrentPage('login')}
              className="btn-primary w-full"
            >
              Masuk Sekarang →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
