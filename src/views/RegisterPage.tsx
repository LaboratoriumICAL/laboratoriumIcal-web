import { useState, useEffect } from 'react'
import { Icon } from '../components/Icon'

interface RegisterPageProps {
  setCurrentPage: (page: string) => void
}

interface JurusanOption { id: string; kode: string; nama: string; kelasTersedia: string[] }

export default function RegisterPage({ setCurrentPage }: RegisterPageProps) {
  const [form, setForm] = useState({ name: '', nim: '', program: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jurusanList, setJurusanList] = useState<JurusanOption[]>([])

  useEffect(() => {
    fetch('/api/jurusan')
      .then((r) => r.json())
      .then((json) => setJurusanList(json.jurusan || []))
      .catch(() => setJurusanList([]))
  }, [])

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
      const res = await fetch('/api/auth/register-praktikan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          nim: form.nim,
          jurusanKode: form.program,
          email: form.email,
          password: form.password,
        }),
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

  const set = (field: string, val: string) => setForm((p) => ({ ...p, [field]: val }))

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: '#EEF5FA' }}
    >
      <div className="absolute inset-0 dots-bg opacity-30" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <button
            onClick={() => setCurrentPage('login')}
            className="inline-flex items-center gap-2 text-sm text-[#2F4D7B] hover:text-[#1B3258] transition-colors mb-4 font-semibold cursor-pointer"
          >
            ← Kembali ke Login
          </button>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.8rem', color: '#1B3258' }}>
            Daftar Akun Praktikan
          </div>
          <p style={{ color: '#2F4D7B', marginTop: '6px', fontSize: '0.9rem' }}>
            Hanya NIM yang telah didaftarkan asisten yang bisa membuat akun
          </p>
        </div>

        {step === 1 ? (
          <div
            className="rounded-3xl p-8 animate-fadeInUp bg-white"
            style={{ border: '2px solid #C6DBF2', boxShadow: '0 16px 60px rgba(92, 139, 200,0.12)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px' }}>
                  Nama Lengkap
                </label>
                <input type="text" className="input-field" placeholder="Masukkan nama lengkap" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px' }}>
                  NIM
                </label>
                <input type="text" className="input-field" placeholder="Contoh: 2022110001" value={form.nim} onChange={(e) => set('nim', e.target.value)} required />
                <p style={{ fontSize: '0.72rem', color: '#5D789B', marginTop: '4px' }}>
                  NIM harus sudah terdaftar oleh asisten sebagai anggota kelompok
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px' }}>
                  Program Studi
                </label>
                <select
                  className="input-field"
                  value={form.program}
                  onChange={(e) => set('program', e.target.value)}
                  required
                >
                  <option value="">-- Pilih Program Studi --</option>
                  {jurusanList.map((j) => <option key={j.id} value={j.kode}>{j.nama}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px' }}>
                  Email
                </label>
                <input type="email" className="input-field" placeholder="nama@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px' }}>
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2F4D7B] transition-colors p-1 cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px' }}>
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2F4D7B] transition-colors p-1 cursor-pointer"
                    aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                    title={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    <Icon name={showConfirm ? 'eye-off' : 'eye'} size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl px-4 py-3 text-sm flex items-start gap-1.5" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  <Icon name="warning" size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full text-center cursor-pointer"
                disabled={loading}
              >
                {loading ? (<><Icon name="loader" size={16} className="inline mr-1.5 align-text-bottom animate-spin" /> Memproses...</>) : (<><Icon name="check-circle" size={16} className="inline mr-1.5 align-text-bottom" /> Daftar Sekarang</>)}
              </button>

              <p className="text-center text-sm" style={{ color: '#2F4D7B' }}>
                Sudah punya akun?{' '}
                <button type="button" onClick={() => setCurrentPage('login')} className="font-semibold text-[#2F4D7B] hover:text-[#1B3258] cursor-pointer">
                  Login
                </button>
              </p>
            </form>
          </div>
        ) : (
          <div
            className="rounded-3xl p-8 text-center animate-scaleIn bg-white"
            style={{ border: '2px solid #C6DBF2', boxShadow: '0 16px 60px rgba(92, 139, 200,0.15)' }}
          >
            <div className="mb-5 animate-float flex justify-center"><Icon name="party" size={54} color="#5C8BC8" strokeWidth={1.5} /></div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', color: '#1B3258', marginBottom: '1rem' }}>
              Akun Berhasil Dibuat!
            </h2>
            <p style={{ color: '#2F4D7B', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Selamat <strong>{form.name}</strong>! Akun praktikanmu telah berhasil dibuat dan sudah bisa langsung dipakai untuk login.
            </p>
            <div
              className="rounded-2xl p-4 mb-5"
              style={{ background: '#EEF4FB', border: '1px solid #C6DBF2' }}
            >
              <div className="text-sm space-y-1" style={{ color: '#2F4D7B' }}>
                <div className="flex items-center gap-1.5"><Icon name="mail" size={13} /> Email: <strong>{form.email}</strong></div>
                <div className="flex items-center gap-1.5"><Icon name="graduation-cap" size={13} /> NIM: <strong>{form.nim}</strong></div>
                <div className="flex items-center gap-1.5"><Icon name="landmark" size={13} /> Prodi: <strong>{jurusanList.find((j) => j.kode === form.program)?.nama || form.program}</strong></div>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage('login')}
              className="btn-primary w-full cursor-pointer"
            >
              Pergi ke Halaman Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
