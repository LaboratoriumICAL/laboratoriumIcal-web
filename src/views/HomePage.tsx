import { useState, useEffect, useRef } from 'react'
import { Icon } from '../components/Icon'
import ControlSystem3D from '../components/ControlSystem3D'

interface Berita {
  id: string
  judul: string
  isi: string
  kategori: 'pengumuman' | 'info' | 'kegiatan'
  tanggal_terbit: string
}

interface HomePageProps {
  setCurrentPage: (page: string) => void
}

function useTypewriter(text: string, speed = 55) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        setDone(true)
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])
  return { displayed, done }
}



function renderTagIcon(type: string) {
  switch (type) {
    case 'matlab':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 16l4-9 5 12 4-7 5 4" />
        </svg>
      )
    case 'simulink':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <path d="M10 6.5h4v11h-4" />
        </svg>
      )
    case 'pid':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 18c4-12 7-12 10 0s6 0 10-6" />
        </svg>
      )
    case 'chip':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <rect x="9" y="9" width="6" height="6" fill="currentColor" fillOpacity="0.4" />
          <path d="M9 2v3m6-3v3m-6 14v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3" />
        </svg>
      )
    case 'code':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      )
    case 'tool':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      )
    case 'scada':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )
    case 'sensor':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.93 19.07A10 10 0 0 1 2 12a10 10 0 0 1 2.93-7.07" />
          <path d="M19.07 4.93A10 10 0 0 1 22 12a10 10 0 0 1-2.93 7.07" />
          <path d="M8.46 15.54A5 5 0 0 1 7 12a5 5 0 0 1 1.46-3.54" />
          <path d="M15.54 8.46A5 5 0 0 1 17 12a5 5 0 0 1-1.46 3.54" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      )
    case 'iot':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      )
    default:
      return null
  }
}

const features = [
  { 
    badge: 'DSK',
    subtitle: 'SISTEM ANALOG & DIGITAL',
    title: 'Dasar Sistem Kontrol',
    desc: 'Pedoman komprehensif, bobot penilaian, aturan berpakaian, prosedur perizinan, dan simulasi interaktif respons kontroler PID.',
    bgGradient: 'linear-gradient(160deg, #002466 0%, #0045A8 45%, #0260D4 100%)',
    bgImage: '/images/card_dsk_feathered.png?v=9',
    imageClass: 'absolute right-0 bottom-0 w-full h-[54%] object-cover object-bottom',
    imageOpacity: 'opacity-75 group-hover:opacity-95',
    imageGlow: 'radial-gradient(circle at 75% 85%, rgba(56, 189, 248, 0.35) 0%, rgba(2, 96, 212, 0.2) 50%, transparent 75%)',
    btnTextColor: '#002466',
    btnArrowBg: '#0260D4',
    iconType: 'sliders',
    tags: [
      { label: 'MATLAB', type: 'matlab' },
      { label: 'Simulink', type: 'simulink' },
      { label: 'PID Tuning', type: 'pid' },
    ],
  },
  { 
    badge: 'PLC',
    subtitle: 'OTOMASI MANUFAKTUR',
    title: 'Programmable Logic Controller',
    desc: 'Tata tertib praktikum, bobot penilaian, ketentuan tugas besar & infografis, serta simulasi interaktif ladder logic diagram.',
    bgGradient: 'linear-gradient(160deg, #002466 0%, #0045A8 45%, #0260D4 100%)',
    bgImage: '/images/card_plc.png?v=9',
    imageClass: 'absolute right-2 bottom-2 w-[66%] h-[54%] object-contain object-bottom-right drop-shadow-[0_15px_25px_rgba(0,10,30,0.75)]',
    imageOpacity: 'opacity-85 group-hover:opacity-100',
    imageGlow: 'radial-gradient(circle at 85% 85%, rgba(2, 96, 212, 0.45) 0%, rgba(52, 211, 153, 0.15) 50%, transparent 75%)',
    btnTextColor: '#002466',
    btnArrowBg: '#0260D4',
    iconType: 'chip',
    tags: [
      { label: 'OMRON CP2E', type: 'chip' },
      { label: 'CX-Programmer', type: 'code' },
      { label: 'NB-Designer', type: 'tool' },
    ],
  },
  { 
    badge: 'SKI',
    subtitle: 'INDUSTRI 4.0 & SCADA',
    title: 'Sistem Kontrol Industri',
    desc: 'Modul praktikum komprehensif, penerapan instrumentasi kontrol proses industri, otomasi terintegrasi, dan panduan praktikum.',
    bgGradient: 'linear-gradient(160deg, #002466 0%, #0045A8 45%, #0260D4 100%)',
    bgImage: '/images/card_ski_feathered.png?v=9',
    imageClass: 'absolute right-0 bottom-0 w-[85%] h-[60%] object-contain object-bottom-right',
    imageOpacity: 'opacity-65 group-hover:opacity-90',
    imageGlow: 'radial-gradient(circle at 85% 85%, rgba(59, 130, 246, 0.35) 0%, rgba(124, 58, 237, 0.12) 50%, transparent 75%)',
    btnTextColor: '#002466',
    btnArrowBg: '#0260D4',
    iconType: 'factory',
    tags: [
      { label: 'SCADA', type: 'scada' },
      { label: 'Sensor Industri', type: 'sensor' },
      { label: 'IoT Otomasi', type: 'iot' },
    ],
  },
]

