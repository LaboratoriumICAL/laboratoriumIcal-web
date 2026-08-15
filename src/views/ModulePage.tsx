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

// Warna & ikon tampilan per kode praktikum. Kalau ada kode baru yang belum
// terdaftar di sini, otomatis dapat warna & ikon default (lihat DEFAULT_STYLE).
const STYLE_BY_KODE: Record<string, { color: string; emoji: string }> = {
  DSK: { color: '#015c61', emoji: 'settings' },
  PLC: { color: '#016e75', emoji: 'cpu' },
  SKI: { color: '#06aeb7', emoji: 'target' },
}
const DEFAULT_STYLE = { color: '#015c61', emoji: 'book-open' }

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
    <div className="min-h-screen" style={{ background: '#f0fbfb' }}>
      {/* Header */}
      <div
        className="relative pt-24 pb-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #014346, #015c61, #016e75)' }}
      >
        <div className="absolute inset-0 dots-bg opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <div className="section-badge mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Icon name="book-open" size={14} /> Modul Praktikum
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'white' }}>
            Modul Praktikum ICAL
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.75rem', fontSize: '1rem' }}>
            Unduh modul lengkap untuk mata praktikum yang tersedia di ICAL
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16">
        {loading && (
          <div className="text-center py-10" style={{ color: '#64748b' }}>
            <Icon name="loader" size={22} className="inline animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-6" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            <Icon name="warning" size={15} className="inline mr-1 align-text-bottom" /> {error}
          </div>
        )}

        {!loading && !error && modules.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'white', border: '1.5px solid #e0f7fa' }}>
            <div className="mb-4 flex justify-center"><Icon name="inbox" size={44} color="#94a3b8" strokeWidth={1.5} /></div>
            <p style={{ color: '#64748b' }}>Belum ada modul yang tersedia.</p>
          </div>
        )}

        {!loading && !error && modules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {modules.map((mod, idx) => {
              const config = STYLE_BY_KODE[mod.kode_singkat] || { emoji: 'book-open' }
              const iconName = mod.kode_singkat === 'DSK' ? 'sliders' : mod.kode_singkat === 'PLC' ? 'cpu' : mod.kode_singkat === 'SKI' ? 'target' : config.emoji
              const belumAda = !mod.file_path
              const decorType = idx % 3 === 0 ? 'dots-left' : idx % 3 === 1 ? 'wave-right' : 'dots-right'

              return (
                <div
                  key={mod.id}
                  className="rounded-3xl p-6 sm:p-7 relative overflow-hidden card-hover flex flex-col justify-between items-center text-center transition-all duration-300"
                  style={{
                    background: 'white',
                    border: '1.5px solid #d8f3f5',
                    boxShadow: '0 4px 24px rgba(1,92,97,0.06)',
                  }}
                >
                  {/* Background Decoration 1: Top-Left Dots for Card 1 */}
                  {decorType === 'dots-left' && (
                    <div className="absolute top-5 left-5 grid grid-cols-4 gap-1.5 opacity-25 pointer-events-none">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#06aeb7]" />
                      ))}
                    </div>
                  )}

                  {/* Background Decoration 2: Top-Right Soft Wave for Card 2 */}
                  {decorType === 'wave-right' && (
                    <svg
                      className="absolute top-0 right-0 w-28 h-28 pointer-events-none opacity-30"
                      viewBox="0 0 100 100"
                      fill="none"
                    >
                      <path d="M100 0 C 60 10, 40 40, 50 80 C 60 100, 80 100, 100 100 Z" fill="#a5eef2" />
                    </svg>
                  )}

                  {/* Background Decoration 3: Top-Right Dots for Card 3 */}
                  {decorType === 'dots-right' && (
                    <div className="absolute top-5 right-5 grid grid-cols-4 gap-1.5 opacity-25 pointer-events-none">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#06aeb7]" />
                      ))}
                    </div>
                  )}

                  {/* Top content: Icon, Badge, Title, Underline, Description */}
                  <div className="relative z-10 w-full flex flex-col items-center pt-2">
                    {/* Circle Icon Badge */}
                    <div
                      className="w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105"
                      style={{
                        background: '#e0f7fa',
                        color: '#015c61',
                      }}
                    >
                      <Icon name={iconName} size={36} color="#015c61" strokeWidth={1.75} />
                    </div>

                    {/* Dark Teal Category Badge */}
                    <span
                      className="inline-block px-4 py-1 rounded-full text-white text-xs font-bold mb-3 shadow-xs uppercase tracking-wider"
                      style={{ background: '#015c61', fontFamily: 'var(--font-heading)' }}
                    >
                      {mod.kode_singkat}
                    </span>

                    {/* Title */}
                    <h3
                      className="font-extrabold text-lg sm:text-[1.2rem] text-[#014346] tracking-tight mb-2 text-center"
                      style={{ fontFamily: 'var(--font-heading)', minHeight: '2.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {mod.nama}
                    </h3>

                    {/* Short Teal Underline Bar */}
                    <div className="w-8 h-1 rounded-full bg-[#06aeb7] mb-3" />

                    {/* Subtext Description */}
                    <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                      {mod.deskripsi || `Modul praktikum ${mod.kode_singkat}`}
                    </p>
                  </div>

                  {/* Bottom Action Buttons: Lihat (Opens in-app preview) & Unduh (Solid) */}
                  <div className="relative z-10 flex items-center gap-3 w-full pt-2">
                    {belumAda ? (
                      <button
                        disabled
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                        style={{ background: '#f1f5f9', color: '#94a3b8', border: '1.5px solid #e2e8f0', cursor: 'not-allowed' }}
                      >
                        <Icon name="eye" size={15} /> Lihat
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPreviewModul(mod)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all hover:bg-teal-50 flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{
                          background: 'white',
                          color: '#015c61',
                          border: '1.5px solid #015c61',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        <Icon name="eye" size={15} /> Lihat
                      </button>
                    )}

                    {belumAda ? (
                      <button
                        disabled
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                        style={{ background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }}
                      >
                        <Icon name="download" size={15} /> Unduh
                      </button>
                    ) : (
                      <a
                        href={`/modul/${mod.file_path}?download=1`}
                        download
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                        style={{
                          background: '#015c61',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        <Icon name="download" size={15} /> Unduh
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
          className="mt-10 rounded-2xl p-5 flex items-start gap-3"
          style={{ background: 'linear-gradient(135deg,#f0fbfb,#e0f7fa)', border: '1.5px solid #a5eef2' }}
        >
          <Icon name="lightbulb" size={24} className="shrink-0" color="#015c61" />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#015c61', marginBottom: '4px' }}>
              Informasi Modul
            </div>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Modul praktikum diperbarui setiap semester. Pastikan kamu mengunduh modul terbaru sebelum praktikum dimulai. Modul tersedia dalam format PDF dan dapat dicetak sesuai kebutuhan.
            </p>
          </div>
        </div>
      </div>

      {/* In-App PDF Preview Box / Modal */}
      {previewModul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeInUp">
          <div
            className="relative w-full max-w-5xl h-[88vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#a5eef2]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#e0f7fa] bg-gradient-to-r from-[#f0fbfb] to-[#e0f7fa]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#015c61] uppercase tracking-wider shrink-0">
                  {previewModul.kode_singkat}
                </span>
                <h3
                  className="font-bold text-base sm:text-lg text-[#014346] truncate"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {previewModul.nama}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/modul/${previewModul.file_path}?download=1`}
                  download
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs text-white bg-[#015c61] hover:bg-[#014346] transition-colors shadow-xs"
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
