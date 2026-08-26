import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'

interface ModulItem {
  id: string
  kode_singkat: string
  nama: string
  deskripsi: string | null
  file_path: string | null
  urutan: number
}

const MODULE_CONFIGS: Record<
  string,
  {
    pillBg: string
    title: string
    subtext: string
    icon: (color: string) => React.ReactNode
  }
> = {
  DSK: {
    pillBg: '#00142F',
    title: 'Dasar Sistem Kontrol',
    subtext: 'Modul praktikum DSK',
    icon: (color) => (
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
        <path d="M6 14h6" />
      </svg>
    ),
  },
  PLC: {
    pillBg: '#00142F',
    title: 'Programmable Logic Controller',
    subtext: 'Modul praktikum PLC',
    icon: (color) => (
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="5" width="14" height="14" rx="2" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="2" x2="9" y2="5" />
        <line x1="15" y1="2" x2="15" y2="5" />
        <line x1="9" y1="19" x2="9" y2="22" />
        <line x1="15" y1="19" x2="15" y2="22" />
        <line x1="2" y1="9" x2="5" y2="9" />
        <line x1="2" y1="15" x2="5" y2="15" />
        <line x1="19" y1="9" x2="22" y2="9" />
        <line x1="19" y1="15" x2="22" y2="15" />
      </svg>
    ),
  },
  SKI: {
    pillBg: '#00142F',
    title: 'Sistem Kontrol Industri',
    subtext: 'Modul praktikum SKI',
    icon: (color) => (
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5.5" strokeWidth="2.4" />
        <circle cx="12" cy="12" r="2" fill={color} />
      </svg>
    ),
  },
}

const DEFAULT_CONFIG = {
  pillBg: '#00142F',
  title: 'Modul Praktikum',
  subtext: 'Modul praktikum',
  icon: (color: string) => <Icon name="book-open" size={36} color={color} />,
}

