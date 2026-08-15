import { Icon } from './Icon'

interface FooterProps {
  setCurrentPage: (page: string) => void
}

export default function Footer({ setCurrentPage }: FooterProps) {
  const links = [
    { label: 'Beranda', page: 'home' },
    { label: 'Tentang Lab', page: 'about' },
    { label: 'Jadwal Praktikum', page: 'schedule' },
    { label: 'Modul', page: 'module' },
    { label: 'Template', page: 'template' },
    { label: 'Software', page: 'software' },
    { label: 'Kontak Asisten', page: 'contact' },
  ]

  return (
    <footer
      style={{
        background: 'linear-gradient(135deg, #014346, #015c61)',
        color: 'white',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/images/logo-lab-white.png"
                alt="Logo ICAL"
                className="w-10 h-10 object-contain"
              />
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>
                  ICAL
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                  Intelligent Control & Automation Laboratory
                </div>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: '1.6' }}>
              Laboratorium Institut Teknologi PLN untuk pengembangan kompetensi mahasiswa di bidang sistem kontrol dan otomasi industri.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', color: 'white', fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
              Navigasi Cepat
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {links.map((link) => (
                <button
                  key={link.page}
                  onClick={() => setCurrentPage(link.page)}
                  className="text-left text-sm transition-colors hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', color: 'white', fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
              Kontak
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-cyan-200 mt-0.5"><Icon name="map-pin" size={16} /></span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                  Gedung B Lantai 2, Institut Teknologi PLN, Jakarta Barat
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-200"><Icon name="mail" size={16} /></span>
                <a
                  href="mailto:laboratoriumsiskon@gmail.com"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  laboratoriumsiskon@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-200"><Icon name="phone" size={16} /></span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>+62 81283020758</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="pt-6 flex items-center justify-center text-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
        >
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Intelligent Control & Automation Laboratory. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
