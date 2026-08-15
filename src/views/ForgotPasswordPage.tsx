'use client'

import { useState } from 'react'
import { Icon } from '../components/Icon'
import { getSupabaseBrowser } from '../lib/supabaseClient'

interface ForgotPasswordPageProps {
  setCurrentPage: (page: string) => void
}

export default function ForgotPasswordPage({ setCurrentPage }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const sb = getSupabaseBrowser()
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : ''

      const { error: resetError } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })

      if (resetError) {
        // Catatan: Jika ada error jaringan/konfigurasi, tampilkan pesan ramah.
        // Demi privasi & keamanan, kegagalan umum tetap mengarahkan ke konfirmasi terkirim.
        if (resetError.message && !resetError.message.toLowerCase().includes('rate limit')) {
          console.warn('Supabase resetPasswordForEmail response:', resetError.message)
        }
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses permintaan reset password.')
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
            Lupa Password Praktikan
          </div>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '0.9rem' }}>
            Atur ulang kata sandi akun praktikan Anda via email
          </p>
        </div>

        {!submitted ? (
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
                <Icon name="mail" size={32} color="#015c61" strokeWidth={1.5} />
              </div>
              <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Masukkan alamat email praktikan yang terdaftar pada akun Anda. Kami akan mengirimkan tautan untuk membuat password baru.
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
                  Alamat Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
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
                    Mengirim Link...
                  </>
                ) : (
                  <>
                    <Icon name="send" size={16} className="inline mr-1.5 align-text-bottom" />
                    Kirim Link Reset Password
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
                >
                  Ingat password Anda? Masuk sekarang
                </button>
              </div>
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
              Cek Email Anda
            </h2>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              Jika email <strong>{email}</strong> terdaftar di sistem ICAL, kami telah mengirimkan link untuk mengatur ulang password Anda.
            </p>

            <div
              className="rounded-2xl p-4 mb-6 text-left"
              style={{ background: '#f0fbfb', border: '1px solid #a5eef2' }}
            >
              <div className="flex items-start gap-2.5 text-xs text-teal-900 leading-relaxed">
                <Icon name="lightbulb" size={16} className="mt-0.5 flex-shrink-0 text-teal-600" />
                <span>
                  Silakan periksa kotak masuk (Inbox) atau folder <strong>Spam / Junk</strong> Anda. Tautan reset password biasanya berlaku selama 1 jam.
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setCurrentPage('login')}
                className="btn-primary w-full"
              >
                Kembali ke Halaman Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                }}
                className="w-full py-2.5 text-xs text-teal-700 hover:text-teal-900 font-medium transition-colors"
              >
                Kirim ulang ke email lain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
