import { useState, useEffect } from 'react'

interface NavbarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
  user: { role: string; name: string } | null
  onLogout: () => void
}

const ICALLogo = () => (
  <img
    src="/images/logo-lab.png"
    alt="Logo Intelligent Control & Automation Laboratory"
    width={48}
    height={48}
    style={{ width: 'auto', height: 48, objectFit: 'contain' }}
  />
)

const ITPLNLogo = () => (
  <img
    src="/images/logo-itpln.png"
    alt="Logo Institut Teknologi PLN"
    width={36}
    height={36}
    style={{ width: 36, height: 36, objectFit: 'contain' }}
  />
)

const navLinks = [
  { label: 'Beranda', page: 'home' },
  { label: 'Tentang Lab', page: 'about' },
  { label: 'Jadwal Praktikum', page: 'schedule' },
  { label: 'Modul', page: 'module' },
  { label: 'Template', page: 'template' },
  { label: 'Software', page: 'software' },
  { label: 'Kontak Asisten', page: 'contact' },
]

export default function Navbar({ currentPage, setCurrentPage, user, onLogout }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isDashboardPage = currentPage === 'dashboard-student' || currentPage === 'dashboard-assistant'
  if (isDashboardPage) return null

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(165,238,242,0.8)' : '1px solid rgba(255,255,255,0.5)',
          boxShadow: scrolled ? '0 4px 24px rgba(1,92,97,0.08)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logos */}
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-3 group"
            >
              <ITPLNLogo />
              <div
                style={{
                  width: '1px',
                  height: '32px',
                  background: 'linear-gradient(to bottom, transparent, #a5eef2, transparent)',
                }}
              />
              <ICALLogo />
            </button>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.page}
                  onClick={() => setCurrentPage(link.page)}
                  className={`nav-link ${currentPage === link.page ? 'active' : ''}`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right actions */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => setCurrentPage(user.role === 'asisten' ? 'dashboard-assistant' : 'dashboard-student')}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Dashboard
                  </button>
                  <button onClick={onLogout} className="btn-primary text-sm py-2 px-4">
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setCurrentPage('login')} className="btn-secondary text-sm py-2 px-4">
                    Masuk
                  </button>
                  <button onClick={() => setCurrentPage('register')} className="btn-primary text-sm py-2 px-4">
                    Daftar
                  </button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-blue-50 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span
                className="block h-0.5 w-6 bg-slate-600 transition-all duration-300"
                style={{ transform: menuOpen ? 'rotate(45deg) translateY(8px)' : '' }}
              />
              <span
                className="block h-0.5 w-6 bg-slate-600 transition-all duration-300"
                style={{ opacity: menuOpen ? 0 : 1 }}
              />
              <span
                className="block h-0.5 w-6 bg-slate-600 transition-all duration-300"
                style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : '' }}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className="lg:hidden overflow-hidden transition-all duration-300"
          style={{ maxHeight: menuOpen ? '500px' : '0', opacity: menuOpen ? 1 : 0 }}
        >
          <div className="px-4 py-4 space-y-1 bg-white border-t border-blue-100">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => { setCurrentPage(link.page); setMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  color: currentPage === link.page ? '#015c61' : '#475569',
                  background: currentPage === link.page ? '#f0fbfb' : 'transparent',
                }}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => { setCurrentPage(user.role === 'asisten' ? 'dashboard-assistant' : 'dashboard-student'); setMenuOpen(false); }}
                    className="btn-secondary text-sm"
                  >
                    Dashboard
                  </button>
                  <button onClick={() => { onLogout(); setMenuOpen(false); }} className="btn-primary text-sm">
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setCurrentPage('login'); setMenuOpen(false); }} className="btn-secondary text-sm">
                    Masuk
                  </button>
                  <button onClick={() => { setCurrentPage('register'); setMenuOpen(false); }} className="btn-primary text-sm">
                    Daftar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
