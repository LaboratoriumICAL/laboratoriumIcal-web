import { useState, useEffect } from 'react'
import { Icon } from '../components/Icon'

interface AboutPageProps {
  setCurrentPage: (page: string) => void
}

const labPhotos = [
  {
    url: '/images/kegiatan_kuliah_plc.jpg',
    title: 'Workshop Basic PLC',
    desc: 'Pemaparan materi Workshop Basic Programmable Logic Controller bersama narasumber Kepala Laboratorium Ir. Meyhart Bangkit Sitorus, S.T., M.Eng., IPM.',
  },
  {
    url: '/images/kegiatan_praktikum_mahasiswa.jpg',
    title: 'Sesi Hands-on Workshop PLC',
    desc: 'Peserta workshop melaksanakan simulasi langsung perancangan logika diagram ladder dan pembuatan antarmuka HMI menggunakan laptop masing-masing.',
  },
  {
    url: '/images/kegiatan_trainer_plc_panel.jpg',
    title: 'Workshop Wiring Trainer Kit',
    desc: 'Praktik langsung instalasi wiring fisik pada modul trainer kit PLC Omron dan panel otomasi industri selama sesi workshop berlangsung.',
  },
  {
    url: '/images/kegiatan_water_level_control.jpg',
    title: 'Penutupan & Penyerahan Plakat',
    desc: 'Sesi penutupan Workshop Otomasi Basic PLC dan penyerahan plakat apresiasi proyek implementasi sistem Water Level Control.',
  },
]

const defaultAboutStats = [
  { label: 'Prodi', value: '4 Prodi', desc: 'Teknik Elektro, Sistem Tenaga, dll' },
  { label: 'Mahasiswa / Smt', value: '200+', desc: 'Praktikan aktif setiap semester' },
  { label: 'Tim Asisten', value: '10 Asisten', desc: 'Instruktur lab berpengalaman' },
  { label: 'Software Utama', value: '4 Perangkat', desc: 'MATLAB, CX-One, NB Designer, dll' },
]

