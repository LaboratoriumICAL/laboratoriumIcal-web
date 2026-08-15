import { useState, useEffect } from 'react'
import { software as initialSoftware } from '../data/mockData'
import { Icon } from '../components/Icon'

interface SoftwareItem {
  id?: string | number
  name: string
  version: string
  icon: string
  description: string
  color?: string
  tags: string[]
  downloadUrl: string
  guideUrl: string
  youtubeId?: string
  driveId?: string
}

export default function SoftwarePage() {
  const [softwareList, setSoftwareList] = useState<SoftwareItem[]>(initialSoftware)
  const [loading, setLoading] = useState(true)
  const [activeVideo, setActiveVideo] = useState<{
    name: string
    youtubeId?: string
    guideUrl: string
    embedUrl: string
    sourceType: 'youtube' | 'drive'
  } | null>(null)

  // Fetch software dari Supabase
  useEffect(() => {
    fetch('/api/software')
      .then((r) => r.json())
      .then((json) => {
        if (json.software && json.software.length > 0) {
          setSoftwareList(json.software)
        }
      })
      .catch(() => {
        // Fallback to initial software if DB not yet migrated
      })
      .finally(() => setLoading(false))
  }, [])

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveVideo(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen pb-24 font-sans" style={{ background: '#f0fbfb' }}>
      {/* Header */}
      <div
        className="relative pt-24 pb-14 overflow-hidden mb-12"
        style={{ background: 'linear-gradient(135deg, #014346, #015c61, #016e75)' }}
      >
        <div className="absolute inset-0 dots-bg opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <div className="section-badge mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Icon name="laptop" size={14} /> Software Praktikum
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'white' }}>
            Perangkat Lunak Kami
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: '0.75rem', fontSize: '1.05rem' }}>
            Koleksi alat teknis resmi dan mudah digunakan untuk mendukung seluruh kegiatan praktikum Anda
          </p>
        </div>
      </div>

      {/* Cards List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-10">
        {loading && (
          <div className="text-center py-12 text-slate-400">
            <div className="inline-block animate-spin mb-3">
              <Icon name="loader" size={24} color="#015c61" />
            </div>
            <div>Memuat daftar perangkat lunak...</div>
          </div>
        )}

        {softwareList.map((s, i) => {
          return (
            <div
              key={s.id || i}
              className="relative p-[1.5px] drop-shadow-[0_12px_36px_rgba(1,92,97,0.08)] transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, #c7edef, #b8e6e8 50%, #d5f2f4)',
                clipPath: 'polygon(46px 0%, 100% 0%, 100% calc(100% - 46px), calc(100% - 46px) 100%, 0% 100%, 0% 46px)',
              }}
            >
              <div
                className="relative overflow-hidden p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-14"
                style={{
                  background: 'linear-gradient(135deg, #eaf6f7, #e1f4f5 50%, #eef9fa)',
                  clipPath: 'polygon(45px 0%, 100% 0%, 100% calc(100% - 45px), calc(100% - 45px) 100%, 0% 100%, 0% 45px)',
                }}
              >
                {/* Top-left dot grid (4 cols x 5 rows) */}
                <div className="absolute left-6 top-6 grid grid-cols-4 gap-1.5 opacity-25 pointer-events-none">
                  {Array.from({ length: 20 }).map((_, idx) => (
                    <span key={idx} className="w-1.5 h-1.5 rounded-full bg-[#06aeb7]" />
                  ))}
                </div>

                {/* Bottom-right dot grid (5 cols x 4 rows) */}
                <div className="absolute right-6 bottom-6 grid grid-cols-5 gap-1.5 opacity-25 pointer-events-none">
                  {Array.from({ length: 20 }).map((_, idx) => (
                    <span key={idx} className="w-1.5 h-1.5 rounded-full bg-[#06aeb7]" />
                  ))}
                </div>

                {/* Top-right orbital arc with bead */}
                <svg className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-40" viewBox="0 0 160 160" fill="none">
                  <path d="M160 20 C 100 20, 60 60, 60 120" stroke="#06aeb7" strokeWidth="1.5" />
                  <circle cx="60" cy="120" r="3.5" fill="#06aeb7" />
                </svg>

                {/* Bottom-left soft organic blob */}
                <div
                  className="absolute bottom-0 left-0 w-48 h-48 rounded-full mix-blend-multiply filter blur-2xl opacity-40 pointer-events-none"
                  style={{ background: '#b2ecee', transform: 'translate(-20%, 20%)' }}
                />

                {/* Left Icon (Double Ring / Orbit Badge with Cenat-Cenut Ripple & Orbiting Bead) */}
                <div className="relative shrink-0 flex items-center justify-center p-3">
                  {/* Outer pulsating radar ripple 1 (Cenat-cenut) */}
                  <div
                    className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full pointer-events-none"
                    style={{
                      border: '2px solid rgba(6, 174, 183, 0.45)',
                      animation: 'radarPing 2.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                  />

                  {/* Outer pulsating radar ripple 2 (Delayed) */}
                  <div
                    className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full pointer-events-none"
                    style={{
                      border: '1.5px solid rgba(6, 174, 183, 0.3)',
                      animation: 'radarPing 2.8s cubic-bezier(0, 0, 0.2, 1) 1.4s infinite',
                    }}
                  />

                  {/* Main Orbit Ring with breathing pulse */}
                  <div
                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center relative"
                    style={{
                      border: '1.5px solid #a5eef2',
                      animation: 'pulseRipple 3.5s ease-in-out infinite',
                    }}
                  >
                    {/* Orbit track for the revolving bead along the perimeter */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        animation: 'orbitSpin 7s linear infinite',
                      }}
                    >
                      {/* Glowing bead moving smoothly around the circle edge */}
                      <div
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#06aeb7] shadow-[0_0_8px_#06aeb7]"
                      />
                    </div>

                    {/* Elevated white circular disc with soft pulse */}
                    <div
                      className="w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-white flex items-center justify-center relative z-10 transition-transform duration-300 hover:scale-105"
                      style={{
                        boxShadow: '0 8px 24px rgba(1,92,97,0.08)',
                        border: '1px solid #d2f3f5',
                        animation: 'pulseHeartbeat 3.5s ease-in-out infinite',
                      }}
                    >
                      <Icon name={s.icon} size={46} color="#015c61" strokeWidth={1.75} />
                    </div>
                  </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 text-center md:text-left relative z-10">
                  {/* Version badge */}
                  <div
                    className="inline-block px-3.5 py-1 rounded-full text-xs font-bold mb-2.5 shadow-sm"
                    style={{
                      background: 'white',
                      color: '#015c61',
                      border: '1px solid #d2f3f5',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    Versi {s.version}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-2xl sm:text-3xl md:text-[2.1rem] font-extrabold mb-2 tracking-tight"
                    style={{
                      color: '#014346',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {s.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm sm:text-[0.95rem] mb-4 leading-relaxed max-w-xl">
                    {s.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold shadow-sm"
                        style={{
                          background: 'white',
                          color: '#015c61',
                          border: '1px solid #d2f3f5',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                    <a
                      href={s.downloadUrl}
                      target={s.downloadUrl !== '#' ? '_blank' : undefined}
                      rel={s.downloadUrl !== '#' ? 'noopener noreferrer' : undefined}
                      className="px-7 py-2.5 rounded-full font-bold text-sm text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                      style={{
                        background: '#015c61',
                        fontFamily: 'var(--font-heading)',
                      }}
                      onClick={(e) => {
                        if (s.downloadUrl === '#' || !s.downloadUrl) {
                          e.preventDefault()
                          alert(`Link unduhan ${s.name} segera tersedia.`)
                        }
                      }}
                    >
                      <Icon name="download" size={16} color="white" /> Unduh
                    </a>

                    {/* Panduan Button (Opens video in-app on the same tab) */}
                    <button
                      type="button"
                      className="px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                      style={{
                        background: 'white',
                        color: '#015c61',
                        border: '1.5px solid #015c61',
                        fontFamily: 'var(--font-heading)',
                      }}
                      onClick={() => {
                        const item = s as any
                        if (item.youtubeId) {
                          setActiveVideo({
                            name: s.name,
                            guideUrl: s.guideUrl,
                            embedUrl: `https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&rel=0`,
                            sourceType: 'youtube',
                          })
                        } else if (item.driveId || (s.guideUrl && s.guideUrl.includes('drive.google.com'))) {
                          const driveId = item.driveId || s.guideUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
                          setActiveVideo({
                            name: s.name,
                            guideUrl: s.guideUrl,
                            embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
                            sourceType: 'drive',
                          })
                        } else if (s.guideUrl && s.guideUrl !== '#') {
                          window.location.href = s.guideUrl
                        } else {
                          alert(`Panduan instalasi ${s.name} segera tersedia.`)
                        }
                      }}
                    >
                      <Icon name="book-open" size={16} color="#015c61" /> Panduan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* In-App Video Guide Modal (YouTube / Google Drive - Plays on same tab) */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm animate-fadeInUp"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-teal-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h3
                  className="font-bold text-base sm:text-lg text-white truncate"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Panduan Instalasi: {activeVideo.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeVideo.guideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {activeVideo.sourceType === 'drive' ? 'Buka di Google Drive ↗' : 'Buka di YouTube ↗'}
                </a>
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <Icon name="x" size={20} />
                </button>
              </div>
            </div>

            {/* Video Player Container 16:9 */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={activeVideo.embedUrl}
                title={`Panduan ${activeVideo.name}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
