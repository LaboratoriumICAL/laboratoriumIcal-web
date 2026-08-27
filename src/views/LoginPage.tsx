import { useState } from 'react'
import { Icon } from '../components/Icon'
import { getSupabaseBrowser } from '../lib/supabaseClient'
import AzureLoginButton from '../components/AzureLoginButton'

interface LoginPageProps {
  setCurrentPage: (page: string) => void
  onLogin: (user: { role: string; name: string; nim?: string; id: string }) => void
}

export default function LoginPage({ setCurrentPage, onLogin }: LoginPageProps) {
  const [choice, setChoice] = useState<'select' | 'student' | 'assistant'>('select')
  const [nim, setNim] = useState('')
  const [namaLengkap, setNamaLengkap] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChoose = (role: 'student' | 'assistant') => {
    setTransitioning(true)
    setError('')
    setFailedAttempts(0)
    setShowPassword(false)
    setTimeout(() => {
      setChoice(role)
      setTransitioning(false)
    }, 300)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const sb = getSupabaseBrowser()

      if (choice === 'assistant') {
        const res = await fetch('/api/auth/login-asisten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ namaLengkap, password }),
        })
        const result = await res.json()
        if (!res.ok || !result.ok) throw new Error(result.error || 'Nama lengkap atau password salah.')

        const { error: eSetSession } = await sb.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        })
        if (eSetSession) throw new Error('Login gagal.')

        if (typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem('ical_remember_me', 'true')
          } else {
            localStorage.removeItem('ical_remember_me')
          }
        }

        onLogin({
          role: 'asisten',
          name: result.profile.nama_lengkap,
          nim: result.profile.nim || undefined,
          id: result.profile.id,
        })
        setCurrentPage('dashboard-assistant')
        return
      }

      const res = await fetch('/api/auth/login-praktikan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, password }),
      })
      const result = await res.json()
      if (!res.ok || !result.ok) {
        setFailedAttempts((n) => n + 1)
        throw new Error(result.error || 'NIM atau kata sandi salah.')
      }

      setFailedAttempts(0)

      const { error: eSetSession } = await sb.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      })
      if (eSetSession) throw new Error('Login gagal.')

      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem('ical_remember_me', 'true')
        } else {
          localStorage.removeItem('ical_remember_me')
        }
      }

      onLogin({
        role: 'praktikan',
        name: result.profile.nama_lengkap,
        nim: result.profile.nim || undefined,
        id: result.profile.id,
      })
      setCurrentPage('dashboard-student')
    } catch (err: any) {
      setError(err.message || 'Login gagal.')
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
    { bg: 'linear-gradient(135deg, #DDD6FE 0%, #A855F7 100%)', opacity: 0.42 }, // Violet
    { bg: 'linear-gradient(135deg, #BAE6FD 0%, #0284C7 100%)', opacity: 0.5 }, // Ocean Blue
    { bg: 'linear-gradient(135deg, #BBF7D0 0%, #22C55E 100%)', opacity: 0.45 }, // Fresh Lime
    { bg: 'linear-gradient(135deg, #FECDD3 0%, #F43F5E 100%)', opacity: 0.42 }, // Crimson Rose
  ]

  const particles = [
    { id: 0, size: 85, left: 6, delay: 0, duration: 11, ...bubbleColors[0] },
    { id: 1, size: 45, left: 16, delay: 2.2, duration: 8.5, ...bubbleColors[1] },
    { id: 2, size: 75, left: 26, delay: 0.8, duration: 12, ...bubbleColors[2] },
    { id: 3, size: 105, left: 38, delay: 3.1, duration: 14, ...bubbleColors[3] },
    { id: 4, size: 55, left: 50, delay: 1.4, duration: 9.5, ...bubbleColors[4] },
    { id: 5, size: 85, left: 62, delay: 2.8, duration: 13, ...bubbleColors[5] },
    { id: 6, size: 42, left: 74, delay: 0.5, duration: 8, ...bubbleColors[6] },
    { id: 7, size: 95, left: 83, delay: 1.9, duration: 12.5, ...bubbleColors[7] },
    { id: 8, size: 60, left: 93, delay: 3.5, duration: 10, ...bubbleColors[8] },
    { id: 9, size: 50, left: 2, delay: 1.1, duration: 9, ...bubbleColors[9] },
    { id: 10, size: 80, left: 32, delay: 2.5, duration: 11.5, ...bubbleColors[10] },
    { id: 11, size: 90, left: 70, delay: 0.3, duration: 13.5, ...bubbleColors[11] },
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: '#EEF5FA' }}
    >
      <div className="absolute inset-0 dots-bg opacity-30" />

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

      <div className="relative z-10 w-full max-w-4xl">
        {/* Back + Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => setCurrentPage('home')}
            className="inline-flex items-center gap-2 text-sm text-[#24456F] hover:text-[#00142F] transition-colors mb-6 font-semibold cursor-pointer"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            ← Kembali ke Beranda
          </button>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.9rem',
              color: '#00142F',
              lineHeight: 1.2,
            }}
          >
            Selamat Datang di ICAL
          </div>
          <p style={{ color: '#24456F', marginTop: '6px' }}>Pilih tipe akun untuk melanjutkan</p>
        </div>

        {/* Choice screen */}
        {choice === 'select' && (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${
              transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {/* Praktikan card */}
            <button
              onClick={() => handleChoose('student')}
              className="rounded-3xl p-8 text-center group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white"
              style={{
                border: '2px solid #BED8F0',
                boxShadow: '0 8px 36px rgba(0, 20, 47, 0.08)',
              }}
            >
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: '#EEF5FA', boxShadow: '0 8px 20px rgba(0, 20, 47, 0.08)' }}
              >
                <Icon name="graduation-cap" size={40} color="#00142F" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: '#00142F', marginBottom: '0.5rem' }}>
                Praktikan
              </h2>
              <p style={{ color: '#24456F', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Login sebagai mahasiswa untuk mengakses nilai, jadwal, dan absensimu
              </p>
              <div
                className="mt-5 py-3 rounded-2xl font-semibold text-sm text-white transition-all group-hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #00142F 0%, #082F63 45%, #0284C7 100%)', fontFamily: 'var(--font-heading)' }}
              >
                Masuk sebagai Praktikan →
              </div>
            </button>

            {/* Asisten card */}
            <button
              onClick={() => handleChoose('assistant')}
              className="rounded-3xl p-8 text-center group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white"
              style={{
                border: '2px solid #BED8F0',
                boxShadow: '0 8px 36px rgba(0, 20, 47, 0.08)',
              }}
            >
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: '#EEF5FA', boxShadow: '0 8px 20px rgba(0, 20, 47, 0.08)' }}
              >
                <Icon name="briefcase" size={40} color="#00142F" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: '#00142F', marginBottom: '0.5rem' }}>
                Asisten
              </h2>
              <p style={{ color: '#24456F', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Akses portal khusus dan manajemen operasional tim asisten Laboratorium ICAL
              </p>
              <div
                className="mt-5 py-3 rounded-2xl font-semibold text-sm text-white transition-all group-hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #00142F 0%, #082F63 45%, #0284C7 100%)', fontFamily: 'var(--font-heading)' }}
              >
                Masuk sebagai Asisten →
              </div>
            </button>
          </div>
        )}

        {/* Student login form */}
        {choice === 'student' && (
          <div className="max-w-md mx-auto animate-slideIn">
            <div
              className="rounded-3xl p-8 sm:p-10 bg-white text-center"
              style={{ border: '2px solid #BED8F0', boxShadow: '0 16px 60px rgba(0, 20, 47, 0.08)' }}
            >
              <div className="mb-4 flex justify-center">
                <Icon name="graduation-cap" size={48} color="#00142F" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.5rem', color: '#00142F' }}>
                Login Praktikan
              </h2>
              <p style={{ color: '#24456F', fontSize: '0.875rem', marginTop: '6px', marginBottom: '24px', lineHeight: 1.6 }}>
                Gunakan akun Microsoft 365 resmi Institut Teknologi PLN (<strong>@itpln.ac.id</strong>) untuk masuk ke portal praktikum Anda.
              </p>

              {/* Tombol Login Azure OAuth ITPLN */}
              <div className="mb-6">
                <AzureLoginButton
                  returnTo="dashboard-student"
                  size="lg"
                  label="Masuk dengan Akun ITPLN"
                />
              </div>

              {/* Bantuan Lupa Sandi Microsoft 365 */}
              <div className="pt-5 border-t border-slate-100 text-xs" style={{ color: '#24456F' }}>
                Lupa kata sandi akun kampus?{' '}
                <a
                  href="https://passwordreset.microsoftonline.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#0284C7] hover:text-[#00142F] underline transition-colors"
                >
                  Reset Sandi Microsoft ITPLN ↗
                </a>
              </div>
            </div>

            <div className="text-center mt-5">
              <button onClick={() => setChoice('select')} className="text-sm text-[#2F4D7B] hover:text-[#1B3258] font-semibold cursor-pointer">
                ← Ganti tipe akun
              </button>
            </div>
          </div>
        )}

        {/* Assistant login form */}
        {choice === 'assistant' && (
          <div className="max-w-md mx-auto animate-slideIn">
            <div
              className="rounded-3xl p-8 bg-white"
              style={{ border: '2px solid #C6DBF2', boxShadow: '0 16px 60px rgba(27, 50, 88,0.12)' }}
            >
              <div className="text-center mb-6">
                <div className="mb-3 flex justify-center"><Icon name="briefcase" size={44} color="#1B3258" strokeWidth={1.5} /></div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: '#1B3258' }}>
                  Login Asisten
                </h2>
              </div>
              <form onSubmit={handleLogin} method="POST" action="#" className="space-y-4">
                <div>
                  <label htmlFor="asisten-nama" className="block text-xs font-semibold text-[#1B3258] mb-1.5 text-left">
                    Nama Lengkap Asisten
                  </label>
                  <input
                    id="asisten-nama"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="words"
                    className="input-field"
                    value={namaLengkap}
                    onChange={(e) => {
                      setNamaLengkap(e.target.value)
                      if (error) setError('')
                    }}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="asisten-password" className="block text-xs font-semibold text-[#1B3258] mb-1.5 text-left">
                    Kata Sandi
                  </label>
                  <input
                    id="asisten-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="input-field"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError('')
                    }}
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 text-[#1B3258] font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0260D4] focus:ring-[#0260D4] cursor-pointer"
                    />
                    <span>Ingat saya di perangkat ini</span>
                  </label>
                </div>

                {error && (
                  <div className="rounded-2xl px-4 py-3 text-sm flex items-start gap-1.5" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                    <Icon name="warning" size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full text-center cursor-pointer" disabled={loading}>
                  {loading ? (<><Icon name="loader" size={16} className="inline mr-1.5 align-text-bottom animate-spin" /> Masuk...</>) : 'Masuk'}
                </button>
              </form>
            </div>
            <div className="text-center mt-4">
              <button onClick={() => setChoice('select')} className="text-sm text-[#2F4D7B] hover:text-[#1B3258] font-semibold cursor-pointer">
                ← Ganti tipe akun
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
