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

function useTypewriter(text: string, speed = 60) {
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
  { icon: 'settings', title: 'Dasar Sistem Kontrol', desc: 'Pelajari konsep fundamental kontrol otomatis, fungsi alih, dan analisis respons sistem.' },
  { icon: 'cpu', title: 'Programmable Logic Controller', desc: 'Praktik pemrograman ladder diagram dan sistem otomasi berbasis PLC Omron.' },
  { icon: 'factory', title: 'Sistem Kontrol Industri', desc: 'Penerapan SCADA, DCS, dan instrumentasi pada aplikasi kontrol skala industri.' },
]

// Nilai default dipakai sesaat sebelum statistik asli dari Supabase selesai dimuat
// (lihat useEffect fetch('/api/stats-publik') di bawah).
const defaultStats = [
  { label: 'Mahasiswa Aktif', value: '200+', icon: 'graduation-cap' },
  { label: 'Asisten Berpengalaman', value: '10', icon: 'briefcase' },
  { label: 'Jurusan', value: '4', icon: 'building' },
  { label: 'Modul Praktikum', value: '3', icon: 'book-open' },
]

export default function HomePage({ setCurrentPage }: HomePageProps) {
  const { displayed, done } = useTypewriter('Intelligent Control & Automation Laboratory', 55)
  const heroRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Berita/Pengumuman: data real dari tabel `berita` (bukan mock)
  const [announcements, setAnnouncements] = useState<Berita[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  useEffect(() => {
    fetch('/api/berita?scope=public')
      .then((r) => r.json())
      .then((json) => setAnnouncements(json.berita || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setAnnouncementsLoading(false))
  }, [])

  // Statistik: data real dari Supabase (RPC get_public_stats), fallback ke defaultStats jika API belum siap
  const [stats, setStats] = useState(defaultStats)
  useEffect(() => {
    fetch('/api/stats-publik')
      .then((r) => r.json())
      .then((json) => {
        if (!json.stats) return
        setStats([
          { label: 'Mahasiswa Aktif', value: `${json.stats.totalPraktikan}+`, icon: 'graduation-cap' },
          { label: 'Asisten Berpengalaman', value: String(json.stats.totalAsisten), icon: 'briefcase' },
          { label: 'Jurusan', value: String(json.stats.totalJurusan), icon: 'building' },
          { label: 'Modul Praktikum', value: String(json.stats.totalModul), icon: 'book-open' },
        ])
      })
      .catch(() => {})
  }, [])

  // Floating particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 20,
    left: Math.random() * 100,
    delay: Math.random() * 4,
    duration: Math.random() * 4 + 6,
    color: ['#a5eef2', '#d6f8fa', '#5cd5db', '#06aeb7', '#015c61'][i % 5],
  }))

  return (
    <div>
      {/* Hero — 3D background */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #014346 0%, #015c61 40%, #06aeb7 100%)',
        }}
      >
        {/* 3D Animation Background */}
        <div className="absolute inset-0" style={{ zIndex: 1, opacity: 0.8 }}>
          <ControlSystem3D />
        </div>

        {/* Multi-layer overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 2,
            background:
              'linear-gradient(135deg, rgba(1,67,70,0.85) 0%, rgba(1,92,97,0.75) 40%, rgba(6,174,183,0.4) 100%)',
          }}
        />

        {/* Subtle dot pattern on top of overlay */}
        <div className="absolute inset-0 dots-bg opacity-15" style={{ zIndex: 3 }} />

        {/* Content — centered over the 3D background */}
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-8 pt-28 pb-20 text-center" style={{ zIndex: 10 }}>
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${visible ? 'animate-fadeInUp' : 'opacity-0'}`}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: 'white',
              backdropFilter: 'blur(8px)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <Icon name="itpln" size={16} /> Institut Teknologi PLN
          </div>

          {/* Typewriter headline */}
          <h1
            className={`mb-6 ${visible ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 5.5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: 'white',
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
            }}
          >
            Selamat Datang di{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #a5eef2, #d6f8fa)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(165,238,242,0.5))',
              }}
            >
              {displayed}
            </span>
            {!done && (
              <span
                className="animate-blink"
                style={{
                  display: 'inline-block',
                  width: '4px',
                  height: '0.85em',
                  background: '#a5eef2',
                  marginLeft: '3px',
                  verticalAlign: 'text-bottom',
                  borderRadius: '2px',
                }}
              />
            )}
          </h1>

          {/* Subtext */}
          <p
            className={`mb-10 mx-auto ${visible ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.75,
              maxWidth: '640px',
              textShadow: '0 1px 8px rgba(0,0,0,0.2)',
            }}
          >
            Pusat praktikum untuk{' '}
            <strong style={{ color: '#a5eef2' }}>Dasar Sistem Kontrol</strong>,{' '}
            <strong style={{ color: '#a5eef2' }}>Programmable Logic Controller</strong>, dan{' '}
            <strong style={{ color: '#a5eef2' }}>Sistem Kontrol Industri</strong> di Institut Teknologi PLN.
          </p>

          {/* CTA buttons */}
          <div className={`flex flex-wrap justify-center gap-4 mb-12 ${visible ? 'animate-fadeInUp delay-300' : 'opacity-0'}`}>
            <button
              onClick={() => setCurrentPage('schedule')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base transition-all hover:shadow-2xl hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, #015c61, #06aeb7)',
                color: 'white',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 8px 24px rgba(1,92,97,0.5)',
              }}
            >
              <Icon name="calendar" size={18} /> Cek Jadwal Praktikum
            </button>
            <button
              onClick={() => setCurrentPage('module')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base transition-all hover:shadow-xl hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: 'white',
                fontFamily: 'var(--font-heading)',
                border: '2px solid rgba(255,255,255,0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Icon name="book-open" size={18} /> Lihat Modul
            </button>
          </div>
        </div>

        {/* Bottom fade to page background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28"
          style={{
            zIndex: 3,
            background: 'linear-gradient(to bottom, transparent, #f0fbfb)',
          }}
        />

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float"
          style={{ zIndex: 4, opacity: 0.7 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white flex items-start justify-center pt-1.5">
            <div
              className="w-1.5 h-2.5 rounded-full bg-white"
              style={{ animation: 'fadeInUp 1.5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section
        style={{
          background: 'linear-gradient(135deg, #014346, #015c61, #016e75)',
          padding: '2.5rem 0',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mb-1 flex justify-center"><Icon name={s.icon} size={28} color="white" strokeWidth={1.75} /></div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '2rem',
                    color: 'white',
                  }}
                >
                  {s.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{s.label}</div>
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
              color: '#015c61',
            }}
          >
            Praktikum yang Kami Sediakan
          </h2>
          <p style={{ color: '#64748b', maxWidth: '560px', margin: '0.75rem auto 0', lineHeight: 1.6 }}>
            Tiga bidang praktikum yang dirancang untuk membentuk kompetensi mahasiswa di era industri 4.0
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="card-hover rounded-3xl p-8"
              style={{
                background: 'white',
                border: '1.5px solid #e0f7fa',
                boxShadow: '0 4px 20px rgba(1,92,97,0.06)',
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: 'linear-gradient(135deg, #e0f7fa, #f0fbfb)',
                }}
              >
                <Icon name={f.icon} size={28} color="#015c61" strokeWidth={1.75} />
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: '#1e3a8a',
                  marginBottom: '0.75rem',
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
              <button
                onClick={() => setCurrentPage('about')}
                className="mt-5 text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Selengkapnya →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Announcements */}
      <section
        className="py-16"
        style={{ background: 'linear-gradient(135deg, #f0fbfb, #e0f7fa)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-10">
            <div className="section-badge mx-auto mb-4"><Icon name="megaphone" size={13} /> Pengumuman</div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#015c61',
              }}
            >
              Informasi Terbaru
            </h2>
          </div>
          {announcementsLoading ? (
            <div className="text-center text-sm" style={{ color: '#94a3b8' }}>Memuat pengumuman...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center text-sm" style={{ color: '#94a3b8' }}>Belum ada pengumuman terbaru.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl p-5 card-hover"
                  style={{
                    background: 'white',
                    border: '1.5px solid #e0f7fa',
                    boxShadow: '0 4px 16px rgba(1,92,97,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`status-badge ${a.kategori === 'info' ? 'status-ok' : a.kategori === 'pengumuman' ? 'status-err' : 'status-warn'}`}
                    >
                      {a.kategori === 'info' ? (<><Icon name="pin" size={12} className="inline mr-1" /> Info</>) : a.kategori === 'pengumuman' ? (<><Icon name="megaphone" size={12} className="inline mr-1" /> Pengumuman</>) : (<><Icon name="warning" size={12} className="inline mr-1" /> Kegiatan</>)}
                    </span>
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: '#015c61',
                      marginBottom: '0.5rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {a.judul}
                  </h4>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.6 }}>{a.isi}</p>
                  <div
                    style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.75rem' }}
                  >
                    <Icon name="calendar-days" size={13} className="inline mr-1 align-text-bottom" /> {a.tanggal_terbit}
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
                color: '#015c61',
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
                  <Icon name={item.icon} size={19} className="mt-0.5" />
                  <span style={{ color: '#475569', fontSize: '0.95rem' }}>{item.label}</span>
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
              boxShadow: '0 20px 50px rgba(1,92,97,0.15)',
              border: '3px solid rgba(165,238,242,0.8)',
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

      {/* CTA strip */}
      <section
        className="py-16"
        style={{
          background: 'linear-gradient(135deg, #014346 0%, #015c61 50%, #06aeb7 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="absolute inset-0 dots-bg opacity-20" />
        <div className="relative max-w-3xl mx-auto text-center px-4">
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
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', lineHeight: 1.7 }}>
            Daftar sekarang dan akses jadwal, nilai, serta materi praktikum dari mana saja.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setCurrentPage('register')}
              className="bg-white text-teal-700 font-bold px-8 py-3 rounded-xl transition-all hover:shadow-xl hover:-translate-y-1"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Daftar Sekarang
            </button>
            <button
              onClick={() => setCurrentPage('login')}
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl transition-all hover:bg-white hover:text-teal-700"
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
