import { useState, useEffect } from 'react'

import { Icon } from '../components/Icon'

interface AboutPageProps {
  setCurrentPage: (page: string) => void
}

function PIDSimulator() {
  const [kp, setKp] = useState(2.0)
  const [ki, setKi] = useState(0.5)
  const [kd, setKd] = useState(0.3)

  const simulate = (kp: number, ki: number, kd: number) => {
    const dt = 0.1
    const T = 2
    const setpoint = 1.0
    const n = 120
    const output: number[] = [0]
    let integral = 0
    let prevError = setpoint

    for (let i = 1; i < n; i++) {
      const error = setpoint - output[i - 1]
      integral += error * dt
      const derivative = (error - prevError) / dt
      const u = kp * error + ki * integral + kd * derivative
      const next = output[i - 1] + (dt / T) * (u - output[i - 1])
      output.push(Math.max(-0.5, Math.min(2.5, next)))
      prevError = error
    }
    return output
  }

  const data = simulate(kp, ki, kd)
  const W = 500
  const H = 200
  const padX = 40
  const padY = 20
  const innerW = W - padX * 2
  const innerH = H - padY * 2

  const toX = (i: number) => padX + (i / (data.length - 1)) * innerW
  const toY = (v: number) => padY + innerH - ((v - -0.5) / 3) * innerH

  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const setpointY = toY(1.0)

  const finalVal = data[data.length - 1]
  const overshoot = Math.max(...data) - 1.0
  const steadyErr = Math.abs(1.0 - finalVal)

  return (
    <div
      className="rounded-3xl p-6"
      style={{ background: 'white', border: '1.5px solid #e0f7fa', boxShadow: '0 4px 20px rgba(1,92,97,0.08)' }}
    >
      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#015c61', fontSize: '1.1rem', marginBottom: '1.25rem' }}>
        <Icon name="sliders" size={17} className="inline mr-1.5 align-text-bottom" /> Simulasi Kontrol PID Interaktif
      </h3>

      {/* SVG Graph */}
      <div className="overflow-x-auto mb-5">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
          {/* Grid lines */}
          {[0, 0.5, 1.0, 1.5, 2.0].map((v) => (
            <line
              key={v}
              x1={padX} y1={toY(v)} x2={W - padX} y2={toY(v)}
              stroke="#e0f7fa" strokeWidth="1" strokeDasharray="4,4"
            />
          ))}
          {/* Labels */}
          {[0, 0.5, 1.0, 1.5, 2.0].map((v) => (
            <text key={v} x={padX - 4} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v.toFixed(1)}</text>
          ))}
          {/* Setpoint line */}
          <line x1={padX} y1={setpointY} x2={W - padX} y2={setpointY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="6,3" />
          <text x={W - padX + 2} y={setpointY + 4} fontSize="9" fill="#10b981">SP</text>
          {/* Response curve */}
          <polyline
            points={points}
            fill="none"
            stroke="url(#pidGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Fill under curve */}
          <polygon
            points={`${padX},${H - padY} ${points} ${W - padX},${H - padY}`}
            fill="url(#pidFill)"
          />
          <defs>
            <linearGradient id="pidGrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
              <stop offset="0" stopColor="#015c61" />
              <stop offset="1" stopColor="#06aeb7" />
            </linearGradient>
            <linearGradient id="pidFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#06aeb7" stopOpacity="0.15" />
              <stop offset="1" stopColor="#06aeb7" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* X axis label */}
          <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#94a3b8">Waktu (s)</text>
        </svg>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Kp (Proportional)', value: kp, set: setKp, min: 0, max: 10, step: 0.1, color: '#015c61' },
          { label: 'Ki (Integral)', value: ki, set: setKi, min: 0, max: 5, step: 0.1, color: '#016e75' },
          { label: 'Kd (Derivative)', value: kd, set: setKd, min: 0, max: 3, step: 0.05, color: '#06aeb7' },
        ].map((s) => (
          <div key={s.label}>
            <div className="flex justify-between mb-1">
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                {s.label}
              </label>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700, color: s.color }}>
                {s.value.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={s.value}
              onChange={(e) => s.set(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: s.color }}
            />
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Overshoot', value: (overshoot * 100).toFixed(1) + '%', color: overshoot > 0.2 ? '#dc2626' : '#059669' },
          { label: 'Steady State Error', value: (steadyErr * 100).toFixed(2) + '%', color: steadyErr > 0.05 ? '#d97706' : '#059669' },
          { label: 'Nilai Akhir', value: finalVal.toFixed(3), color: '#015c61' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: '#f0fbfb', border: '1px solid #e0f7fa' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: m.color }}>
              {m.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Foto placeholder Unsplash, dipakai hanya sebagai fallback sampai foto lab ICAL asli
// diunggah ke storage (lihat catatan di README/TODO tim). Ukuran & rasio sengaja sama
// (400x280) supaya begitu diganti link asli, layout grid foto tidak berubah.
const fallbackPhotos = [
  { url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=280&fit=crop&auto=format', alt: 'Lab Praktikum' },
  { url: 'https://images.unsplash.com/photo-1573164713347-df11cc9a294a?w=400&h=280&fit=crop&auto=format', alt: 'Laboratorium Elektronik' },
  { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=280&fit=crop&auto=format', alt: 'Circuit Board' },
  { url: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400&h=280&fit=crop&auto=format', alt: 'Industrial Control' },
]

// Nilai default dipakai sesaat sebelum statistik asli dari Supabase selesai dimuat
// (lihat useEffect fetch('/api/stats-publik') di dalam komponen).
const defaultAboutStats = [
  { label: 'Jurusan', value: '4 Prodi', desc: 'Teknik Elektro, Sistem Energi, dll' },
  { label: 'Mahasiswa / Smt', value: '200+', desc: 'Praktikan aktif setiap semester' },
  { label: 'Tim Asisten', value: '10 Asisten', desc: 'Instruktur lab berpengalaman' },
  { label: 'Software Utama', value: '4 Perangkat', desc: 'MATLAB, CX-One, NB Designer, dll' },
]

export default function AboutPage({ setCurrentPage }: AboutPageProps) {
  const photos = fallbackPhotos

  // Statistik: data real dari Supabase (RPC get_public_stats), fallback ke default jika API belum siap
  const [aboutStats, setAboutStats] = useState(defaultAboutStats)
  useEffect(() => {
    fetch('/api/stats-publik')
      .then((r) => r.json())
      .then((json) => {
        if (!json.stats) return
        setAboutStats([
          { label: 'Jurusan', value: `${json.stats.totalJurusan} Prodi`, desc: 'Teknik Elektro, Sistem Energi, dll' },
          { label: 'Mahasiswa / Smt', value: `${json.stats.totalPraktikan}+`, desc: 'Praktikan aktif setiap semester' },
          { label: 'Tim Asisten', value: `${json.stats.totalAsisten} Asisten`, desc: 'Instruktur lab berpengalaman' },
          { label: 'Software Utama', value: '4 Perangkat', desc: 'MATLAB, CX-One, NB Designer, dll' },
        ])
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#f0fbfb' }}>
      {/* Page header */}
      <div
        className="relative pt-24 pb-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #014346, #015c61, #016e75)' }}
      >
        <div className="absolute inset-0 dots-bg opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <div className="section-badge mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            Tentang Lab
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3rem)', color: 'white', marginBottom: '1rem' }}>
            Intelligent Control & Automation Laboratory
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
            Laboratorium terdepan di Institut Teknologi PLN untuk riset dan praktikum sistem kontrol dan otomasi.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 space-y-16">
        {/* Description & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-[#e0f7fa] shadow-sm">
          <div className="lg:col-span-7">
            <div className="section-badge mb-3"><Icon name="clipboard-list" size={13} /> Deskripsi</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.75rem', color: '#015c61', marginBottom: '1rem' }}>
              Tentang ICAL
            </h2>
            <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: '1rem', fontSize: '0.95rem' }}>
              <strong>Intelligent Control & Automation Laboratory (ICAL)</strong> merupakan pusat praktikum di bawah naungan Institut Teknologi PLN yang berfokus pada pengembangan kompetensi mahasiswa di bidang sistem kontrol, otomasi industri, dan instrumentasi.
            </p>
            <p style={{ color: '#475569', lineHeight: 1.8, fontSize: '0.95rem' }}>
              Didukung oleh {aboutStats[2].value.split(' ')[0]} asisten berpengalaman dan perangkat mutakhir, ICAL menyelenggarakan praktikum untuk tiga mata kuliah utama: <strong>Dasar Sistem Kontrol (DSK)</strong>, <strong>Programmable Logic Controller (PLC)</strong>, dan <strong>Sistem Kontrol Industri (SKI)</strong>.
            </p>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {aboutStats.map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center card-hover bg-[#f0fbfb] border border-[#e0f7fa]">
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#015c61' }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#06aeb7', marginTop: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visi & Misi Cards — Exact Match to Design */}
        <div className="space-y-6">
          {/* Card Visi */}
          <div
            className="relative bg-white rounded-3xl p-6 sm:p-9 overflow-hidden transition-all duration-300 shadow-xs"
            style={{
              border: '1.5px solid #cceef2',
              boxShadow: '0 4px 24px rgba(1,92,97,0.04)',
            }}
          >
            {/* Left vertical accent bar */}
            <div className="absolute left-0 top-1/4 w-1.5 h-20 bg-[#008289] rounded-r-full pointer-events-none" />

            {/* Left soft fluid wave/blob */}
            <svg
              className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-44 pointer-events-none opacity-40"
              viewBox="0 0 100 200"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M0 0 C 45 35, 60 70, 30 120 C 10 160, 45 190, 0 200 Z" fill="#cffafe" />
            </svg>

            {/* Top-left dot grid (6 cols x 3 rows) */}
            <div className="absolute left-7 top-7 grid grid-cols-6 gap-2 opacity-35 pointer-events-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#06aeb7]" />
              ))}
            </div>

            {/* Content with vertical divider */}
            <div className="relative z-10 flex items-start gap-6 sm:pl-28">
              {/* Subtle vertical separator line */}
              <div className="hidden sm:block absolute left-22 top-1 bottom-1 w-[1.5px] bg-[#e2e8f0]" />

              <div className="w-full">
                <h3
                  className="font-extrabold text-2xl sm:text-[1.75rem] text-[#014346] tracking-tight mb-1.5"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Visi
                </h3>
                <div className="w-12 h-1.5 rounded-full bg-[#008289] mb-4" />
                <p style={{ color: '#334155', lineHeight: 1.85, fontSize: '0.95rem' }} className="max-w-3xl">
                  Menjadi laboratorium unggulan berkelas internasional dalam pendidikan, penelitian, dan inovasi sistem kontrol, otomasi industri cerdas, serta teknologi energi terbarukan yang berwawasan lingkungan dan berkontribusi pada pengembangan energi berkelanjutan dan industri 4.0 di Indonesia.
                </p>
              </div>
            </div>
          </div>

          {/* Card Misi */}
          <div
            className="relative bg-white rounded-3xl p-6 sm:p-9 overflow-hidden transition-all duration-300 shadow-xs"
            style={{
              border: '1.5px solid #d4f8dc',
              boxShadow: '0 4px 24px rgba(5,150,105,0.04)',
            }}
          >
            {/* Left vertical accent bar */}
            <div className="absolute left-0 top-1/4 w-1.5 h-20 bg-[#10b981] rounded-r-full pointer-events-none" />

            {/* Left soft fluid wave/blob */}
            <svg
              className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-44 pointer-events-none opacity-40"
              viewBox="0 0 100 200"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M0 0 C 45 35, 60 70, 30 120 C 10 160, 45 190, 0 200 Z" fill="#bbf7d0" />
            </svg>

            {/* Bottom-left dot grid (6 cols x 3 rows) */}
            <div className="absolute left-7 bottom-7 grid grid-cols-6 gap-2 opacity-35 pointer-events-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              ))}
            </div>

            {/* Content with vertical divider */}
            <div className="relative z-10 flex items-start gap-6 sm:pl-28">
              {/* Subtle vertical separator line */}
              <div className="hidden sm:block absolute left-22 top-1 bottom-1 w-[1.5px] bg-[#e2e8f0]" />

              <div className="w-full">
                <h3
                  className="font-extrabold text-2xl sm:text-[1.75rem] text-[#014346] tracking-tight mb-1.5"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Misi
                </h3>
                <div className="w-12 h-1.5 rounded-full bg-[#10b981] mb-5" />

                <div className="space-y-3.5 max-w-3xl">
                  {[
                    'Menyelenggarakan pendidikan, pelatihan, dan kurikulum praktikum industri cerdas',
                    'Mengembangkan penelitian riset terapan dan publikasi ilmiah di bidang kontrol cerdas, AI industri, IoT, dan integrasi energi',
                    'Menyelenggarakan kegiatan pengabdian kepada masyarakat yang berbasis teknologi industri cerdas dan energi',
                    'Membangun kolaborasi strategis dengan industri, pemerintah, dan institusi riset di tingkat nasional maupun internasional',
                    'Menjamin tata kelola laboratorium yang akuntabel, transparan, dan berkelanjutan untuk mendukung continuous improvement dalam pendidikan dan riset',
                  ].map((m, i, arr) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3.5 text-sm sm:text-[0.93rem] font-medium text-[#334155] ${
                        i !== arr.length - 1 ? 'border-b border-[#f1f5f9] pb-3.5' : ''
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 8 6.5 11.5 13 4.5" />
                        </svg>
                      </div>
                      <span className="leading-relaxed">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div>
          <div className="section-badge mb-4"><Icon name="scroll" size={13} /> Tata Tertib</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.6rem', color: '#015c61', marginBottom: '1.5rem' }}>
            Tata Tertib Praktikum
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Praktikan tidak diperkenankan terlambat (toleransi 15 menit). Bila lebih dari 15 menit, maka dianggap tidak hadir.',
              'Wajib memakai almamater, kemeja berkerah, sepatu bertali, dan kaus kaki saat praktikum.',
              'Wajib mendownload software pendukung dan memiliki soft file modul.',
              'Praktikan wajib mengumpulkan tugas rumah sebelum melaksanakan praktikum.',
              'Laporan praktikum wajib dikumpulkan dalam waktu yang telah ditentukan. Bagi yang terlambat mengumpulkan laporan, otomatis mendapat nilai E.',
              'Praktikan wajib memahami modul praktikum sebelum melaksanakan praktikum.',
              'Praktikan wajib menjaga keselamatan dirinya, peralatan, dan kebersihan laboratorium.',
              'Sebelum praktikum dimulai, praktikan wajib melaksanakan tes awal.',
              'Apabila praktikan berhalangan hadir, harus ada pemberitahuan maksimal 1 hari sebelum praktikum, dan mencari kelompok pengganti.',
              'Praktikan wajib mengikuti presentasi.',
              'Jadwal yang telah dibuat tidak bisa diubah, kecuali ada suatu hal yang mengganggu jalannya praktikum.',
            ].map((rule, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: 'white', border: '1px solid #e0f7fa' }}
              >
                <span
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #015c61, #06aeb7)', marginTop: '1px' }}
                >
                  {i + 1}
                </span>
                <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.6 }}>{rule}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Grading */}
        <div>
          <div className="section-badge mb-4"><Icon name="bar-chart" size={13} /> Penilaian</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.6rem', color: '#015c61', marginBottom: '1.5rem' }}>
            Komponen Penilaian
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Tes Awal (TA)', pct: '15%', icon: 'file-text', color: '#015c61' },
              { label: 'Tugas Rumah (TR)', pct: '20%', icon: 'book-open', color: '#016e75' },
              { label: 'Laporan (LP)', pct: '20%', icon: 'file-text', color: '#06aeb7' },
              { label: 'Keaktifan (P)', pct: '15%', icon: 'hand', color: '#059669' },
              { label: 'Jurnal', pct: '10%', icon: 'notebook', color: '#d97706' },
              { label: 'UAP', pct: '20%', icon: 'trophy', color: '#dc2626' },
            ].map((c, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 text-center card-hover"
                style={{ background: 'white', border: '1.5px solid #e0f7fa', boxShadow: '0 2px 12px rgba(1,92,97,0.06)' }}
              >
                <div className="mb-2 flex justify-center"><Icon name={c.icon} size={26} color={c.color} strokeWidth={1.75} /></div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', color: c.color }}>{c.pct}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Software */}
        <div>
          <div className="section-badge mb-4"><Icon name="laptop" size={13} /> Software</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.6rem', color: '#015c61', marginBottom: '1.5rem' }}>
            Perangkat Lunak yang Digunakan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { name: 'MATLAB', icon: 'bar-chart', desc: 'Simulasi & Kontrol' },
              { name: 'CX-One', icon: 'laptop', desc: 'Pemrograman PLC' },
              { name: 'NB Designer', icon: 'smartphone', desc: 'Konfigurasi HMI' },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 text-center card-hover cursor-pointer"
                style={{ background: 'white', border: '1.5px solid #e0f7fa' }}
                onClick={() => setCurrentPage('software')}
              >
                <div className="mb-2 flex justify-center"><Icon name={s.icon} size={32} color="#015c61" strokeWidth={1.75} /></div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#015c61', fontSize: '0.9rem' }}>{s.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PID Simulator */}
        <div>
          <div className="section-badge mb-4"><Icon name="sliders" size={13} /> Simulasi</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.6rem', color: '#015c61', marginBottom: '1.5rem' }}>
            Simulasi Kontroler PID
          </h2>
          <PIDSimulator />
        </div>

        {/* Photo gallery */}
        <div>
          <div className="section-badge mb-4"><Icon name="camera" size={13} /> Dokumentasi</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.6rem', color: '#015c61', marginBottom: '1.5rem' }}>
            Galeri Foto & Kegiatan
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden card-hover"
                style={{ border: '2px solid #e0f7fa', aspectRatio: '4/3' }}
              >
                <img src={p.url} alt={p.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
