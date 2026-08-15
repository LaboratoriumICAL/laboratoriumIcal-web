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

  // Fetch asisten dari Supabase
  useEffect(() => {
    fetch('/api/asisten')
      .then((r) => r.json())
      .then((json) => {
        if (json.assistants && json.assistants.length > 0) {
          setAssistantList(json.assistants)
        }
      })
      .catch(() => {
        // Tetap menggunakan initial data jika API belum siap
      })
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

  const filteredAssistants = assistantList.filter((ast) => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    return (
      ast.name.toLowerCase().includes(q) ||
      ast.nim.toLowerCase().includes(q) ||
      ast.role.toLowerCase().includes(q)
    )
  })

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
            <Icon name="users" size={14} /> Kontak Asisten
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'white' }}>
            Tim Asisten ICAL
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.75rem' }}>
            Klik kartu asisten untuk melihat kontak dan menghubungi mereka secara langsung <Icon name="sparkles" size={14} className="inline align-text-bottom" />
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Cari nama atau NIM asisten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full text-sm outline-none text-slate-800 transition-all placeholder:text-slate-400"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
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
              <Icon name="loader" size={24} color="#015c61" />
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
            return (
              <button
                key={ast.id}
                onClick={() => setSelected(ast)}
                onTouchStart={() => setTouchedId(ast.id)}
                onTouchEnd={() => setTimeout(() => setTouchedId(null), 300)}
                onTouchCancel={() => setTouchedId(null)}
                className={`relative rounded-3xl p-5 text-center cursor-pointer transition-all duration-400 ease-out group overflow-hidden select-none touch-manipulation hover:-translate-y-2.5 hover:scale-[1.03] active:scale-95 ${
                  isTouched ? '-translate-y-2 scale-[1.02] shadow-[0_20px_35px_-8px_rgba(6,174,183,0.45)]' : ''
                }`}
                style={{
                  background: 'white',
                  border: `2px solid ${selected && selected.id !== ast.id ? '#f0fbfb' : isTouched ? '#06aeb7' : '#e0f7fa'}`,
                  boxShadow: isTouched ? '0 16px 32px rgba(6,174,183,0.4)' : '0 6px 22px rgba(1,92,97,0.07)',
                  filter: selected && selected.id !== ast.id ? 'blur(3px) saturate(0.4)' : 'none',
                  opacity: selected && selected.id !== ast.id ? 0.5 : 1,
                  transform: selected && selected.id !== ast.id ? 'scale(0.95)' : undefined,
                }}
              >
                {/* Dynamic Gradient Layer (active on hover and mobile touch) */}
                <div
                  className={`absolute inset-0 transition-opacity duration-400 pointer-events-none z-0 ${
                    isTouched ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{
                    background: 'linear-gradient(140deg, #013f42 0%, #015c61 50%, #06aeb7 100%)',
                  }}
                />

                {/* Animated Diagonal Shimmer Sheen */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-800 ease-in-out pointer-events-none z-0 ${
                    isTouched ? 'translate-x-full' : '-translate-x-full group-hover:translate-x-full'
                  }`}
                />

                {/* Glowing Molecular Background Pattern */}
                <div
                  className={`absolute -bottom-8 -right-8 w-28 h-28 transition-opacity duration-400 pointer-events-none z-0 ${
                    isTouched ? 'opacity-25' : 'opacity-0 group-hover:opacity-20'
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

                {/* Content Container (z-10 for elevation above gradient) */}
                <div className="relative z-10">
                  {/* Crown for coordinator */}
                  {ast.role === 'Koordinator' && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 animate-float z-20"
                      style={{ filter: 'drop-shadow(0 2px 6px rgba(245,158,11,0.6))' }}
                    >
                      <CrownIcon />
                    </div>
                  )}

                  {/* Avatar with Glow Ring on Hover & Touch */}
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 transition-all duration-400 group-hover:scale-110 group-hover:rotate-2 group-hover:ring-4 group-hover:ring-white/50 group-hover:shadow-[0_10px_25px_rgba(6,174,183,0.55)] overflow-hidden shrink-0 ${
                      isTouched ? 'scale-110 rotate-2 ring-4 ring-white/50 shadow-[0_10px_25px_rgba(6,174,183,0.55)]' : ''
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${ast.color || '#015c61'}, ${(ast.color || '#015c61')}aa)`,
                      boxShadow: `0 8px 20px ${(ast.color || '#015c61')}44`,
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

                  {ast.role === 'Koordinator' && (
                    <div
                      className={`absolute top-0 right-0 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all duration-300 group-hover:bg-amber-400 group-hover:text-amber-950 group-hover:shadow-xs ${
                        isTouched ? 'bg-amber-400 text-amber-950 shadow-xs' : ''
                      }`}
                      style={{ background: '#fef3c7', color: '#92400e', fontFamily: 'var(--font-heading)' }}
                    >
                      Koord
                    </div>
                  )}

                  {/* Assistant Name with Smooth Color Flip */}
                  <div
                    className={`transition-colors duration-300 group-hover:text-white ${
                      isTouched ? 'text-white' : 'text-[#015c61]'
                    }`}
                    style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.3, marginBottom: '4px' }}
                  >
                    {ast.name}
                  </div>

                  {/* NIM */}
                  <div
                    className={`text-[0.7rem] transition-colors duration-300 group-hover:text-teal-100/90 ${
                      isTouched ? 'text-teal-100/90' : 'text-[#94a3b8]'
                    }`}
                  >
                    {ast.nim}
                  </div>

                  {/* Action Button Pill with Glowing State on Hover & Touch */}
                  <div
                    className={`mt-3.5 text-xs px-3.5 py-1.5 rounded-full transition-all duration-300 flex items-center justify-center gap-1.5 font-semibold border group-hover:bg-white group-hover:text-[#015c61] group-hover:border-transparent group-hover:shadow-lg group-hover:scale-105 ${
                      isTouched
                        ? 'bg-white text-[#015c61] border-transparent shadow-lg scale-105'
                        : 'bg-[#e0f7fa] text-[#015c61] border-[#b2ebf2]'
                    }`}
                    style={{
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <span>Lihat Kontak</span>
                    <span
                      className={`transition-all duration-300 text-[10px] ${
                        isTouched
                          ? 'opacity-100 translate-x-0'
                          : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                      }`}
                    >
                      ➜
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fullscreen 3D takeover saat kartu dipilih */}
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