const defaultStats = [
  { label: 'Mahasiswa Aktif', value: '78', icon: 'graduation-cap', accent: '#38BDF8' },
  { label: 'Asisten', value: '10', icon: 'briefcase', accent: '#38BDF8' },
  { label: 'Prodi', value: '4', icon: 'building', accent: '#38BDF8' },
  { label: 'Modul Praktikum', value: '3', icon: 'book-open', accent: '#38BDF8' },
]

export default function HomePage({ setCurrentPage }: HomePageProps) {
  const { displayed, done } = useTypewriter('Intelligent Control & Automation Laboratory', 55)
  const heroRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const [announcements, setAnnouncements] = useState<Berita[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  useEffect(() => {
    fetch('/api/berita?scope=public')
      .then((r) => r.json())
      .then((json) => setAnnouncements(json.berita || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setAnnouncementsLoading(false))
  }, [])

  const [stats, setStats] = useState(defaultStats)
  useEffect(() => {
    fetch('/api/stats-publik', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (!json.stats) return
        setStats([
          { label: 'Mahasiswa Aktif', value: String(json.stats.totalPraktikan ?? 0), icon: 'graduation-cap', accent: '#38BDF8' },
          { label: 'Asisten', value: String(json.stats.totalAsisten || 10), icon: 'briefcase', accent: '#38BDF8' },
          { label: 'Prodi', value: String(json.stats.totalJurusan || 4), icon: 'building', accent: '#38BDF8' },
          { label: 'Modul Praktikum', value: String(json.stats.totalModul || 3), icon: 'book-open', accent: '#38BDF8' },
        ])
      })
      .catch(() => {})
  }, [])

  return (
    <div>
      {/* Hero — #00142F Deep Midnight Navy Gradient with Radiant Cyan & Royal Glow */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #00142F 0%, #052650 35%, #0A4A91 70%, #0284C7 100%)',
        }}
      >
        {/* Ambient Center Glow (Soft Light Aura) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background: 'radial-gradient(circle at 50% 42%, rgba(216, 231, 245, 0.38) 0%, rgba(56, 189, 248, 0.18) 48%, transparent 75%)',
          }}
        />

        {/* 3D Animation Background */}
        <div className="absolute inset-0" style={{ zIndex: 1, opacity: 0.95 }}>
          <ControlSystem3D />
        </div>

        {/* Multi-layer overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 2,
            background: 'rgba(0, 20, 47, 0.28)',
          }}
        />

        {/* Tech Dot Matrix Grid Overlay (More Transparent) */}
        <div
          className="absolute inset-0 dots-bg pointer-events-none"
          style={{
            zIndex: 3,
            opacity: 0.45,
          }}
        />

        {/* Content */}
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-8 pt-28 pb-20 text-center" style={{ zIndex: 10 }}>
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${visible ? 'animate-fadeInUp' : 'opacity-0'}`}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 100%)',
              border: '1px solid rgba(255,255,255,0.5)',
              color: 'white',
              backdropFilter: 'blur(8px)',
              fontFamily: 'var(--font-heading)',
              boxShadow: '0 4px 16px rgba(0,20,47,0.3)',
            }}
          >
            <Icon name="itpln" size={16} /> Institut Teknologi PLN
          </div>

          {/* Headline (3 Baris) */}
          <h1
            className={`mb-6 ${visible ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.9rem, 4.8vw, 3.6rem)',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#FFFFFF',
              textShadow: '0 4px 20px rgba(0,20,47,0.7)',
            }}
          >
            <span className="block text-white mb-0.5">Selamat Datang di</span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E0F2FE 30%, #7DD3FC 70%, #38BDF8 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 24px rgba(56, 189, 248, 0.7))',
              }}
            >
              Intelligent Control &
            </span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #E0F2FE 30%, #7DD3FC 70%, #38BDF8 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 24px rgba(56, 189, 248, 0.7))',
              }}
            >
              Automation Laboratory
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`max-w-2xl mx-auto mb-10 text-lg md:text-xl font-normal ${visible ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}
            style={{
              color: '#F0F5FC',
              lineHeight: 1.65,
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
            }}
          >
            Pusat praktikum untuk{' '}
            <strong style={{ color: '#BAE6FD' }}>Dasar Sistem Kontrol</strong>,{' '}
            <strong style={{ color: '#BAE6FD' }}>Programmable Logic Controller</strong>, dan{' '}
            <strong style={{ color: '#BAE6FD' }}>Sistem Kontrol Industri</strong> di Institut Teknologi PLN.
          </p>

          {/* CTA buttons */}
          <div className={`flex flex-wrap justify-center gap-4 mb-12 ${visible ? 'animate-fadeInUp delay-300' : 'opacity-0'}`}>
            <button
              onClick={() => setCurrentPage('schedule')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base transition-all duration-300 hover:shadow-[0_12px_30px_rgba(2,132,199,0.5)] hover:-translate-y-1 hover:scale-[1.03] active:scale-95 cursor-pointer text-white"
              style={{
                background: 'linear-gradient(135deg, #00142F 0%, #073368 40%, #0C4E9C 75%, #0284C7 100%)',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 8px 24px rgba(0, 20, 47, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
                border: '1.5px solid rgba(125, 211, 252, 0.5)',
              }}
            >
              <Icon name="calendar" size={18} /> Cek Jadwal Praktikum
            </button>
            <button
              onClick={() => setCurrentPage('module')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)',
                color: 'white',
                fontFamily: 'var(--font-heading)',
                border: '1.5px solid rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Icon name="book-open" size={18} /> Lihat Modul
            </button>
          </div>
        </div>

        {/* Bottom Luminous Light Glow (Pendaran Cahaya Bawah Hero) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-52 pointer-events-none"
          style={{
            zIndex: 3,
            background: 'linear-gradient(to top, rgba(244, 248, 252, 1) 0%, rgba(216, 235, 252, 0.65) 30%, rgba(186, 214, 235, 0.28) 65%, transparent 100%)',
          }}
        />
      </section>

      {/* Stats strip - Gradient #000B1A to #00142F to #0A325E */}
      <section
        style={{
          background: 'linear-gradient(135deg, #000917 0%, #00142F 50%, #072F5E 100%)',
          padding: '2.8rem 0',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-2xl">
                <div className="mb-2 flex justify-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 shadow-inner border border-white/10">
                    <Icon name={s.icon} size={24} color="#38BDF8" strokeWidth={1.8} />
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '2.1rem',
                    color: 'white',
                    lineHeight: 1.1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practicum areas */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-12">
          <div className="section-badge mx-auto mb-4">Bidang Praktikum</div>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
              fontWeight: 700,
              color: '#00142F',
            }}
          >
            Praktikum yang Kami Sediakan
          </h2>
          <p style={{ color: '#24456F', maxWidth: '560px', margin: '0.75rem auto 0', lineHeight: 1.6 }}>
            Tiga bidang praktikum yang dirancang untuk membentuk kompetensi mahasiswa di era industri 4.0
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-[28px] sm:rounded-3xl p-6 sm:p-7 relative overflow-hidden group flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5"
              style={{
                background: f.bgGradient,
                boxShadow: '0 16px 40px -10px rgba(0, 20, 47, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12) inset',
              }}
            >
              {/* Background Photographic Visualization (Native Feathered Transparent PNGs) */}
              <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-[28px] sm:rounded-3xl">
                <img
                  src={f.bgImage}
                  alt={f.title}
                  className={`${f.imageClass} ${f.imageOpacity} group-hover:scale-105 transition-all duration-700 pointer-events-none`}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: f.imageGlow,
                  }}
                />
              </div>

              {/* Card Header & Content */}
              <div className="relative z-10">
                {/* Top Row: Category Subtitle & Dot Matrix */}
                <div className="flex items-center justify-between mb-4">
                  {/* Category Subtitle */}
                  <div
                    className="text-[0.68rem] font-bold uppercase tracking-wider text-[#7DD3FC]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {f.subtitle}
                  </div>

                  {/* Dot Matrix Grid */}
                  <div className="grid grid-cols-4 gap-1.5 opacity-30 pointer-events-none">
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <span key={idx} className="w-1 h-1 rounded-full bg-white" />
                    ))}
                  </div>
                </div>

                {/* Headline */}
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    lineHeight: 1.25,
                    color: '#FFFFFF',
                    letterSpacing: '-0.01em',
                    textShadow: '0 2px 10px rgba(0, 20, 47, 0.35)',
                  }}
                  className="mb-2.5"
                >
                  {f.title}
                </h3>

                {/* Description */}
                <p
                  className="text-white/80 text-[0.82rem] leading-relaxed mb-5"
                  style={{ textShadow: '0 1px 3px rgba(0, 20, 47, 0.25)' }}
                >
                  {f.desc}
                </p>
              </div>

              {/* Card Footer: Tags & White Capsule CTA Button */}
              <div className="relative z-10 space-y-3.5 pt-1">
                {/* Floating Frosted Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {f.tags.map((tag, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-[0.7rem] font-medium transition-all duration-300 group-hover:bg-white/25"
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                    >
                      <span className="opacity-90">{renderTagIcon(tag.type)}</span>
                      <span>{tag.label}</span>
                    </div>
                  ))}
                </div>

                {/* White Capsule Button with Solid Arrow Circle */}
                <button
                  onClick={() => {
                    if (f.badge === 'DSK') {
                      setCurrentPage('dsk')
                    } else if (f.badge === 'PLC') {
                      setCurrentPage('plc')
                    } else {
                      setCurrentPage('module')
                    }
                  }}
                  className="w-full py-2.5 px-4 sm:px-5 rounded-full bg-white shadow-md flex items-center justify-between group/btn cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                >
                  <span
                    className="text-xs sm:text-[0.82rem] font-bold tracking-tight"
                    style={{
                      color: f.btnTextColor,
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    Jelajahi Praktikum
                  </span>

                  <span
                    className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover/btn:translate-x-1"
                    style={{ background: f.btnArrowBg }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Announcements - Light Crisp Canvas */}
      <section
        className="py-16"
        style={{ background: '#EEF5FA' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-10">
            <div className="section-badge mx-auto mb-4"><Icon name="megaphone" size={13} /> Pengumuman</div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#00142F',
              }}
            >
              Informasi Terbaru
            </h2>
          </div>
          {announcementsLoading ? (
            <div className="text-center text-sm py-8" style={{ color: '#24456F' }}>
              <Icon name="loader" size={20} className="inline animate-spin mr-2 text-[#0284C7]" /> Memuat pengumuman...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center text-sm py-8" style={{ color: '#24456F' }}>Belum ada pengumuman terbaru.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-3xl p-6 card-hover bg-white"
                  style={{
                    border: '1.5px solid #BED8F0',
                    boxShadow: '0 6px 20px rgba(0,20,47,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`status-badge ${a.kategori === 'info' ? 'status-ok' : a.kategori === 'pengumuman' ? 'status-warn' : 'status-err'}`}
                    >
                      {a.kategori === 'info' ? (<><Icon name="pin" size={12} className="inline mr-1" /> Info</>) : a.kategori === 'pengumuman' ? (<><Icon name="megaphone" size={12} className="inline mr-1" /> Pengumuman</>) : (<><Icon name="warning" size={12} className="inline mr-1" /> Kegiatan</>)}
                    </span>
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#00142F',
                      marginBottom: '0.5rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {a.judul}
                  </h4>
                  <p style={{ color: '#24456F', fontSize: '0.85rem', lineHeight: 1.6 }}>{a.isi}</p>
                  <div
                    style={{ color: '#5D7A9E', fontSize: '0.75rem', marginTop: '1rem' }}
                  >
                    <Icon name="calendar-days" size={13} className="inline mr-1 align-text-bottom text-[#0284C7]" /> {a.tanggal_terbit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Map / Location */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="section-badge mb-4"><Icon name="map-pin" size={13} /> Lokasi Kami</div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#00142F',
                marginBottom: '1rem',
              }}
            >
              Temukan Laboratorium ICAL
            </h2>
            <div className="space-y-4 mb-8">
              {[
                { icon: 'landmark', label: 'Gedung B Lantai 2, Institut Teknologi PLN' },
                { icon: 'map-pin', label: 'Jakarta Barat' },
                { icon: 'clock', label: 'Senin – Jumat: 08.00 – 18.40 WIB' },
                { icon: 'mail', label: 'laboratoriumsiskon@gmail.com' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#EEF5FA] text-[#00142F] shrink-0 border border-[#BED8F0]">
                    <Icon name={item.icon} size={16} />
                  </div>
                  <span style={{ color: '#24456F', fontSize: '0.95rem', paddingTop: '4px' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage('contact')}
              className="btn-primary"
            >
              Hubungi Asisten
            </button>
          </div>

          <div
            className="rounded-3xl overflow-hidden"
            style={{
              boxShadow: '0 16px 40px rgba(0,20,47,0.12)',
              border: '3px solid #BED8F0',
              height: '380px',
            }}
          >
            <iframe
              title="Lokasi Institut Teknologi PLN"
              src="https://maps.google.com/maps?q=Institut%20Teknologi%20PLN,%20Jakarta%20Barat&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* CTA strip - #00142F Midnight Gradient with Luminous Azure & Glow */}
      <section
        className="py-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #00142F 0%, #062B57 40%, #0A4384 75%, #0284C7 100%)',
        }}
      >
        {/* Subtle Transparent Dot Matrix Background */}
        <div
          className="absolute inset-0 dots-bg pointer-events-none"
          style={{
            zIndex: 1,
            opacity: 0.45,
          }}
        />

        {/* Ambient Center Soft Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center px-4" style={{ zIndex: 10 }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              fontWeight: 700,
              color: 'white',
              marginBottom: '1rem',
            }}
          >
            Siap Memulai Praktikummu?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.92)', marginBottom: '2rem', lineHeight: 1.7 }}>
            Masuk dengan akun ITPLN Anda untuk mengakses jadwal, nilai, serta materi praktikum dari mana saja.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => setCurrentPage('login')}
              className="bg-white text-[#00142F] font-bold px-9 py-3.5 rounded-2xl transition-all hover:shadow-2xl hover:-translate-y-1 shadow-lg cursor-pointer hover:bg-sky-50 text-base"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Masuk Akun
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
