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
            Lupa Password Praktikan
          </div>
          <p style={{ color: '#2F4D7B', marginTop: '6px', fontSize: '0.9rem' }}>
            Masukkan email terdaftar Anda untuk menerima tautan pemulihan kata sandi
          </p>
        </div>

        {/* Card Form */}
        <div
          className="rounded-3xl p-8 bg-white"
          style={{
            border: '2px solid #C6DBF2',
            boxShadow: '0 16px 60px rgba(92, 139, 200,0.12)',
          }}
        >
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px' }}>
                  Email Terdaftar
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="input-field pl-10"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError('')
                    }}
                    required
                    autoFocus
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="mail" size={18} />
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#5D789B', marginTop: '6px', lineHeight: 1.4 }}>
                  Pastikan email yang dimasukkan sama dengan email saat pendaftaran akun praktikan.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl px-4 py-3 text-sm flex items-start gap-1.5" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  <Icon name="warning" size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full text-center flex items-center justify-center gap-2 cursor-pointer"
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <>
                    <Icon name="loader" size={16} className="animate-spin" />
                    <span>Mengirim Link...</span>
                  </>
                ) : (
                  <>
                    <Icon name="send" size={16} />
                    <span>Kirim Link Reset Password</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-2 animate-fadeInUp">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: '#EEF4FB', border: '1.5px solid #C6DBF2' }}
              >
                <Icon name="check-circle" size={32} color="#2F4D7B" />
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: '#1B3258',
                  marginBottom: '8px',
                }}
              >
                Tautan Terkirim!
              </h3>
              <p style={{ color: '#2F4D7B', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Jika akun dengan email <strong className="text-[#2F4D7B]">{email}</strong> terdaftar di sistem kami, Anda akan menerima email berisi tautan pemulihan kata sandi dalam beberapa menit.
              </p>
              <div
                className="rounded-2xl p-4 mb-6 text-left text-xs space-y-2"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#2F4D7B' }}
              >
                <div className="font-semibold text-slate-700">Tips:</div>
                <div>• Periksa folder <strong>Spam</strong> atau <strong>Promosi</strong> jika tidak ada di kotak masuk utama.</div>
                <div>• Tautan pemulihan berlaku selama 1 jam.</div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="btn-primary w-full cursor-pointer"
                >
                  Kembali ke Halaman Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setEmail('')
                  }}
                  className="text-xs text-[#2F4D7B] hover:text-[#1B3258] font-semibold cursor-pointer"
                >
                  Kirim ulang ke email lain
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
