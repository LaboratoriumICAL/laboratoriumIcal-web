import { useState } from 'react'
import { Icon } from '../components/Icon'

interface RegisterAsistenPageProps {
  setCurrentPage: (page: string) => void
}

export default function RegisterAsistenPage({ setCurrentPage }: RegisterAsistenPageProps) {
  const [form, setForm] = useState({ name: '', password: '', confirm: '', accessCode: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, val: string) => setForm((p) => ({ ...p, [field]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Password tidak cocok.')
      return
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register-asisten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, password: form.password, accessCode: form.accessCode }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mendaftar.')
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe, #e0f2fe)' }}
    >
      <div className="absolute inset-0 dots-bg opacity-40" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <button
            onClick={() => setCurrentPage('login')}
            className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors mb-4"
          >
            ← Kembali ke Login
          </button>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.8rem', color: '#4c1d95' }}>
            Daftar Akun Asisten
          </div>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '0.9rem' }}>
            Butuh kode akses asisten dari koordinator laboratorium
          </p>
        </div>

        {step === 1 ? (
          <div
            className="rounded-3xl p-8 animate-fadeInUp"
            style={{ background: 'white', border: '2px solid #ede9fe', boxShadow: '0 16px 60px rgba(124,58,237,0.12)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                  Nama Lengkap
                </label>
                <input type="text" className="input-field" placeholder="Masukkan nama lengkap" value={form.name} onChange={(e) => set('name', e.target.value)} required style={{ borderColor: '#ede9fe' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Min. 8 karakter"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
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
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Ulangi password"
                    value={form.confirm}
                    onChange={(e) => set('confirm', e.target.value)}
                    required
                    style={{ borderColor: '#ede9fe' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-700 transition-colors p-1"
                    aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                    title={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    <Icon name={showConfirm ? 'eye-off' : 'eye'} size={18} />
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                  Kode Akses Asisten
                </label>
                <input type="text" className="input-field" placeholder="Dapatkan dari koordinator" value={form.accessCode} onChange={(e) => set('accessCode', e.target.value)} required style={{ borderColor: '#ede9fe' }} />
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  <Icon name="warning" size={15} className="inline mr-1 align-text-bottom" /> {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', fontFamily: 'var(--font-heading)', opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? (<><Icon name="loader" size={16} className="inline mr-1.5 align-text-bottom animate-spin" /> Memproses...</>) : (<><Icon name="check-circle" size={16} className="inline mr-1.5 align-text-bottom" /> Daftar Sekarang</>)}
              </button>

              <p className="text-center text-sm" style={{ color: '#64748b' }}>
                Sudah punya akun?{' '}
                <button type="button" onClick={() => setCurrentPage('login')} className="font-semibold text-purple-600 hover:text-purple-800">
                  Login
                </button>
              </p>
            </form>
          </div>
        ) : (
          <div
            className="rounded-3xl p-8 text-center animate-scaleIn"
            style={{ background: 'white', border: '2px solid #ede9fe', boxShadow: '0 16px 60px rgba(124,58,237,0.15)' }}
          >
            <div className="mb-5 animate-float flex justify-center"><Icon name="party" size={54} color="#7c3aed" strokeWidth={1.5} /></div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: '#4c1d95', marginBottom: '1rem' }}>
              Akun Asisten Berhasil Dibuat!
            </h2>
            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Selamat <strong>{form.name}</strong>! Akun asistenmu sudah aktif dan bisa langsung dipakai untuk login.
            </p>
            <button onClick={() => setCurrentPage('login')} className="btn-primary w-full">
              Pergi ke Halaman Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
