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

  useEffect(() => {
    fetch('/api/software')
      .then((r) => r.json())
      .then((json) => {
        if (json.software && json.software.length > 0) {
          setSoftwareList(json.software)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveVideo(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen pb-24 font-sans" style={{ background: '#F4F8FC' }}>
      {/* Header */}
      <div
        className="relative pt-24 pb-14 overflow-hidden mb-12"
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
            Software Praktikum
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
            <span className="text-white block">Perangkat Lunak</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D8EBFF 35%, #7DD3FC 70%, #38BDF8 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.6))',
              }}
            >
              Laboratorium ICAL
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
            Koleksi alat teknis resmi dan mudah digunakan untuk mendukung seluruh kegiatan praktikum Anda
          </p>
        </div>
      </div>

      {/* Cards List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-10">
        {loading && (
          <div className="text-center py-12 text-slate-400">
            <div className="inline-block animate-spin mb-3">
              <Icon name="loader" size={24} color="#0284C7" />
            </div>
            <div>Memuat daftar perangkat lunak...</div>
          </div>
        )}

        {softwareList.map((s, i) => {
          return (
            <div
              key={s.id || i}
              className="relative p-[2.5px] drop-shadow-[0_16px_40px_rgba(0,20,47,0.12)] transition-transform duration-300 hover:-translate-y-1.5"
              style={{
                background: 'linear-gradient(135deg, #00142F 0%, #083770 35%, #0284C7 70%, #7DD3FC 100%)',
                clipPath: 'polygon(46px 0%, 100% 0%, 100% calc(100% - 46px), calc(100% - 46px) 100%, 0% 100%, 0% 46px)',
              }}
            >
              <div
                className="relative overflow-hidden p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-14"
                style={{
                  background: 'linear-gradient(135deg, #F4F9FF 0%, #E6F2FD 35%, #D4E9FC 70%, #C4E0FA 100%)',
                  clipPath: 'polygon(44.5px 0%, 100% 0%, 100% calc(100% - 44.5px), calc(100% - 44.5px) 100%, 0% 100%, 0% 44.5px)',
                }}
              >
                {/* Ambient Soft Blue Radial Glows */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 18% 50%, rgba(83, 122, 184, 0.22) 0%, transparent 60%), radial-gradient(circle at 85% 15%, rgba(147, 197, 253, 0.45) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(22, 45, 78, 0.08) 0%, transparent 40%)',
                  }}
                />

                {/* Top-left dot grid (Biru Muda Bercahaya) */}
                <div className="absolute left-6 top-6 grid grid-cols-4 gap-1.5 opacity-70 pointer-events-none">
                  {Array.from({ length: 20 }).map((_, idx) => (
                    <span key={idx} className="w-1.5 h-1.5 rounded-full bg-[#8EBCE6]" />
                  ))}
                </div>

                {/* Bottom-right dot grid (Biru Muda Bercahaya) */}
                <div className="absolute right-6 bottom-6 grid grid-cols-5 gap-1.5 opacity-70 pointer-events-none">
                  {Array.from({ length: 20 }).map((_, idx) => (
                    <span key={idx} className="w-1.5 h-1.5 rounded-full bg-[#8EBCE6]" />
                  ))}
                </div>

                {/* Top-right orbital arc */}
                <svg className="absolute top-0 right-0 w-52 h-52 pointer-events-none opacity-50" viewBox="0 0 160 160" fill="none">
                  <path d="M160 20 C 100 20, 60 60, 60 120" stroke="#7BAEDC" strokeWidth="1.75" strokeDasharray="5 3" />
                  <circle cx="60" cy="120" r="4" fill="#2563EB" />
                </svg>

                {/* Left Icon (Double Ring / Orbit Badge in Biru Tua & Biru Muda) */}
                <div className="relative shrink-0 flex items-center justify-center p-3 z-10">
                  {/* Radar ripple 1 */}
                  <div
                    className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full pointer-events-none"
                    style={{
                      border: '2px solid rgba(147, 197, 253, 0.85)',
                      animation: 'radarPing 2.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                  />

                  {/* Radar ripple 2 */}
                  <div
                    className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full pointer-events-none"
                    style={{
                      border: '1.5px solid rgba(147, 197, 253, 0.65)',
                      animation: 'radarPing 2.8s cubic-bezier(0, 0, 0.2, 1) 1.4s infinite',
                    }}
                  />

                  {/* Main Orbit Ring */}
                  <div
                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center relative"
                    style={{
                      border: '2px solid #9DC4EB',
                      animation: 'pulseRipple 3.5s ease-in-out infinite',
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        animation: 'orbitSpin 7s linear infinite',
                      }}
                    >
                      <div
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#162D4E] shadow-[0_0_12px_#3B82F6]"
                      />
                    </div>

                    <div
                      className="w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-white flex items-center justify-center relative z-10 transition-transform duration-300 hover:scale-105"
                      style={{
                        boxShadow: '0 10px 28px rgba(83, 122, 184, 0.25)',
                        border: '2px solid #BAD6EB',
                        animation: 'pulseHeartbeat 3.5s ease-in-out infinite',
                      }}
                    >
                      <Icon name={s.icon} size={46} color="#162D4E" strokeWidth={1.9} />
                    </div>
                  </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 text-center md:text-left relative z-10">
                  {/* Version badge */}
                  <div
                    className="inline-block px-3.5 py-1 rounded-full text-xs font-bold mb-2.5 shadow-xs"
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#162D4E',
                      border: '1.5px solid #BAD6EB',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    Versi {s.version}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-2xl sm:text-3xl md:text-[2.1rem] font-extrabold mb-2 tracking-tight"
                    style={{
                      color: '#102544',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {s.name}
                  </h3>

                  {/* Description */}
                  <p className="text-[#2C4D78] text-sm sm:text-[0.95rem] mb-4 leading-relaxed max-w-xl font-medium">
                    {s.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-105"
                        style={{
                          background: 'rgba(255, 255, 255, 0.9)',
                          color: '#162D4E',
                          border: '1.5px solid #BAD6EB',
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
                      className="px-7 py-2.5 rounded-full font-bold text-sm text-white flex items-center gap-2 shadow-md hover:shadow-xl transition-all hover:scale-[1.03] cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #102544 0%, #164E8E 50%, #1D70D8 100%)',
                        boxShadow: '0 4px 14px rgba(29, 112, 216, 0.35)',
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

                    <button
                      type="button"
                      className="px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-xs hover:shadow-md transition-all hover:scale-[1.03] cursor-pointer bg-white"
                      style={{
                        color: '#162D4E',
                        border: '1.5px solid #9DC4EB',
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
                      <Icon name="book-open" size={16} color="#162D4E" /> Panduan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* In-App Video Guide Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm animate-fadeInUp"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#5C8BC8]/40"
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
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
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

            {/* Video Player Container */}
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
