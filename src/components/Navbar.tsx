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
          background: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid #BED8F0' : '1px solid rgba(190,216,240,0.6)',
          boxShadow: scrolled ? '0 4px 20px rgba(0,20,47,0.08)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logos */}
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <ITPLNLogo />
              <div
                style={{
                  width: '1.5px',
                  height: '30px',
                  background: '#BED8F0',
                }}
              />
              <ICALLogo />
            </button>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = currentPage === link.page
                return (
                  <button
                    key={link.page}
                    onClick={() => setCurrentPage(link.page)}
                    className="relative py-1 text-sm font-semibold transition-all duration-200 cursor-pointer hover:text-[#0284C7]"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: isActive ? '#00142F' : '#24456F',
                    }}
                  >
                    {link.label}
                    {isActive && (
                      <span
                        className="absolute bottom-[-4px] left-0 right-0 h-[2.5px] rounded-full shadow-xs"
                        style={{
                          background: 'linear-gradient(90deg, #00142F 0%, #082F63 45%, #0284C7 100%)',
                        }}
                      />
                    )}
                  </button>
                )
              })}
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
              className="lg:hidden flex flex-col gap-1.5 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span
                className="block h-0.5 w-6 bg-[#00142F] transition-all duration-300"
                style={{ transform: menuOpen ? 'rotate(45deg) translateY(8px)' : '' }}
              />
              <span
                className="block h-0.5 w-6 bg-[#00142F] transition-all duration-300"
                style={{ opacity: menuOpen ? 0 : 1 }}
              />
              <span
                className="block h-0.5 w-6 bg-[#00142F] transition-all duration-300"
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
          <div className="px-4 py-4 space-y-1 bg-white border-t border-[#BED8F0]">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => { setCurrentPage(link.page); setMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-colors"
                style={{
                  color: currentPage === link.page ? '#00142F' : '#24456F',
                  background: currentPage === link.page ? '#EEF5FA' : 'transparent',
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
