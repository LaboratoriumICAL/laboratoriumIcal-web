import { useState, useEffect } from 'react'
import { assistants as initialAssistants, type Assistant } from '../data/mockData'
import { Icon } from '../components/Icon'
import ContactFullscreen3D from '../components/ContactFullscreen3D'

function CrownIcon() {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
      <path
        d="M1 12L3.5 4L7.5 8L10 2L12.5 8L16.5 4L19 12H1Z"
        fill="#f59e0b"
        stroke="#d97706"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="1" y="12" width="18" height="3" rx="1" fill="#f59e0b" />
    </svg>
  )
}

export default function ContactPage() {
  const [assistantList, setAssistantList] = useState<Assistant[]>(initialAssistants)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState<Assistant | null>(null)
  const [visible, setVisible] = useState(false)
  const [touchedId, setTouchedId] = useState<string | number | null>(null)

  useEffect(() => {
    fetch('/api/asisten')
      .then((r) => r.json())
      .then((json) => {
        if (json.assistants && json.assistants.length > 0) {
          const sorted = [...json.assistants].sort((a, b) =>
            (a.nim || '').localeCompare(b.nim || '', undefined, { numeric: true })
          )
          setAssistantList(sorted)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selected) {
      setTimeout(() => setVisible(true), 50)
    } else {
      setVisible(false)
    }
  }, [selected])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => setSelected(null), 300)
  }

  const filteredAssistants = assistantList
    .filter((ast) => {
      const q = searchTerm.toLowerCase().trim()
      if (!q) return true
      return (
        ast.name.toLowerCase().includes(q) ||
        ast.nim.toLowerCase().includes(q) ||
        ast.role.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => (a.nim || '').localeCompare(b.nim || '', undefined, { numeric: true }))

  return (
    <div className="min-h-screen" style={{ background: '#F4F8FC' }}>
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
            Kontak Asisten
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)',
              lineHeight: 1.2,
              marginBottom: '1.1rem',
              color: 'white',
              textShadow: '0 4px 20px rgba(0, 20, 47, 0.5)',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D8EBFF 35%, #7DD3FC 70%, #38BDF8 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.6))',
              }}
            >
              Tim Asisten ICAL
            </span>
          </h1>
          <p
            className="max-w-2xl mx-auto text-base sm:text-lg font-normal mb-8"
            style={{
              color: '#E8F1FA',
              lineHeight: 1.7,
              textShadow: '0 2px 8px rgba(0, 20, 47, 0.4)',
            }}
          >
            Klik kartu asisten untuk melihat kontak dan menghubungi mereka secara langsung
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Cari nama atau NIM asisten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full text-sm outline-none text-[#00142F] transition-all placeholder:text-slate-400 bg-white"
              style={{
                boxShadow: '0 8px 24px rgba(0, 20, 47, 0.08)',
                border: '1.5px solid #BED8F0',
              }}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0284C7]">
              <Icon name="search" size={16} />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
        {loading && (
          <div className="text-center py-12 text-slate-400">
            <div className="inline-block animate-spin mb-3">
              <Icon name="loader" size={24} color="#5C8BC8" />
            </div>
            <div>Memuat data asisten...</div>
          </div>
        )}

        {!loading && filteredAssistants.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Tidak ada asisten yang sesuai dengan pencarian &quot;{searchTerm}&quot;
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filteredAssistants.map((ast) => {
            const isTouched = touchedId === ast.id
            const isKoord =
              ast.role === 'Koordinator' ||
              ast.nim === '202311005' ||
              (ast.name && ast.name.toLowerCase().includes('hakimi'))

            return (
              <button
                key={ast.id}
                onClick={() => setSelected(ast)}
                onTouchStart={() => setTouchedId(ast.id)}
                onTouchEnd={() => setTimeout(() => setTouchedId(null), 300)}
                onTouchCancel={() => setTouchedId(null)}
                className={`relative rounded-3xl p-5 text-center cursor-pointer transition-all duration-400 ease-out group overflow-hidden select-none touch-manipulation hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(22,45,78,0.28)] ${
                  isTouched ? '-translate-y-1 shadow-[0_16px_36px_rgba(22,45,78,0.28)]' : ''
                }`}
                style={{
                  background: isKoord
                    ? 'linear-gradient(145deg, #FFFDF5 0%, #FEF8E7 40%, #FDF1CE 100%)'
                    : 'white',
                  border: isKoord
                    ? `1.5px solid ${selected && selected.id !== ast.id ? '#FEF3C7' : isTouched ? '#F59E0B' : 'rgba(245, 158, 11, 0.45)'}`
                    : `1.5px solid ${selected && selected.id !== ast.id ? '#F0F5FC' : isTouched ? '#537AB8' : '#C6DBF2'}`,
                  boxShadow: isKoord
                    ? isTouched
                      ? '0 14px 32px rgba(245, 158, 11, 0.3)'
                      : '0 6px 22px rgba(245, 158, 11, 0.16), 0 2px 8px rgba(22, 45, 78, 0.04)'
                    : isTouched
                      ? '0 12px 28px rgba(22, 45, 78, 0.25)'
                      : '0 4px 18px rgba(92, 139, 200, 0.08)',
                  filter: selected && selected.id !== ast.id ? 'blur(3px) saturate(0.4)' : 'none',
                  opacity: selected && selected.id !== ast.id ? 0.5 : 1,
                }}
              >
                {/* Special Ambient Gold Flare for Koordinator Default State */}
                {isKoord && (
                  <div
                    className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none z-0"
                    style={{
                      background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
                      filter: 'blur(10px)',
                    }}
                  />
                )}

                {/* Dynamic Gradient Layer on Hover (Smooth Transparency Fade) */}
                <div
                  className={`absolute inset-0 transition-opacity duration-400 ease-out pointer-events-none z-0 ${
                    isTouched ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{
                    background: isKoord
                      ? 'linear-gradient(135deg, #162D4E 0%, #203A62 45%, #78350F 100%)'
                      : 'linear-gradient(135deg, #162D4E 0%, #203E68 50%, #355C96 100%)',
                  }}
                />

                {/* Subtle Floating Bubbles (Animasi Gelembung Halus Terapung) */}
                <div
                  className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-400 ${
                    isTouched ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: '26px',
                      height: '26px',
                      left: '10%',
                      bottom: '-15px',
                      background: isKoord
                        ? 'radial-gradient(circle, rgba(254,243,199,0.55) 0%, rgba(245,158,11,0.25) 60%, transparent 100%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(186,214,235,0.2) 60%, transparent 100%)',
                      border: isKoord ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.3)',
                      animation: 'floatBubbleSoft 4.5s ease-in-out 0s infinite',
                    }}
                  />
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: '16px',
                      height: '16px',
                      left: '72%',
                      bottom: '-10px',
                      background: isKoord
                        ? 'radial-gradient(circle, rgba(254,243,199,0.55) 0%, rgba(245,158,11,0.25) 60%, transparent 100%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(186,214,235,0.2) 60%, transparent 100%)',
                      border: isKoord ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.3)',
                      animation: 'floatBubbleSoft 5.5s ease-in-out 1.2s infinite',
                    }}
                  />
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: '32px',
                      height: '32px',
                      left: '42%',
                      bottom: '-20px',
                      background: isKoord
                        ? 'radial-gradient(circle, rgba(254,243,199,0.4) 0%, rgba(245,158,11,0.18) 60%, transparent 100%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(186,214,235,0.15) 60%, transparent 100%)',
                      border: isKoord ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.25)',
                      animation: 'floatBubbleSoft 6s ease-in-out 2.4s infinite',
                    }}
                  />
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: '18px',
                      height: '18px',
                      left: '85%',
                      bottom: '-10px',
                      background: isKoord
                        ? 'radial-gradient(circle, rgba(254,243,199,0.5) 0%, rgba(245,158,11,0.2) 60%, transparent 100%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(186,214,235,0.15) 60%, transparent 100%)',
                      border: isKoord ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.3)',
                      animation: 'floatBubbleSoft 5s ease-in-out 0.6s infinite',
                    }}
                  />
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: '20px',
                      height: '20px',
                      left: '26%',
                      bottom: '-10px',
                      background: isKoord
                        ? 'radial-gradient(circle, rgba(254,243,199,0.5) 0%, rgba(245,158,11,0.2) 60%, transparent 100%)'
                        : 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(186,214,235,0.15) 60%, transparent 100%)',
                      border: isKoord ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.3)',
                      animation: 'floatBubbleSoft 6.5s ease-in-out 3.2s infinite',
                    }}
                  />
                </div>

                {/* Partial Glossy Radiant Sheen */}
                <div
                  className={`absolute inset-0 pointer-events-none z-1 transition-opacity duration-500 ${
                    isTouched ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{
                    background: isKoord
                      ? 'radial-gradient(ellipse 120% 70% at 15% 0%, rgba(254, 243, 199, 0.35) 0%, rgba(245, 158, 11, 0.15) 40%, transparent 75%)'
                      : 'radial-gradient(ellipse 120% 70% at 15% 0%, rgba(255, 255, 255, 0.28) 0%, rgba(186, 214, 235, 0.12) 40%, transparent 75%)',
                    borderTop: isKoord ? '1.5px solid rgba(251, 191, 36, 0.6)' : '1.5px solid rgba(255, 255, 255, 0.45)',
                    borderLeft: isKoord ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: 'inherit',
                  }}
                />

                {/* Soft Bottom-Right Ambient Rim Light */}
                <div
                  className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full pointer-events-none z-1 transition-opacity duration-500 ${
                    isTouched ? 'opacity-70' : 'opacity-0 group-hover:opacity-60'
                  }`}
                  style={{
                    background: isKoord
                      ? 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(186, 214, 235, 0.25) 0%, transparent 70%)',
                    filter: 'blur(12px)',
                  }}
                />

                {/* Delicate Diagonal Shimmer Sweep */}
                <div
                  className="absolute inset-0 pointer-events-none z-1 overflow-hidden"
                  style={{ borderRadius: 'inherit' }}
                >
                  <div
                    className={`absolute -inset-full bg-gradient-to-r from-transparent via-white/18 to-transparent transition-transform duration-1000 ease-out pointer-events-none ${
                      isTouched ? 'translate-x-full' : '-translate-x-full group-hover:translate-x-full'
                    }`}
                    style={{
                      transform: 'skewX(-25deg)',
                    }}
                  />
                </div>

                {/* Subtle Tech Node Watermark */}
                <div
                  className={`absolute -bottom-8 -right-8 w-28 h-28 transition-opacity duration-400 pointer-events-none z-0 ${
                    isTouched ? 'opacity-20' : 'opacity-0 group-hover:opacity-15'
                  }`}
                >
                  <svg viewBox="0 0 100 100" fill="none" stroke="#ffffff" strokeWidth="1.5">
                    <line x1="20" y1="20" x2="60" y2="30" />
                    <line x1="60" y1="30" x2="80" y2="70" />
                    <line x1="80" y1="70" x2="40" y2="80" />
                    <line x1="40" y1="80" x2="20" y2="20" />
                    <circle cx="20" cy="20" r="4" fill="#ffffff" />
                    <circle cx="60" cy="30" r="4" fill="#ffffff" />
                    <circle cx="80" cy="70" r="4" fill="#ffffff" />
                    <circle cx="40" cy="80" r="4" fill="#ffffff" />
                  </svg>
                </div>

                {/* Special Koordinator Ribbon Badge */}
                {isKoord && (
                  <div
                    className={`absolute top-3.5 right-3.5 z-20 text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider transition-all duration-300 shadow-xs border ${
                      isTouched
                        ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-sm'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 border-amber-300/80 group-hover:bg-amber-300 group-hover:text-amber-950 group-hover:border-amber-300'
                    }`}
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}
                  >
                    Koord
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10">
                  {/* Avatar */}
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 transition-all duration-400 overflow-hidden shrink-0 ${
                      isKoord
                        ? 'ring-2 ring-amber-400/80 shadow-[0_4px_16px_rgba(245,158,11,0.35)] group-hover:ring-4 group-hover:ring-amber-300 group-hover:shadow-[0_0_24px_rgba(245,158,11,0.6)]'
                        : 'group-hover:ring-4 group-hover:ring-white/40 group-hover:shadow-[0_0_20px_rgba(186,214,235,0.4)]'
                    }`}
                    style={{
                      background: isKoord ? '#d97706' : `#537AB8aa`,
                      boxShadow: isKoord ? '0 6px 18px rgba(217, 119, 6, 0.4)' : `0 6px 16px ${(ast.color || '#5C8BC8')}44`,
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {ast.photo ? (
                      <img
                        src={ast.photo}
                        alt={ast.name}
                        className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      ast.initial
                    )}
                  </div>

                  {/* Name */}
                  <div
                    className={`transition-colors duration-300 ${
                      isTouched
                        ? 'text-white'
                        : isKoord
                          ? 'text-[#78350F] group-hover:text-white font-extrabold'
                          : 'text-[#1B3258] group-hover:text-white'
                    }`}
                    style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.3, marginBottom: '4px' }}
                  >
                    {ast.name}
                  </div>

                  {/* NIM */}
                  <div
                    className={`text-[0.7rem] transition-colors duration-300 ${
                      isTouched
                        ? isKoord ? 'text-amber-200' : 'text-[#C6DBF2]'
                        : isKoord
                          ? 'text-[#B45309] group-hover:text-amber-200 font-semibold'
                          : 'text-[#5D789B] group-hover:text-[#C6DBF2]'
                    }`}
                  >
                    {ast.nim}
                  </div>

                  {/* Button Pill */}
                  <div
                    className={`mt-3.5 text-xs px-3.5 py-1.5 rounded-full transition-all duration-300 flex items-center justify-center gap-1.5 font-bold ${
                      isTouched
                        ? isKoord
                          ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-amber-950 shadow-md border-transparent'
                          : 'bg-white text-[#162D4E] border-transparent shadow-md'
                        : isKoord
                          ? 'bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#92400E] border border-amber-300 shadow-xs group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-amber-300 group-hover:text-amber-950 group-hover:border-transparent group-hover:shadow-md'
                          : 'bg-[#EEF4FB] text-[#2F4D7B] border border-[#C6DBF2] group-hover:bg-white group-hover:text-[#162D4E] group-hover:border-transparent group-hover:shadow-md'
                    }`}
                    style={{
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    <span>Lihat Kontak</span>
                    <span className="text-[11px] transition-transform duration-300 group-hover:translate-x-1">➜</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
        >
          <ContactFullscreen3D assistant={selected} onClose={handleClose} />
        </div>
      )}
    </div>
  )
}