export default function ModulePage() {
  const [modules, setModules] = useState<ModulItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewModul, setPreviewModul] = useState<ModulItem | null>(null)

  useEffect(() => {
    fetch('/api/modul')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setModules(json.modules || [])
      })
      .catch((err) => setError(err.message || 'Gagal memuat daftar modul.'))
      .finally(() => setLoading(false))
  }, [])

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewModul(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#F4F8FC' }}>
      {/* Background Molecular Network Watermark Pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="nodePattern" width="280" height="280" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="3" fill="#BAD6EB" />
            <circle cx="140" cy="80" r="2.5" fill="#0284C7" />
            <circle cx="220" cy="50" r="3" fill="#BAD6EB" />
            <circle cx="90" cy="180" r="2.5" fill="#BAD6EB" />
            <circle cx="200" cy="200" r="3" fill="#0284C7" />
            <line x1="40" y1="40" x2="140" y2="80" stroke="#BAD6EB" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="140" y1="80" x2="220" y2="50" stroke="#BAD6EB" strokeWidth="0.8" />
            <line x1="140" y1="80" x2="90" y2="180" stroke="#BAD6EB" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="90" y1="180" x2="200" y2="200" stroke="#BAD6EB" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nodePattern)" />
      </svg>

      {/* Header */}
      <div
        className="relative pt-24 pb-14 overflow-hidden mb-6"
        style={{
          background: 'linear-gradient(135deg, #00142F 0%, #062B57 40%, #0C4E9C 75%, #0284C7 100%)',
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
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
            zIndex: 2,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 text-center" style={{ zIndex: 10 }}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 shadow-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0, 20, 47, 0.2)',
            }}
          >
            Modul Praktikum
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
              lineHeight: 1.2,
              marginBottom: '1.1rem',
              color: 'white',
              textShadow: '0 4px 20px rgba(0, 20, 47, 0.5)',
            }}
          >
            <span className="text-white block">Modul & Panduan</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D8EBFF 35%, #7DD3FC 70%, #38BDF8 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.6))',
              }}
            >
              Praktikum ICAL
            </span>
          </h1>
          <p
            className="max-w-2xl mx-auto text-base sm:text-lg font-normal"
            style={{
              color: '#E8F1FA',
              lineHeight: 1.7,
              textShadow: '0 2px 8px rgba(0, 20, 47, 0.4)',
            }}
          >
            Unduh modul lengkap untuk seluruh mata praktikum yang diselenggarakan di Laboratorium ICAL
          </p>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-16" style={{ zIndex: 10 }}>
        {loading && (
          <div className="text-center py-10" style={{ color: '#2F4D7B' }}>
            <Icon name="loader" size={22} className="inline animate-spin text-[#5C8BC8]" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl px-4 py-3 text-sm mb-6" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            <Icon name="warning" size={15} className="inline mr-1 align-text-bottom" /> {error}
          </div>
        )}

        {!loading && !error && modules.length === 0 && (
          <div className="rounded-3xl p-10 text-center bg-white" style={{ border: '1.5px solid #BAD6EB' }}>
            <div className="mb-4 flex justify-center"><Icon name="inbox" size={44} color="#94A3B8" strokeWidth={1.5} /></div>
            <p style={{ color: '#2F4D7B' }}>Belum ada modul yang tersedia.</p>
          </div>
        )}

        {!loading && !error && modules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {modules.map((mod) => {
              const config = MODULE_CONFIGS[mod.kode_singkat] || DEFAULT_CONFIG
              const belumAda = !mod.file_path

              return (
                <div
                  key={mod.id}
                  className="rounded-[28px] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between items-center text-center transition-all duration-300 bg-white group hover:-translate-y-1.5"
                  style={{
                    border: '1.5px solid #D6E4F0',
                    boxShadow: '0 12px 36px rgba(83, 122, 184, 0.12)',
                  }}
                >
                  {/* Top-Left Royal Blue Curved Wave Accent (SVG) */}
                  <svg
                    className="absolute top-0 left-0 w-36 h-36 pointer-events-none"
                    viewBox="0 0 160 160"
                    fill="none"
                  >
                    <path
                      d="M0 0 L115 0 C75 40 40 75 0 115 Z"
                      fill="url(#gradWaveTop)"
                      opacity="0.95"
                    />
                    <path
                      d="M0 0 L145 0 C95 55 55 95 0 145 Z"
                      fill="#0284C7"
                      opacity="0.18"
                    />
                    <defs>
                      <linearGradient id="gradWaveTop" x1="0" y1="0" x2="115" y2="115" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#00142F" />
                        <stop offset="50%" stopColor="#083770" />
                        <stop offset="100%" stopColor="#0284C7" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Top-Left Dot Matrix */}
                  <div className="absolute top-2.5 left-2.5 w-12 h-12 pointer-events-none opacity-45">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.95) 1.2px, transparent 1.2px)',
                        backgroundSize: '7px 7px',
                      }}
                    />
                  </div>

                  {/* Bottom-Right Royal Blue Curved Wave Accent (SVG) */}
                  <svg
                    className="absolute bottom-0 right-0 w-36 h-36 pointer-events-none"
                    viewBox="0 0 160 160"
                    fill="none"
                  >
                    <path
                      d="M160 160 L45 160 C85 120 120 85 160 45 Z"
                      fill="url(#gradWaveBottom)"
                      opacity="0.95"
                    />
                    <path
                      d="M160 160 L15 160 C65 105 105 65 160 15 Z"
                      fill="#0284C7"
                      opacity="0.18"
                    />
                    <defs>
                      <linearGradient id="gradWaveBottom" x1="160" y1="160" x2="45" y2="45" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#00142F" />
                        <stop offset="50%" stopColor="#083770" />
                        <stop offset="100%" stopColor="#0284C7" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Bottom-Left Dot Matrix */}
                  <div className="absolute bottom-3 left-3 w-14 h-14 pointer-events-none opacity-35">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: 'radial-gradient(rgba(83, 122, 184, 0.75) 1.2px, transparent 1.2px)',
                        backgroundSize: '7px 7px',
                      }}
                    />
                  </div>

                  {/* Card Main Content */}
                  <div className="relative z-10 w-full flex flex-col items-center pt-2">
                    {/* Floating Hexagon Badge Icon */}
                    <div className="relative mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                      <svg width="104" height="110" viewBox="0 0 104 110" fill="none" className="filter drop-shadow-[0_8px_18px_rgba(83,122,184,0.22)]">
                        <polygon
                          points="52,4 98,28 98,82 52,106 6,82 6,28"
                          fill="#FFFFFF"
                          stroke="#D8E8F8"
                          strokeWidth="2"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[#102544]">
                        {config.icon('#102544')}
                      </div>
                    </div>

                    {/* Pill Badge */}
                    <span
                      className="inline-block px-5 py-1 rounded-full text-white text-xs font-bold mb-3 shadow-xs uppercase tracking-wider"
                      style={{ background: config.pillBg, fontFamily: 'var(--font-heading)' }}
                    >
                      {mod.kode_singkat}
                    </span>

                    {/* Title */}
                    <h3
                      className="font-extrabold text-lg sm:text-[1.22rem] text-[#102544] tracking-tight mb-1 text-center"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        minHeight: '3.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1.25,
                      }}
                    >
                      {config.title || mod.nama}
                    </h3>

                    {/* Decorative Bar Divider */}
                    <div className="flex items-center justify-center gap-1.5 my-2.5">
                      <div className="w-8 h-1 rounded-full bg-[#1B6AD4]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1B6AD4]" />
                    </div>

                    {/* Subtitle Description */}
                    <p style={{ color: '#4B6B94', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
                      {config.subtext || mod.deskripsi || `Modul praktikum ${mod.kode_singkat}`}
                    </p>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="relative z-10 flex items-center gap-3 w-full pt-1">
                    {belumAda ? (
                      <button
                        disabled
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                        style={{ background: '#F1F5F9', color: '#94A3B8', border: '1.5px solid #E2E8F0', cursor: 'not-allowed' }}
                      >
                        <Icon name="eye" size={16} /> Lihat
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPreviewModul(mod)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all hover:bg-blue-50/80 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        style={{
                          background: 'white',
                          color: '#1B6AD4',
                          border: '1.5px solid #1B6AD4',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        <Icon name="eye" size={16} /> Lihat
                      </button>
                    )}

                    {belumAda ? (
                      <button
                        disabled
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                        style={{ background: '#F1F5F9', color: '#94A3B8', cursor: 'not-allowed' }}
                      >
                        <Icon name="download" size={16} /> Unduh
                      </button>
                    ) : (
                      <a
                        href={`/modul/${mod.file_path}?download=1`}
                        download
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, #0F4C9C 0%, #165BB8 50%, #1B6AD4 100%)',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        <Icon name="download" size={16} /> Unduh
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info note */}
        <div
          className="mt-10 rounded-3xl p-6 flex items-start gap-3.5 bg-white"
          style={{ border: '1.5px solid #BAD6EB', boxShadow: '0 4px 20px rgba(83, 122, 184, 0.08)' }}
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#EEF5FA] text-[#162D4E] shrink-0 border border-[#BAD6EB]">
            <Icon name="lightbulb" size={22} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#162D4E', marginBottom: '4px' }}>
              Informasi Modul
            </div>
            <p style={{ color: '#4B6B94', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Modul praktikum diperbarui setiap semester. Pastikan kamu mengunduh modul terbaru sebelum praktikum dimulai. Modul tersedia dalam format PDF dan dapat dicetak sesuai kebutuhan.
            </p>
          </div>
        </div>
      </div>

      {/* In-App PDF Preview Box / Modal */}
      {previewModul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeInUp">
          <div
            className="relative w-full max-w-5xl h-[88vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#C6DBF2]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#C6DBF2] bg-[#537AB8]  ">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#2F4D7B] uppercase tracking-wider shrink-0">
                  {previewModul.kode_singkat}
                </span>
                <h3
                  className="font-bold text-base sm:text-lg text-[#1B3258] truncate"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {previewModul.nama}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/modul/${previewModul.file_path}?download=1`}
                  download
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs text-white bg-[#2F4D7B] hover:bg-[#172554] transition-colors shadow-xs"
                >
                  <Icon name="download" size={14} /> Unduh PDF
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModul(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Tutup Preview (Esc)"
                >
                  <Icon name="x" size={20} />
                </button>
              </div>
            </div>

            {/* Modal PDF Preview Content */}
            <div className="flex-1 w-full h-full bg-slate-100 relative">
              <iframe
                src={`/modul/${previewModul.file_path}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                className="w-full h-full border-0"
                title={`Preview ${previewModul.nama}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
