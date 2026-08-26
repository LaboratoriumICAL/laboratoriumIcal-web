import { useState, useEffect } from 'react'
import { Icon } from '../components/Icon'

interface RegisterPageProps {
  setCurrentPage: (page: string) => void
}

interface JurusanOption {
  id: string
  kode: string
  nama: string
  kelasTersedia: string[]
}

interface VerifiedStudentData {
  nama: string
  nim: string
  namaKelompok: string
  jurusanKode: string
  jurusanNama: string
  praktikumNama: string
}

export default function RegisterPage({ setCurrentPage }: RegisterPageProps) {
  const [form, setForm] = useState({
    nim: '',
    name: '',
    program: '',
    email: '',
    password: '',
    confirm: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jurusanList, setJurusanList] = useState<JurusanOption[]>([])

  // NIM Verification States
  const [checkingNim, setCheckingNim] = useState(false)
  const [nimVerified, setNimVerified] = useState(false)
  const [verifiedInfo, setVerifiedInfo] = useState<VerifiedStudentData | null>(null)
  const [nimError, setNimError] = useState('')

  useEffect(() => {
    fetch('/api/jurusan')
      .then((r) => r.json())
      .then((json) => setJurusanList(json.jurusan || []))
      .catch(() => setJurusanList([]))
  }, [])

  // Fungsi Verifikasi NIM ke Server
  const handleVerifyNim = async (nimToTest?: string) => {
    const targetNim = (nimToTest !== undefined ? nimToTest : form.nim).trim()
    if (!targetNim || targetNim.length < 5) {
      setNimError('Masukkan minimal 5 digit NIM.')
      setNimVerified(false)
      setVerifiedInfo(null)
      return
    }

    setCheckingNim(true)
    setNimError('')
    setError('')

    try {
      const res = await fetch(`/api/auth/check-nim?nim=${encodeURIComponent(targetNim)}`)
      const json = await res.json()

      if (!res.ok || !json.ok) {
        setNimVerified(false)
        setVerifiedInfo(null)
        setForm((prev) => ({ ...prev, name: '', program: '' }))
        setNimError(json.error || 'NIM belum terdaftar di kelompok praktikum.')
        return
      }

      // Berhasil diverifikasi
      setNimVerified(true)
      setVerifiedInfo(json.data)
      setNimError('')

      // Auto-fill nama resmi dan program studi
      setForm((prev) => ({
        ...prev,
        name: json.data.nama,
        program: json.data.jurusanKode || prev.program,
      }))
    } catch (err: any) {
      setNimVerified(false)
      setVerifiedInfo(null)
      setNimError(err.message || 'Gagal memverifikasi NIM. Cek koneksi internet.')
    } finally {
      setCheckingNim(false)
    }
  }

  // Handle perubahan NIM (reset status verifikasi jika NIM diedit)
  const handleNimChange = (val: string) => {
    setForm((prev) => ({ ...prev, nim: val, name: '', program: '' }))
    setNimVerified(false)
    setVerifiedInfo(null)
    setNimError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nimVerified) {
      setError('Silakan verifikasi NIM Anda terlebih dahulu sebelum mendaftar.')
      return
    }

    if (form.password !== form.confirm) {
      setError('Konfirmasi password tidak cocok.')
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
      if (!res.ok) throw new Error(json.error || 'Gagal membuat akun praktikan.')
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
      style={{ background: '#F4F8FC' }}
    >
      <div className="absolute inset-0 dots-bg opacity-30" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-6">
          <button
            onClick={() => setCurrentPage('login')}
            className="inline-flex items-center gap-2 text-sm text-[#24456F] hover:text-[#00142F] transition-colors mb-4 font-semibold cursor-pointer"
          >
            ← Kembali ke Login
          </button>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.85rem',
              color: '#00142F',
            }}
          >
            Daftar Akun Praktikan
          </div>
          <p style={{ color: '#24456F', marginTop: '6px', fontSize: '0.9rem' }}>
            Data identitas otomatis disinkronkan dengan data kelompok resmi dari asisten
          </p>
        </div>

        {step === 1 ? (
          <div
            className="rounded-3xl p-7 sm:p-9 animate-fadeInUp bg-white"
            style={{
              border: '2px solid #BED8F0',
              boxShadow: '0 16px 60px rgba(0, 20, 47, 0.08)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. INPUT NIM DENGAN VERIFIKASI LANGSUNG */}
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
                  Nomor Induk Mahasiswa (NIM) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="Contoh: 202411001"
                    value={form.nim}
                    onChange={(e) => handleNimChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleVerifyNim()
                      }
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyNim()}
                    disabled={checkingNim || !form.nim.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    style={{
                      background: nimVerified
                        ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                        : 'linear-gradient(135deg, #00142F 0%, #002466 50%, #0260D4 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 12px rgba(2, 96, 212, 0.25)',
                    }}
                  >
                    {checkingNim ? (
                      <>
                        <Icon name="loader" size={13} className="animate-spin" />
                        <span>Mengecek...</span>
                      </>
                    ) : nimVerified ? (
                      <>
                        <Icon name="check" size={14} />
                        <span>Terverifikasi</span>
                      </>
                    ) : (
                      <>
                        <Icon name="search" size={13} />
                        <span>Cek NIM</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Notifikasi Verifikasi Hijau */}
                {nimVerified && verifiedInfo && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-[0.85rem] text-emerald-900">
                        NIM Terverifikasi: {verifiedInfo.nama}
                      </div>
                      <div className="text-emerald-700 mt-0.5 font-medium">
                        {verifiedInfo.namaKelompok ? `Terdaftar di: ${verifiedInfo.namaKelompok}` : ''}
                        {verifiedInfo.praktikumNama ? ` • ${verifiedInfo.praktikumNama}` : ''}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifikasi Peringatan Merah jika NIM Belum Terdaftar */}
                {nimError && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <Icon name="warning" size={16} color="#DC2626" className="shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">NIM Tidak Ditemukan / Belum Terdaftar</div>
                      <div className="text-red-700 mt-0.5 leading-relaxed">{nimError}</div>
                    </div>
                  </div>
                )}

                {!nimVerified && !nimError && (
                  <p style={{ fontSize: '0.72rem', color: '#5D789B', marginTop: '4px' }}>
                    Ketik NIM Anda lalu klik <strong>Cek NIM</strong> untuk memuat data resmi.
                  </p>
                )}
              </div>

              {/* 2. NAMA LENGKAP (AUTO-FILL & DISABLED/READ-ONLY) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: '#162D4E',
                    }}
                  >
                    Nama Lengkap
                  </label>
                  {nimVerified && (
                    <span className="text-[0.7rem] font-bold text-emerald-600 flex items-center gap-1">
                      <Icon name="shield" size={11} /> Terkunci Sesuai Data Asisten
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className="input-field pr-9"
                    style={{
                      backgroundColor: nimVerified ? '#F0F6FD' : '#F8FAFC',
                      cursor: nimVerified ? 'not-allowed' : 'default',
                      fontWeight: nimVerified ? 700 : 400,
                      color: nimVerified ? '#102544' : '#94A3B8',
                      borderColor: nimVerified ? '#93C5FD' : '#CBD5E1',
                    }}
                    placeholder="Otomatis terisi setelah verifikasi NIM"
                    value={form.name}
                    readOnly
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                    <Icon name="lock" size={15} />
                  </span>
                </div>
              </div>

              {/* 3. PROGRAM STUDI (AUTO-FILL & READ-ONLY TERKUNCI) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: '#162D4E',
                    }}
                  >
                    Program Studi
                  </label>
                  {nimVerified && (
                    <span className="text-[0.7rem] font-bold text-emerald-600 flex items-center gap-1">
                      <Icon name="shield" size={11} /> Terkunci Sesuai Data Asisten
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className="input-field pr-9"
                    style={{
                      backgroundColor: nimVerified ? '#F0F6FD' : '#F8FAFC',
                      cursor: nimVerified ? 'not-allowed' : 'default',
                      fontWeight: nimVerified ? 700 : 400,
                      color: nimVerified ? '#102544' : '#94A3B8',
                      borderColor: nimVerified ? '#93C5FD' : '#CBD5E1',
                    }}
                    placeholder="Otomatis terisi setelah verifikasi NIM"
                    value={verifiedInfo?.jurusanNama || ''}
                    readOnly
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                    <Icon name="lock" size={15} />
                  </span>
                </div>
              </div>

              {/* 4. EMAIL MAHASISWA */}
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
                  Alamat Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="Contoh: nama@itpln.ac.id"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                />
              </div>

              {/* 5. PASSWORD & KONFIRMASI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pr-9"
                      placeholder="Min. 8 karakter"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2F4D7B] p-1 cursor-pointer"
                      title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      <Icon name={showPassword ? 'eye-off' : 'eye'} size={15} />
                    </button>
                  </div>
                </div>

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
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="input-field pr-9"
                      placeholder="Ulangi password"
                      value={form.confirm}
                      onChange={(e) => set('confirm', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2F4D7B] p-1 cursor-pointer"
                      title={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      <Icon name={showConfirm ? 'eye-off' : 'eye'} size={15} />
                    </button>
                  </div>
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
                className="btn-primary w-full text-center cursor-pointer transition-all duration-300 font-bold py-3.5 rounded-2xl"
                disabled={loading || !nimVerified}
                style={{
                  opacity: !nimVerified ? 0.6 : 1,
                  background: nimVerified
                    ? 'linear-gradient(135deg, #00142F 0%, #002466 45%, #0260D4 100%)'
                    : '#94A3B8',
                  boxShadow: nimVerified ? '0 8px 24px rgba(2, 96, 212, 0.3)' : 'none',
                }}
              >
                {loading ? (
                  <>
                    <Icon name="loader" size={16} className="inline mr-1.5 align-text-bottom animate-spin" />
                    Mendaftarkan Akun...
                  </>
                ) : !nimVerified ? (
                  <>Verifikasi NIM Terlebih Dahulu</>
                ) : (
                  <>
                    <Icon name="check-circle" size={16} className="inline mr-1.5 align-text-bottom" />
                    Daftar Akun Praktikan
                  </>
                )}
              </button>

              <p className="text-center text-sm" style={{ color: '#2F4D7B', paddingTop: '4px' }}>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="font-bold text-[#0260D4] hover:text-[#002466] underline cursor-pointer"
                >
                  Masuk ke Akun
                </button>
              </p>
            </form>
          </div>
        ) : (
          <div
            className="rounded-3xl p-8 text-center animate-scaleIn bg-white"
            style={{
              border: '2px solid #BED8F0',
              boxShadow: '0 16px 60px rgba(0, 20, 47, 0.08)',
            }}
          >
            <div className="mb-5 animate-float flex justify-center">
              <Icon name="party" size={54} color="#0260D4" strokeWidth={1.5} />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.55rem',
                color: '#00142F',
                marginBottom: '0.75rem',
              }}
            >
              Akun Praktikan Berhasil Dibuat!
            </h2>
            <p style={{ color: '#24456F', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Selamat <strong>{form.name}</strong>! Akun praktikan Anda telah terdaftar resmi dan dapat langsung
              digunakan untuk masuk ke Dashboard Praktikan.
            </p>
            <div
              className="rounded-2xl p-4 mb-6 text-left"
              style={{ background: '#F0F6FD', border: '1px solid #BED8F0' }}
            >
              <div className="text-xs sm:text-sm space-y-1.5" style={{ color: '#162D4E' }}>
                <div className="flex items-center gap-2">
                  <Icon name="user" size={14} color="#0260D4" />
                  Nama: <strong>{form.name}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="graduation-cap" size={14} color="#0260D4" />
                  NIM: <strong>{form.nim}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="mail" size={14} color="#0260D4" />
                  Email: <strong>{form.email}</strong>
                </div>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage('login')}
              className="btn-primary w-full cursor-pointer py-3 rounded-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #00142F 0%, #002466 45%, #0260D4 100%)',
              }}
            >
              Lanjut ke Halaman Login →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
