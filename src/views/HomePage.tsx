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

const features = [
  { 
    icon: 'sliders', 
    title: 'Dasar Sistem Kontrol', 
    desc: 'Pedoman komprehensif, bobot penilaian, aturan berpakaian, prosedur perizinan, dan simulasi interaktif respons kontroler PID.',
    badge: 'DSK',
    color: '#537AB8',
    bg: '#EEF5FA',
    border: '#BAD6EB',
  },
  { 
    icon: 'cpu', 
    title: 'Programmable Logic Controller', 
    desc: 'Tata tertib praktikum, bobot penilaian, ketentuan tugas besar & infografis, serta simulasi interaktif ladder logic diagram.',
    badge: 'PLC',
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  { 
    icon: 'factory', 
    title: 'Sistem Kontrol Industri', 
    desc: 'Modul praktikum komprehensif, penerapan instrumentasi kontrol proses industri, otomasi terintegrasi, dan panduan praktikum.',
    badge: 'SKI',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
]

const defaultStats = [
  { label: 'Mahasiswa Aktif', value: '200+', icon: 'graduation-cap', accent: '#BAD6EB' },
  { label: 'Asisten', value: '10', icon: 'briefcase', accent: '#BAD6EB' },
  { label: 'Prodi', value: '4', icon: 'building', accent: '#BAD6EB' },
  { label: 'Modul Praktikum', value: '3', icon: 'book-open', accent: '#BAD6EB' },
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
    fetch('/api/stats-publik')
      .then((r) => r.json())
      .then((json) => {
        if (!json.stats) return
        setStats([
          { label: 'Mahasiswa Aktif', value: `${json.stats.totalPraktikan || 200}+`, icon: 'graduation-cap', accent: '#BAD6EB' },
          { label: 'Asisten', value: String(json.stats.totalAsisten || 10), icon: 'briefcase', accent: '#BAD6EB' },
          { label: 'Prodi', value: String(json.stats.totalJurusan || 4), icon: 'building', accent: '#BAD6EB' },
          { label: 'Modul Praktikum', value: String(json.stats.totalModul || 3), icon: 'book-open', accent: '#BAD6EB' },
        ])
      })
      .catch(() => {})
  }, [])

  return (
    <div>
      {/* Hero — Royal Blue Gradient with Ambient Light & Tech Dots */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #162D4E 0%, #224373 35%, #537AB8 75%, #6A90D0 100%)',
        }}
      >
        {/* Ambient Center Glow (Soft Light Aura) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background: 'radial-gradient(circle at 50% 42%, rgba(216, 231, 245, 0.45) 0%, rgba(132, 166, 214, 0.22) 48%, transparent 75%)',
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
            background: 'rgba(22, 45, 78, 0.28)',
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
              boxShadow: '0 4px 16px rgba(22,45,78,0.25)',
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
              textShadow: '0 4px 20px rgba(22,45,78,0.6)',
            }}
          >
            <span className="block text-white mb-0.5">Selamat Datang di</span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D8EBFF 30%, #93C5FD 70%, #60A5FA 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 24px rgba(147, 197, 253, 0.7))',
              }}
            >
              Intelligent Control &
            </span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D8EBFF 30%, #93C5FD 70%, #60A5FA 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 24px rgba(147, 197, 253, 0.7))',
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
              textShadow: '0 1px 8px rgba(0,0,0,0.2)',
            }}
          >
            Pusat praktikum untuk{' '}
            <strong style={{ color: '#FDE1B5' }}>Dasar Sistem Kontrol</strong>,{' '}
            <strong style={{ color: '#B5F2DC' }}>Programmable Logic Controller</strong>, dan{' '}
            <strong style={{ color: '#BAD6EB' }}>Sistem Kontrol Industri</strong> di Institut Teknologi PLN.
          </p>

          {/* CTA buttons */}
          <div className={`flex flex-wrap justify-center gap-4 mb-12 ${visible ? 'animate-fadeInUp delay-300' : 'opacity-0'}`}>
            <button
              onClick={() => setCurrentPage('schedule')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base transition-all duration-300 hover:shadow-[0_12px_30px_rgba(83,122,184,0.45)] hover:-translate-y-1 hover:scale-[1.03] active:scale-95 cursor-pointer text-white"
              style={{
                background: 'linear-gradient(135deg, #162D4E 0%, #1F3F6B 35%, #355C96 70%, #537AB8 100%)',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 8px 24px rgba(22, 45, 78, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
                border: '1.5px solid rgba(186, 214, 235, 0.5)',
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
            background: 'linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(216, 235, 252, 0.65) 30%, rgba(186, 214, 235, 0.28) 65%, transparent 100%)',
          }}
        />

        {/* Stats strip - Gradient #162D4E to #203D69 */}
      </section>

      {/* Stats strip - Gradient #162D4E to #203D69 */}
      <section
        style={{
          background: 'linear-gradient(135deg, #101F35 0%, #162D4E 50%, #203D69 100%)',
          padding: '2.8rem 0',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-2xl">
                <div className="mb-2 flex justify-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 shadow-inner">
                    <Icon name={s.icon} size={24} color="#BAD6EB" strokeWidth={1.8} />
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
              color: '#162D4E',
            }}
          >
            Praktikum yang Kami Sediakan
          </h2>
          <p style={{ color: '#3B577D', maxWidth: '560px', margin: '0.75rem auto 0', lineHeight: 1.6 }}>
            Tiga bidang praktikum yang dirancang untuk membentuk kompetensi mahasiswa di era industri 4.0
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="card-hover rounded-3xl p-8 relative overflow-hidden group bg-white"
              style={{
                border: `1.5px solid ${f.border}`,
                boxShadow: '0 6px 24px rgba(83,122,184,0.08)',
              }}
            >
              {/* Category Pill */}
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    background: f.bg,
                    border: `1px solid ${f.border}`,
                  }}
                >
                  <Icon name={f.icon} size={26} color={f.color} strokeWidth={1.8} />
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: f.bg,
                    color: f.color,
                    border: `1px solid ${f.border}`,
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {f.badge}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: '#162D4E',
                  marginBottom: '0.75rem',
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: '#3B577D', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
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
                className="mt-6 text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                style={{ color: f.color, fontFamily: 'var(--font-heading)' }}
              >
                Jelajahi <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Announcements - Solid #EEF5FA */}
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
                color: '#162D4E',
              }}
            >
              Informasi Terbaru
            </h2>
          </div>
          {announcementsLoading ? (
            <div className="text-center text-sm py-8" style={{ color: '#3B577D' }}>
              <Icon name="loader" size={20} className="inline animate-spin mr-2 text-[#537AB8]" /> Memuat pengumuman...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center text-sm py-8" style={{ color: '#3B577D' }}>Belum ada pengumuman terbaru.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-3xl p-6 card-hover bg-white"
                  style={{
                    border: '1.5px solid #BAD6EB',
                    boxShadow: '0 6px 20px rgba(83,122,184,0.08)',
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
                      color: '#162D4E',
                      marginBottom: '0.5rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {a.judul}
                  </h4>
                  <p style={{ color: '#3B577D', fontSize: '0.85rem', lineHeight: 1.6 }}>{a.isi}</p>
                  <div
                    style={{ color: '#6B87A8', fontSize: '0.75rem', marginTop: '1rem' }}
                  >
                    <Icon name="calendar-days" size={13} className="inline mr-1 align-text-bottom text-[#537AB8]" /> {a.tanggal_terbit}
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
                color: '#162D4E',
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
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#EEF5FA] text-[#162D4E] shrink-0 border border-[#BAD6EB]">
                    <Icon name={item.icon} size={16} />
                  </div>
                  <span style={{ color: '#3B577D', fontSize: '0.95rem', paddingTop: '4px' }}>{item.label}</span>
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
              boxShadow: '0 16px 40px rgba(83,122,184,0.18)',
              border: '3px solid #BAD6EB',
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

      {/* CTA strip - Royal Blue Gradient with Dots & Glow */}
      <section
        className="py-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1C3860 0%, #2F5691 40%, #537AB8 80%, #6E94D2 100%)',
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
            background: 'radial-gradient(circle at 50% 50%, rgba(216, 235, 252, 0.3) 0%, transparent 70%)',
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
            Daftar sekarang dan akses jadwal, nilai, serta materi praktikum dari mana saja.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setCurrentPage('register')}
              className="bg-white text-[#162D4E] font-bold px-8 py-3.5 rounded-2xl transition-all hover:shadow-2xl hover:-translate-y-1 shadow-lg cursor-pointer"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Daftar Sekarang
            </button>
            <button
              onClick={() => setCurrentPage('login')}
              className="border-2 border-white text-white font-semibold px-8 py-3.5 rounded-2xl transition-all hover:bg-white hover:text-[#162D4E] cursor-pointer"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Sudah Punya Akun
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
