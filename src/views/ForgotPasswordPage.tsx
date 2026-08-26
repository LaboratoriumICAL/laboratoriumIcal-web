'use client'

import { useState } from 'react'
import { Icon } from '../components/Icon'

interface ForgotPasswordPageProps {
  setCurrentPage: (page: string) => void
}

interface ResetResponseData {
  maskedEmail: string
  name: string
  nim: string
}

export default function ForgotPasswordPage({ setCurrentPage }: ForgotPasswordPageProps) {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resultData, setResultData] = useState<ResetResponseData | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal memproses permintaan reset password.')
      }

      setResultData(json.data)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses permintaan reset password.')
    } finally {
      setLoading(false)
    }
  }

  const bubbleColors = [
    { bg: 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)', opacity: 0.5 },
    { bg: 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)', opacity: 0.45 },
    { bg: 'linear-gradient(135deg, #6EE7B7 0%, #10B981 100%)', opacity: 0.5 },
    { bg: 'linear-gradient(135deg, #FBCFE8 0%, #EC4899 100%)', opacity: 0.45 },
    { bg: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)', opacity: 0.5 },
    { bg: 'linear-gradient(135deg, #A5F3FC 0%, #06B6D4 100%)', opacity: 0.5 },
    { bg: 'linear-gradient(135deg, #FED7AA 0%, #FB923C 100%)', opacity: 0.45 },
    { bg: 'linear-gradient(135deg, #A5B4FC 0%, #6366F1 100%)', opacity: 0.45 },
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
              color: '#00142F',
              lineHeight: 1.2,
            }}
          >
            Lupa Kata Sandi
          </div>
          <p style={{ color: '#24456F', marginTop: '6px', fontSize: '0.9rem' }}>
            Praktikan cukup masukkan <strong>NIM</strong> Anda untuk menerima tautan pemulihan
          </p>
        </div>

        {/* Card Form */}
        <div
          className="rounded-3xl p-7 sm:p-8 bg-white"
          style={{
            border: '2px solid #BED8F0',
            boxShadow: '0 16px 60px rgba(0, 20, 47, 0.08)',
          }}
        >
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: '#162D4E',
                    marginBottom: '6px',
                  }}
                >
                  NIM atau Alamat Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input-field pl-10"
                    placeholder="Contoh: 202411001 (atau email)"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value)
                      if (error) setError('')
                    }}
                    required
                    autoFocus
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name={identifier.includes('@') ? 'mail' : 'graduation-cap'} size={18} />
                  </div>
                </div>
                <div className="mt-2 p-2.5 rounded-xl bg-[#F0F6FD] border border-[#D6E4F0] text-xs text-[#2C4D78] flex items-start gap-2">
                  <span className="text-[#0260D4] font-bold">💡</span>
                  <p className="leading-relaxed">
                    <strong>Praktikan:</strong> Cukup masukkan NIM Anda. Tautan reset password akan otomatis dikirimkan ke email yang Anda daftarkan.
                  </p>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-2xl px-4 py-3 text-xs sm:text-sm flex items-start gap-2 animate-fadeIn"
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                  }}
                >
                  <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full text-center flex items-center justify-center gap-2 cursor-pointer font-bold py-3.5 rounded-2xl"
                disabled={loading || !identifier.trim()}
                style={{
                  background: 'linear-gradient(135deg, #00142F 0%, #002466 45%, #0260D4 100%)',
                  boxShadow: '0 8px 24px rgba(2, 96, 212, 0.25)',
                }}
              >
                {loading ? (
                  <>
                    <Icon name="loader" size={16} className="animate-spin" />
                    <span>Mencari Akun & Mengirim Tautan...</span>
                  </>
                ) : (
                  <>
                    <Icon name="send" size={16} />
                    <span>Kirim Tautan Reset Password</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-2 animate-fadeInUp">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-md"
                style={{ background: '#ECFDF5', border: '2px solid #A7F3D0' }}
              >
                <Icon name="check-circle" size={34} color="#059669" />
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: '#00142F',
                  marginBottom: '8px',
                }}
              >
                Tautan Berhasil Dikirim!
              </h3>
              <p style={{ color: '#24456F', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Tautan pemulihan kata sandi telah dikirimkan ke alamat email terdaftar akun Anda.
              </p>

              {/* Data Rincian Email Penerima */}
              <div
                className="rounded-2xl p-4 mb-5 text-left text-xs sm:text-sm space-y-2 border"
                style={{ background: '#F0F6FD', borderColor: '#BAD6EB', color: '#162D4E' }}
              >
                {resultData?.name && (
                  <div className="flex items-center gap-2">
                    <Icon name="user" size={14} color="#0260D4" />
                    <span>Nama: <strong>{resultData.name}</strong></span>
                  </div>
                )}
                {resultData?.nim && (
                  <div className="flex items-center gap-2">
                    <Icon name="graduation-cap" size={14} color="#0260D4" />
                    <span>NIM: <strong>{resultData.nim}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 border-t border-[#D6E4F0]">
                  <Icon name="mail" size={14} color="#059669" />
                  <span>Email Penerima: <strong className="text-emerald-700 font-mono text-[0.92rem]">{resultData?.maskedEmail}</strong></span>
                </div>
              </div>

              {/* Tips Petunjuk */}
              <div
                className="rounded-2xl p-3.5 mb-5 text-left text-xs space-y-1.5"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
              >
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Icon name="info" size={13} color="#D97706" /> Petunjuk:
                </div>
                <div>• Periksa kotak masuk (Inbox) atau folder <strong>Spam / Junk</strong> email tersebut.</div>
                <div>• Tautan reset password berlaku selama <strong>1 jam</strong> sejak dikirimkan.</div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="btn-primary w-full cursor-pointer py-3 font-bold rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #00142F 0%, #002466 45%, #0260D4 100%)',
                  }}
                >
                  Kembali ke Halaman Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setIdentifier('')
                    setResultData(null)
                  }}
                  className="text-xs text-[#0260D4] hover:text-[#00142F] font-bold cursor-pointer underline"
                >
                  Kirim ulang dengan NIM atau email lain
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
