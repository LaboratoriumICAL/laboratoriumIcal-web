'use client'

import { useState, useMemo } from 'react'
import { Icon } from '../components/Icon'

interface DskDetailPageProps {
  setCurrentPage: (page: string) => void
}

// Simulasi PID Interaktif
function PIDSimulatorWidget() {
  const [kp, setKp] = useState(2.2)
  const [ki, setKi] = useState(0.6)
  const [kd, setKd] = useState(0.4)
  const [activePreset, setActivePreset] = useState<string>('pid')

  const presets = [
    { id: 'p', label: 'Kontrol P Murni', kp: 2.0, ki: 0.0, kd: 0.0, desc: 'Cepat tapi memiliki steady-state error' },
    { id: 'pi', label: 'Kontrol PI', kp: 1.8, ki: 0.8, kd: 0.0, desc: 'Menghilangkan steady-state error tapi sedikit berosilasi' },
    { id: 'pd', label: 'Kontrol PD', kp: 2.5, ki: 0.0, kd: 0.6, desc: 'Meredam osilasi & mempercepat waktu stabil' },
    { id: 'pid', label: 'PID Optimal', kp: 2.4, ki: 0.65, kd: 0.45, desc: 'Kombinasi ideal respons cepat tanpa error' },
  ]

  const applyPreset = (p: typeof presets[0]) => {
    setActivePreset(p.id)
    setKp(p.kp)
    setKi(p.ki)
    setKd(p.kd)
  }

  // Model Simulasi Sistem Orde-2 dengan PID
  const data = useMemo(() => {
    const dt = 0.05
    const T = 1.8
    const setpoint = 1.0
    const n = 140
    const output: number[] = [0]
    let integral = 0
    let prevError = setpoint

    for (let i = 1; i < n; i++) {
      const error = setpoint - output[i - 1]
      integral += error * dt
      // Anti-windup
      integral = Math.max(-2, Math.min(2, integral))
      const derivative = (error - prevError) / dt
      const u = kp * error + ki * integral + kd * derivative
      const next = output[i - 1] + (dt / T) * (u - output[i - 1])
      output.push(Math.max(-0.2, Math.min(2.4, next)))
      prevError = error
    }
    return output
  }, [kp, ki, kd])

  const W = 620
  const H = 240
  const padX = 45
  const padY = 25
  const innerW = W - padX * 2
  const innerH = H - padY * 2

  const toX = (i: number) => padX + (i / (data.length - 1)) * innerW
  const toY = (v: number) => padY + innerH - ((v - -0.2) / 2.6) * innerH

  const points = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const setpointY = toY(1.0)

  const finalVal = data[data.length - 1]
  const maxVal = Math.max(...data)
  const overshoot = Math.max(0, maxVal - 1.0)
  const steadyErr = Math.abs(1.0 - finalVal)

  return (
    <div
      className="rounded-3xl p-6 sm:p-8 bg-white relative overflow-hidden"
      style={{
        border: '1.5px solid #BAD6EB',
        boxShadow: '0 12px 36px rgba(83, 122, 184, 0.12)',
      }}
    >
      {/* Top Header info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-[#E1EDF8]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#162D4E', fontSize: '1.25rem' }}>
              Simulasi Respons Loop Tertutup PID
            </h3>
          </div>
          <p style={{ color: '#3B577D', fontSize: '0.88rem' }}>
            Geser parameter <span className="font-bold text-[#162D4E]">P</span> (Proportional), <span className="font-bold text-emerald-600">I</span> (Integral), dan <span className="font-bold text-amber-600">D</span> (Derivative) untuk melihat perubahan respons grafik waktu nyata (*real-time*).
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex flex-wrap gap-2">
          {presets.map((pr) => (
            <button
              key={pr.id}
              onClick={() => applyPreset(pr)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              style={{
                background: activePreset === pr.id ? 'linear-gradient(135deg, #102544 0%, #1E4B85 50%, #537AB8 100%)' : '#EEF5FA',
                color: activePreset === pr.id ? '#FFFFFF' : '#162D4E',
                border: activePreset === pr.id ? '1px solid #162D4E' : '1px solid #BAD6EB',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Graphic Display */}
      <div className="relative mb-6 rounded-2xl p-4 bg-[#F8FBFE] border border-[#BAD6EB]/70 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block mx-auto drop-shadow-xs">
          {/* Grid lines */}
          {[0, 0.5, 1.0, 1.5, 2.0].map((v) => (
            <g key={v}>
              <line
                x1={padX}
                y1={toY(v)}
                x2={W - padX}
                y2={toY(v)}
                stroke="#DBEAFE"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={padX - 8} y={toY(v) + 4} textAnchor="end" fontSize="10" fill="#6B87A8" fontWeight="600">
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Reference Setpoint Target (SP = 1.0) */}
          <line
            x1={padX}
            y1={setpointY}
            x2={W - padX}
            y2={setpointY}
            stroke="#EF4444"
            strokeWidth="1.8"
            strokeDasharray="6 4"
          />
          <text x={W - padX + 6} y={setpointY + 4} fontSize="10" fill="#EF4444" fontWeight="800">
            SP (1.0)
          </text>

          {/* Area gradient under response curve */}
          <polygon
            points={`${padX},${toY(-0.2)} ${points} ${toX(data.length - 1)},${toY(-0.2)}`}
            fill="url(#pidAreaGrad)"
            opacity="0.55"
          />

          {/* Main PID Output Response Curve */}
          <polyline
            points={points}
            fill="none"
            stroke="url(#pidStrokeGrad)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="pidStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#162D4E" />
              <stop offset="40%" stopColor="#1E4B85" />
              <stop offset="80%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
            <linearGradient id="pidAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.02" />
            </linearGradient>
          </defs>
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-xs font-semibold text-[#162D4E]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded-full bg-[#2563EB]" /> Respons Sistem (Output)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-red-500" /> Target Setpoint (SP = 1.0)
          </div>
        </div>
      </div>

      {/* 3 Parameter Sliders (P, I, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {/* Slider P */}
        <div className="p-4 rounded-2xl bg-[#EEF5FA] border border-[#BAD6EB]">
          <div className="flex items-center justify-between text-xs font-bold text-[#162D4E] mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#162D4E]" />
              <span>Gain Proporsional (Kp)</span>
            </div>
            <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-white text-[#162D4E] border border-[#BAD6EB]">
              {kp.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="6.0"
            step="0.05"
            value={kp}
            onChange={(e) => {
              setKp(parseFloat(e.target.value))
              setActivePreset('')
            }}
            className="w-full accent-[#162D4E] cursor-pointer"
          />
          <p className="text-[0.72rem] text-[#486588] mt-2">
            Mempercepat respons sistem menuju setpoint. Terlalu tinggi menyebabkan osilasi.
          </p>
        </div>

        {/* Slider I */}
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0]">
          <div className="flex items-center justify-between text-xs font-bold text-[#065F46] mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Gain Integral (Ki)</span>
            </div>
            <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-[#A7F3D0]">
              {ki.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.5"
            step="0.05"
            value={ki}
            onChange={(e) => {
              setKi(parseFloat(e.target.value))
              setActivePreset('')
            }}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <p className="text-[0.72rem] text-[#047857] mt-2">
            Menghapus *steady-state error* (selisih akhir target).
          </p>
        </div>

        {/* Slider D */}
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
          <div className="flex items-center justify-between text-xs font-bold text-[#92400E] mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
              <span>Gain Derivatif (Kd)</span>
            </div>
            <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-white text-amber-700 border border-[#FDE68A]">
              {kd.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={kd}
            onChange={(e) => {
              setKd(parseFloat(e.target.value))
              setActivePreset('')
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[0.72rem] text-[#B45309] mt-2">
            Meredam lonjakan (*overshoot*) dan menstabilkan osilasi grafik.
          </p>
        </div>
      </div>

      {/* Realtime Metrics Output Display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
        <div className="text-center p-3 rounded-2xl bg-[#F0F6FD] border border-[#BAD6EB]">
          <div className="text-xs text-[#3B577D] font-medium">Nilai Akhir (Output)</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#162D4E' }}>
            {finalVal.toFixed(3)}
          </div>
        </div>
        <div className="text-center p-3 rounded-2xl bg-[#F0F6FD] border border-[#BAD6EB]">
          <div className="text-xs text-[#3B577D] font-medium">Overshoot (Lonjakan)</div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: overshoot > 0.35 ? '#DC2626' : '#059669',
            }}
          >
            {(overshoot * 100).toFixed(1)}%
          </div>
        </div>
        <div className="text-center p-3 rounded-2xl bg-[#F0F6FD] border border-[#BAD6EB]">
          <div className="text-xs text-[#3B577D] font-medium">Steady-State Error</div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: steadyErr < 0.04 ? '#059669' : '#D97706',
            }}
          >
            {steadyErr.toFixed(3)}
          </div>
        </div>
        <div className="text-center p-3 rounded-2xl bg-[#F0F6FD] border border-[#BAD6EB]">
          <div className="text-xs text-[#3B577D] font-medium">Status Kestabilan</div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.15rem',
              color: overshoot < 0.25 && steadyErr < 0.05 ? '#059669' : '#2563EB',
            }}
          >
            {overshoot < 0.25 && steadyErr < 0.05 ? 'Stabil Optimal' : 'Merespons'}
          </div>
        </div>
      </div>
    </div>
  )

}

// 12 Tata Tertib Praktikum Resmi Laboratorium ICAL (Halaman 8-9)
const TATA_TERTIB_RESMI = [
  {
    no: 1,
    teks: 'Praktikan wajib hadir 15 menit sebelum kegiatan praktikum berlangsung. Jika praktikan terlambat hadir praktikum setelah pre-test selesai, maka praktikan tidak diizinkan mengikuti kegiatan praktikum.',
  },
  {
    no: 2,
    teks: 'Pakaian wajib menggunakan kemeja berkerah rapi dan jas almamater resmi Institut Teknologi PLN.',
  },
  {
    no: 3,
    teks: 'Modul praktikum wajib diunduh sebelum pelaksanaan pengarahan praktikum.',
  },
  {
    no: 4,
    teks: 'Modul tidak diwajibkan untuk di-print (cukup dalam format digital PDF).',
  },
  {
    no: 5,
    teks: 'Praktikan wajib mengumpulkan tugas rumah sebelum melaksanakan praktikum di Assignment MS Teams.',
  },
  {
    no: 6,
    teks: 'Praktikan wajib menjaga keselamatan dirinya, peralatan, dan kebersihan laboratorium.',
  },
  {
    no: 7,
    teks: 'Sebelum praktikum dimulai, praktikan wajib melaksanakan pre-test dengan menggunakan aplikasi ketiga (KAHOOT!).',
  },
  {
    no: 8,
    teks: 'Praktikan yang tidak hadir tanpa keterangan pada hari praktikum yang telah ditentukan, maka nilai pada pertemuan tersebut sama dengan nol (0).',
  },
  {
    no: 9,
    teks: 'Apabila praktikan berhalangan hadir harus ada pemberitahuan dengan perizinan untuk sakit (maksimal H+1 dan konfirmasi H-3 jam sebelum praktikum dimulai); untuk izin (H-3 hari sebelum praktikum dimulai). Semua perizinan wajib disampaikan kepada asisten masing-masing disertai bukti yang jelas, mencari kelas pengganti, surat izin asisten lab, dan surat dokter bila sakit.',
  },
  {
    no: 10,
    teks: 'Kelompok praktikum yang telah dibuat tidak bisa diubah.',
  },
  {
    no: 11,
    teks: 'Diharapkan praktikan menjaga sikap dan tutur kata selama praktikum berlangsung.',
  },
  {
    no: 12,
    teks: 'Ketentuan Plagiarisme: Plagiarisme 50% - 60% = Nilai laporan dikurangi 50%. Plagiarisme > 60% = Auto E. Laporan praktikum wajib dikumpulkan dalam waktu yang ditentukan (terlambat = nilai 0).',
    isAlert: true,
  },
]

export default function DskDetailPage({ setCurrentPage }: DskDetailPageProps) {
  const [showPdfModal, setShowPdfModal] = useState(false)

  const bobotPenilaian = [
    { label: 'Kehadiran', bobot: '10%', desc: 'Presensi dan kedisiplinan praktikan tepat waktu (Hadir 15 mnt sebelum mulai)', color: '#102544', bg: '#EEF5FA', icon: 'check-circle' },
    { label: 'Tugas Rumah / Pre-Test', bobot: '15%', desc: 'Tugas persiapan via MS Teams & kuis awal via KAHOOT!', color: '#0A58BE', bg: '#EBF4FE', icon: 'file-text' },
    { label: 'Keaktifan', bobot: '10%', desc: 'Partisipasi aktif dalam tanya jawab dan eksperimen MATLAB', color: '#0D9488', bg: '#F0FDFA', icon: 'zap' },
    { label: 'Laporan Mingguan', bobot: '25%', desc: 'Analisa numerik, grafik respon, dan pembahasan praktikum', color: '#2563EB', bg: '#EFF6FF', icon: 'book-open' },
    { label: 'Program Akhir / Jurnal', bobot: '10%', desc: 'Penyusunan jurnal ilmiah kelompok & perancangan simulasi', color: '#7C3AED', bg: '#F5F3FF', icon: 'layers' },
    { label: 'UAP (Ujian Akhir)', bobot: '30%', desc: 'Evaluasi praktikum komprehensif akhir semester', color: '#E11D48', bg: '#FFF1F2', icon: 'award' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#F4F8FC' }}>
      {/* Background Pattern Watermark */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dskNodePattern" width="280" height="280" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="3" fill="#BAD6EB" />
            <circle cx="140" cy="80" r="2.5" fill="#537AB8" />
            <circle cx="220" cy="50" r="3" fill="#BAD6EB" />
            <circle cx="90" cy="180" r="2.5" fill="#BAD6EB" />
            <circle cx="200" cy="200" r="3" fill="#537AB8" />
            <line x1="40" y1="40" x2="140" y2="80" stroke="#BAD6EB" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="140" y1="80" x2="220" y2="50" stroke="#BAD6EB" strokeWidth="0.8" />
            <line x1="140" y1="80" x2="90" y2="180" stroke="#BAD6EB" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="90" y1="180" x2="200" y2="200" stroke="#BAD6EB" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dskNodePattern)" />
      </svg>

      {/* Header Banner */}
      <div
        className="relative pt-24 pb-14 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #00142F 0%, #062B57 40%, #0C4E9C 75%, #0284C7 100%)',
        }}
      >
        <div className="absolute inset-0 dots-header pointer-events-none opacity-35" style={{ zIndex: 1 }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8" style={{ zIndex: 10 }}>
          {/* Back button */}
          <button
            onClick={() => setCurrentPage('home')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 transition-all cursor-pointer mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <Icon name="arrow-left" size={14} /> Kembali ke Beranda
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="section-badge mb-3" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
                <Icon name="book-open" size={13} /> Modul Resmi Praktikum
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                Dasar Sistem Kontrol (DSK)
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.92)', marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '680px', lineHeight: 1.6 }}>
                Buku panduan lengkap praktikum DSK Institut Teknologi PLN: 5 Modul Pembelajaran MATLAB & Simulink, Tata Tertib Resmi, Penilaian, dan Simulasi PID Loop Tertutup.
              </p>


            </div>

            {/* Quick Badge Box */}
            <div className="hidden lg:flex flex-col items-center justify-center p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/25 shadow-xl text-center min-w-[170px]">
              <span className="text-4xl font-extrabold text-white tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
                DSK
              </span>
              <span className="text-xs text-blue-100 mt-1 font-semibold">MATLAB & Simulink</span>
              <div className="mt-3 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[0.72rem] font-bold">
                ✓ Modul Aktif
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-12" style={{ zIndex: 10 }}>

        {/* 1. TATA TERTIB PRAKTIKUM LABORATORIUM RESMI (12 POIN) */}
        <section className="rounded-3xl p-7 sm:p-9 bg-white border border-[#BAD6EB] shadow-sm relative overflow-hidden">
          <div className="border-b border-[#D6E4F0] pb-4 mb-6">
            <div className="section-badge mb-2"><Icon name="shield" size={13} /> Standar Operasional Laboratorium</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              1. Tata Tertib Praktikum Laboratorium ICAL
            </h2>
            <p className="text-xs sm:text-sm text-[#3B577D] mt-1">
              Ketentuan resmi yang wajib dipatuhi oleh seluruh praktikan Dasar Sistem Kontrol (DSK) selama pelaksanaan praktikum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TATA_TERTIB_RESMI.map((item) => (
              <div
                key={item.no}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  item.isAlert
                    ? 'bg-[#FEF2F2] border-[#FECACA] text-red-900 md:col-span-2'
                    : 'bg-[#F8FBFE] border-[#BAD6EB]/80 text-[#2C4D78]'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs ${
                    item.isAlert ? 'bg-red-600 text-white' : 'bg-[#1E4B85] text-white'
                  }`}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {item.no}
                </span>
                <p className="text-xs sm:text-sm leading-relaxed font-medium">
                  {item.teks}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. BOBOT PENILAIAN & PERIZINAN */}
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#D6E4F0] pb-4">
            <div>
              <div className="section-badge mb-2"><Icon name="bar-chart" size={13} /> Evaluasi Akademik</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
                2. Bobot Penilaian Praktikum DSK
              </h2>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white border border-[#BAD6EB] shadow-xs flex items-center gap-2">
              <Icon name="check-circle" size={16} color="#059669" />
              <span className="text-xs font-bold text-[#102544]">Total Akumulasi: <strong className="text-emerald-600 text-sm">100%</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bobotPenilaian.map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl p-6 relative overflow-hidden bg-white border border-[#BAD6EB] shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: item.bg, border: `1px solid ${item.color}30` }}
                    >
                      <Icon name={item.icon} size={22} color={item.color} strokeWidth={1.85} />
                    </div>
                    <span
                      className="px-3.5 py-1 rounded-full text-base font-extrabold text-white shadow-xs"
                      style={{ background: item.color, fontFamily: 'var(--font-heading)' }}
                    >
                      {item.bobot}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.12rem', color: '#102544', marginBottom: '0.35rem' }}>
                    {item.label}
                  </h3>
                  <p style={{ color: '#4B6B94', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-100 mt-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: item.bobot, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Ketentuan Perizinan Card */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white border border-[#BAD6EB] shadow-sm space-y-4">
            <h3 className="font-bold text-base sm:text-lg text-[#102544] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Icon name="clock" size={20} color="#0A58BE" /> Prosedur & Tenggat Perizinan Praktikan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#EEF5FA] border border-[#BAD6EB] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0A58BE] shrink-0 border border-[#BAD6EB]">
                  <Icon name="warning" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#102544] text-sm mb-1">Izin Sakit</h4>
                  <p className="text-xs sm:text-sm text-[#3B577D] leading-relaxed">
                    Maksimal <strong>H+1</strong> dengan konfirmasi awal <strong>H-3 jam</strong> sebelum praktikum dimulai. Wajib menyertakan surat dokter dan mencari kelas pengganti.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#EEF5FA] border border-[#BAD6EB] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0A58BE] shrink-0 border border-[#BAD6EB]">
                  <Icon name="calendar-days" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#102544] text-sm mb-1">Izin Kegiatan / Acara Lain</h4>
                  <p className="text-xs sm:text-sm text-[#3B577D] leading-relaxed">
                    Diajukan minimal <strong>H-3 hari</strong> sebelum pelaksanaan praktikum dengan bukti surat dinas/kegiatan resmi dan persetujuan asisten lab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SIMULASI KONTROL PID VIRTUAL */}
        <section className="space-y-4">
          <div className="border-b border-[#D6E4F0] pb-4">
            <div className="section-badge mb-2"><Icon name="sliders" size={13} /> Laboratorium Virtual</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              3. Simulasi Kontroler PID (Proportional - Integral - Derivative)
            </h2>
            <p className="text-xs sm:text-sm text-[#3B577D] mt-1">
              Laboratorium virtual interaktif untuk mengamati respon transien loop tertutup sistem kendali kecepatan/sudut motor DC (Materi Modul V).
            </p>
          </div>

          <PIDSimulatorWidget />
        </section>



        {/* Bottom CTA Card */}
        <div
          className="rounded-3xl p-8 text-center bg-gradient-to-r from-[#00142F] via-[#082F63] to-[#0284C7] text-white shadow-xl flex flex-col items-center justify-center gap-4"
        >
          <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Siap Melaksanakan Praktikum DSK?
          </h3>
          <p className="text-blue-100 text-sm max-w-xl">
            Pelajari modul secara mandiri, unduh template laporan resmi, dan instal MATLAB pada laptop sebelum sesi praktikum dimulai.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <button
              onClick={() => setShowPdfModal(true)}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-[#00142F] hover:bg-sky-50 transition-all shadow-md cursor-pointer flex items-center gap-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Icon name="book-open" size={16} /> Buka PDF Modul
            </button>
            <button
              onClick={() => setCurrentPage('template')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/40 transition-all cursor-pointer flex items-center gap-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Icon name="file-text" size={16} /> Unduh Format Laporan DSK
            </button>
          </div>
        </div>

      </div>

      {/* Direct In-App PDF Reader Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeInUp">
          <div
            className="relative w-full max-w-5xl h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#C6DBF2]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#BAD6EB] bg-[#102544] text-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#1E4B85] uppercase tracking-wider shrink-0">
                  DSK PDF
                </span>
                <h3 className="font-bold text-base sm:text-lg truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                  MODUL PRAKTIKUM DASAR SISTEM KONTROL - IT PLN
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/modul/MODUL DASAR SISTEM KONTROL.pdf?download=1"
                  download
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs text-white bg-[#1E4B85] hover:bg-[#2563EB] transition-colors shadow-xs"
                >
                  <Icon name="download" size={14} /> Unduh PDF
                </a>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <Icon name="x" size={20} />
                </button>
              </div>
            </div>

            {/* Modal PDF Iframe */}
            <div className="flex-1 w-full h-full bg-slate-100 relative">
              <iframe
                src="/modul/MODUL DASAR SISTEM KONTROL.pdf#toolbar=0&navpanes=0&scrollbar=1&view=FitH"
                className="w-full h-full border-0"
                title="Modul Praktikum Dasar Sistem Kontrol"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
