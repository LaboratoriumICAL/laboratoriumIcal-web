import { useState } from 'react'

import { Icon } from '../components/Icon'
import { getSupabaseBrowser } from '../lib/supabaseClient'

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

      // Asisten login pakai NAMA LENGKAP lewat API route di server
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

        onLogin({
          role: 'asisten',
          name: result.profile.nama_lengkap,
          nim: result.profile.nim || undefined,
          id: result.profile.id,
        })
        setCurrentPage('dashboard-assistant')
        return
      }

      // Praktikan login pakai NIM lewat API route di server
      const res = await fetch('/api/auth/login-praktikan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, password }),
      })
      const result = await res.json()
      if (!res.ok || !result.ok) {
        // Increment counter kegagalan hanya jika kredensial salah (status 400)
        if (res.status === 400) {
          setFailedAttempts((n) => n + 1)
        }
        throw new Error(result.error || 'NIM atau password salah.')
      }

      // Login berhasil, reset counter
      setFailedAttempts(0)

      const { error: eSetSession } = await sb.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      })
      if (eSetSession) throw new Error('Login gagal.')

      onLogin({
        role: 'praktikan',
        name: result.profile.nama_lengkap,
        nim: result.profile.nim || undefined,
        id: result.profile.id,
      })
      setCurrentPage('dashboard-student')
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.')
    } finally {
      setLoading(false)
    }
  }

  const particles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    size: Math.random() * 80 + 30,
    left: Math.random() * 100,
    delay: Math.random() * 4,
    duration: Math.random() * 5 + 7,
    color: ['#48cae4', '#0077b6', '#023e8a', '#03045e', '#9ca3af'][i % 5],
  }))

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: 'linear-gradient(135deg, #f0fbfb, #e0f7fa, #ccf0f2)' }}
    >
      <div className="absolute inset-0 dots-bg opacity-50" />

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-30 pointer-events-none"
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

      <div className="relative z-10 w-full max-w-4xl">
        {/* Back + Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => setCurrentPage('home')}
            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 transition-colors mb-6"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            ← Kembali ke Beranda
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
            Selamat Datang di ICAL
          </div>
          <p style={{ color: '#64748b', marginTop: '6px' }}>Pilih tipe akun untuk melanjutkan</p>
        </div>

        {/* Choice screen */}
        {choice === 'select' && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Praktikan card */}
            <button
              onClick={() => handleChoose('student')}
              className="rounded-3xl p-8 text-center group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              style={{
                background: 'white',
                border: '2px solid #e0f7fa',
                boxShadow: '0 8px 40px rgba(1,92,97,0.10)',
              }}
            >
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #f0fbfb, #e0f7fa)', boxShadow: '0 8px 20px rgba(1,92,97,0.15)' }}
              >
                <Icon name="graduation-cap" size={40} color="#015c61" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: '#015c61', marginBottom: '0.5rem' }}>
                Praktikan
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Login sebagai mahasiswa untuk mengakses nilai, jadwal, dan absensimu
              </p>
              <div
                className="mt-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all group-hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #015c61, #06aeb7)', fontFamily: 'var(--font-heading)' }}
              >
                Masuk sebagai Praktikan →
              </div>
            </button>

            {/* Asisten card */}
            <button
              onClick={() => handleChoose('assistant')}
              className="rounded-3xl p-8 text-center group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              style={{
                background: 'white',
                border: '2px solid #cbf4f6',
                boxShadow: '0 8px 40px rgba(1,67,70,0.10)',
              }}
            >
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #e6f9fa, #cbf4f6)', boxShadow: '0 8px 20px rgba(1,67,70,0.15)' }}
              >
                <Icon name="briefcase" size={40} color="#014346" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: '#013a3d', marginBottom: '0.5rem' }}>
                Asisten
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Login sebagai asisten untuk mengelola kelompok, nilai, dan absensi praktikan
              </p>
              <div
                className="mt-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all group-hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #014346, #016e75)', fontFamily: 'var(--font-heading)' }}
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
              className="rounded-3xl p-8"
              style={{ background: 'white', border: '2px solid #e0f7fa', boxShadow: '0 16px 60px rgba(1,92,97,0.15)' }}
            >
              <div className="text-center mb-6">
                <div className="mb-3 flex justify-center"><Icon name="graduation-cap" size={44} color="#015c61" strokeWidth={1.5} /></div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: '#015c61' }}>
                  Login Praktikan
                </h2>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                    NIM
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: 2022110001"
                    value={nim}
                    onChange={(e) => {
                      setNim(e.target.value)
                      if (error) setError('')
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pr-10"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (error) setError('')
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-700 transition-colors p-1"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm space-y-2" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                    <div className="flex items-start gap-1.5">
                      <Icon name="warning" size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                    {choice === 'student' && failedAttempts >= 3 && (
                      <div className="pt-2 border-t border-red-200 text-xs flex items-center justify-between">
                        <span style={{ color: '#7f1d1d' }}>Lupa password?</span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage('forgot-password')}
                          className="font-bold text-teal-700 hover:text-teal-900 underline transition-colors ml-2"
                        >
                          Klik di sini untuk reset →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full text-center" disabled={loading}>
                  {loading ? (<><Icon name="loader" size={16} className="inline mr-1.5 align-text-bottom animate-spin" /> Masuk...</>) : 'Masuk'}
                </button>
                <div className="text-center text-sm" style={{ color: '#64748b' }}>
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => setCurrentPage('register')}
                    className="font-semibold text-teal-600 hover:text-teal-800"
                  >
                    Daftar sekarang
                  </button>
                </div>
              </form>
            </div>
            <div className="text-center mt-4">
              <button onClick={() => setChoice('select')} className="text-sm text-teal-600 hover:text-teal-800">
                ← Ganti tipe akun
              </button>
            </div>
          </div>
        )}

        {/* Assistant login form */}
        {choice === 'assistant' && (
          <div className="max-w-md mx-auto animate-slideIn">
            <div
              className="rounded-3xl p-8"
              style={{ background: 'white', border: '2px solid #cbf4f6', boxShadow: '0 16px 60px rgba(1,67,70,0.15)' }}
            >
              <div className="text-center mb-6">
                <div className="mb-3 flex justify-center"><Icon name="briefcase" size={44} color="#014346" strokeWidth={1.5} /></div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem', color: '#013a3d' }}>
                  Login Asisten
                </h2>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Masukkan nama lengkap asisten"
                    value={namaLengkap}
                    onChange={(e) => {
                      setNamaLengkap(e.target.value)
                      if (error) setError('')
                    }}
                    required
                    style={{ borderColor: '#ede9fe' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pr-10"
                      placeholder="Masukkan password asisten"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (error) setError('')
                      }}
                      required
                      style={{ borderColor: '#ede9fe' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-700 transition-colors p-1"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                    <Icon name="warning" size={15} className="inline mr-1 align-text-bottom" /> {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #014346, #016e75)', fontFamily: 'var(--font-heading)', opacity: loading ? 0.7 : 1 }}
                  disabled={loading}
                >
                  {loading ? (<><Icon name="loader" size={16} className="inline mr-1.5 align-text-bottom animate-spin" /> Masuk...</>) : 'Masuk sebagai Asisten'}
                </button>
              </form>
            </div>
            <div className="text-center mt-4">
              <button onClick={() => setChoice('select')} className="text-sm text-teal-600 hover:text-teal-800">
                ← Ganti tipe akun
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