export default function AboutPage({ setCurrentPage }: AboutPageProps) {
  const photos = labPhotos

  const [aboutStats, setAboutStats] = useState(defaultAboutStats)
  useEffect(() => {
    fetch('/api/stats-publik')
      .then((r) => r.json())
      .then((json) => {
        if (!json.stats) return
        setAboutStats([
          { label: 'Prodi', value: `${json.stats.totalJurusan} Prodi`, desc: 'Teknik Elektro, Sistem Tenaga, dll' },
          { label: 'Mahasiswa / Smt', value: `${json.stats.totalPraktikan}+`, desc: 'Praktikan aktif setiap semester' },
          { label: 'Tim Asisten', value: `${json.stats.totalAsisten} Asisten`, desc: 'Instruktur lab berpengalaman' },
          { label: 'Software Utama', value: '4 Perangkat', desc: 'MATLAB, CX-One, NB Designer, dll' },
        ])
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#F4F8FC' }}>
      {/* Page header — Premium Senuansa with Glassmorphism, Ambient Glow & Luminous Typography */}
      <div
        className="relative pt-24 pb-14 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #162D4E 0%, #234575 45%, #537AB8 100%)',
        }}
      >
        {/* Sharp Dot Matrix Background */}
        <div
          className="absolute inset-0 dots-header pointer-events-none opacity-40"
          style={{ zIndex: 1 }}
        />

        {/* Ambient Glow Accents */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(186, 214, 235, 0.2) 0%, transparent 70%)',
            zIndex: 2,
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(83, 122, 184, 0.25) 0%, transparent 70%)',
            zIndex: 2,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 text-center" style={{ zIndex: 10 }}>
          {/* Section Badge with Glassmorphism */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 shadow-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(22, 45, 78, 0.2)',
            }}
          >
            Tentang Lab ICAL
          </div>

          {/* Headline with 2-Tone Luminous Gradient */}
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
              lineHeight: 1.2,
              marginBottom: '1.1rem',
              textShadow: '0 4px 20px rgba(22, 45, 78, 0.5)',
            }}
          >
            <span className="text-white block">Intelligent Control & Automation</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D8EBFF 35%, #BAD6EB 70%, #93C5FD 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(186, 214, 235, 0.6))',
              }}
            >
              Laboratory
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="max-w-2xl mx-auto text-base sm:text-lg font-normal"
            style={{
              color: '#E8F1FA',
              lineHeight: 1.7,
              textShadow: '0 2px 8px rgba(22, 45, 78, 0.4)',
            }}
          >
            Laboratorium terdepan di Institut Teknologi PLN untuk riset, inovasi, dan praktikum sistem kontrol serta otomasi industri modern.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 space-y-16">
        {/* Description & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-[#BAD6EB] shadow-sm">
          <div className="lg:col-span-7">
            <div className="section-badge mb-3"><Icon name="clipboard-list" size={13} /> Deskripsi</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.75rem', color: '#162D4E', marginBottom: '1rem' }}>
              Tentang ICAL
            </h2>
            <p style={{ color: '#3B577D', lineHeight: 1.8, marginBottom: '1rem', fontSize: '0.95rem' }}>
              <strong>Intelligent Control & Automation Laboratory (ICAL)</strong> merupakan pusat praktikum di bawah naungan Institut Teknologi PLN yang berfokus pada pengembangan kompetensi mahasiswa di bidang sistem kontrol, otomasi industri, dan instrumentasi cerdas.
            </p>
            <p style={{ color: '#3B577D', lineHeight: 1.8, fontSize: '0.95rem' }}>
              Didukung oleh {aboutStats[2].value.split(' ')[0]} asisten berpengalaman dan perangkat mutakhir, ICAL menyelenggarakan praktikum untuk tiga mata kuliah utama: <strong>Dasar Sistem Kontrol (DSK)</strong>, <strong>Programmable Logic Controller (PLC)</strong>, dan <strong>Sistem Kontrol Industri (SKI)</strong>.
            </p>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {aboutStats.map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center card-hover bg-[#EEF5FA] border border-[#BAD6EB]">
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#162D4E' }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#537AB8', marginTop: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#3B577D', marginTop: '3px' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visi & Misi Cards */}
        <div className="space-y-6">
          {/* Card Visi */}
          <div
            className="relative bg-white rounded-3xl p-6 sm:p-9 overflow-hidden transition-all duration-300 shadow-xs"
            style={{
              border: '1.5px solid #BAD6EB',
              boxShadow: '0 4px 24px rgba(83, 122, 184, 0.08)',
            }}
          >
            {/* Left vertical accent bar */}
            <div className="absolute left-0 top-1/4 w-1.5 h-20 bg-[#537AB8] rounded-r-full pointer-events-none" />

            {/* Left soft fluid wave */}
            <svg
              className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-44 pointer-events-none opacity-35"
              viewBox="0 0 100 200"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M0 0 C 45 35, 60 70, 30 120 C 10 160, 45 190, 0 200 Z" fill="#BAD6EB" />
            </svg>

            {/* Top-left dot grid */}
            <div className="absolute left-7 top-7 grid grid-cols-6 gap-2 opacity-35 pointer-events-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#537AB8]" />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-start gap-6 sm:pl-28">
              <div className="hidden sm:block absolute left-22 top-1 bottom-1 w-[1.5px] bg-[#EEF5FA]" />

              <div className="w-full">
                <h3
                  className="font-extrabold text-2xl sm:text-[1.75rem] text-[#162D4E] tracking-tight mb-1.5"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Visi
                </h3>
                <div className="w-12 h-1.5 rounded-full bg-[#537AB8] mb-4" />
                <p style={{ color: '#3B577D', lineHeight: 1.85, fontSize: '0.95rem' }} className="max-w-3xl">
                  Menjadi laboratorium unggulan berkelas internasional dalam pendidikan, penelitian, dan inovasi sistem kontrol, otomasi industri cerdas, serta teknologi energi terbarukan yang berwawasan lingkungan dan berkontribusi pada pengembangan energi berkelanjutan dan industri 4.0 di Indonesia.
                </p>
              </div>
            </div>
          </div>

          {/* Card Misi */}
          <div
            className="relative bg-white rounded-3xl p-6 sm:p-9 overflow-hidden transition-all duration-300 shadow-xs"
            style={{
              border: '1.5px solid #BAD6EB',
              boxShadow: '0 4px 24px rgba(83, 122, 184, 0.06)',
            }}
          >
            {/* Left vertical accent bar */}
            <div className="absolute left-0 top-1/4 w-1.5 h-20 bg-[#537AB8] rounded-r-full pointer-events-none" />

            {/* Left soft fluid wave */}
            <svg
              className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-44 pointer-events-none opacity-30"
              viewBox="0 0 100 200"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M0 0 C 45 35, 60 70, 30 120 C 10 160, 45 190, 0 200 Z" fill="#BAD6EB" />
            </svg>

            {/* Bottom-left dot grid */}
            <div className="absolute left-7 bottom-7 grid grid-cols-6 gap-2 opacity-35 pointer-events-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#537AB8]" />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-start gap-6 sm:pl-28">
              <div className="hidden sm:block absolute left-22 top-1 bottom-1 w-[1.5px] bg-[#EEF5FA]" />

              <div className="w-full">
                <h3
                  className="font-extrabold text-2xl sm:text-[1.75rem] text-[#162D4E] tracking-tight mb-1.5"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Misi
                </h3>
                <div className="w-12 h-1.5 rounded-full bg-[#537AB8] mb-5" />

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
                      className={`flex items-start gap-3.5 text-sm sm:text-[0.93rem] font-medium text-[#3B577D] ${
                        i !== arr.length - 1 ? 'border-b border-slate-100 pb-3.5' : ''
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-[#537AB8] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
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

        {/* Photo gallery */}
        <div>
          <div className="section-badge mb-4"><Icon name="camera" size={13} /> Dokumentasi Workshop</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.6rem', color: '#162D4E', marginBottom: '1.5rem' }}>
            Galeri Foto & Dokumentasi Workshop
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {photos.map((p, i) => (
              <div
                key={i}
                className="group relative rounded-3xl overflow-hidden bg-white border border-[#BAD6EB] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src={p.url}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h3
                      className="font-bold text-sm text-[#102544] group-hover:text-[#0A58BE] transition-colors leading-snug mb-1"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#4B6B94] leading-relaxed line-clamp-3">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
