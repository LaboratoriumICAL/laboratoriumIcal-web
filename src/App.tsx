'use client'

import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './views/HomePage'
import AboutPage from './views/AboutPage'
import SchedulePage from './views/SchedulePage'
import ModulePage from './views/ModulePage'
import SoftwarePage from './views/SoftwarePage'
import TemplatePage from './views/TemplatePage'
import ContactPage from './views/ContactPage'
import DskDetailPage from './views/DskDetailPage'
import PlcDetailPage from './views/PlcDetailPage'
import LoginPage from './views/LoginPage'
import ForgotPasswordPage from './views/ForgotPasswordPage'
import ResetPasswordPage from './views/ResetPasswordPage'
import DashboardStudent from './views/DashboardStudent'
import DashboardAssistant from './views/DashboardAssistant'
import { getSupabaseBrowser, extractNimFromItplnEmail } from './lib/supabaseClient'
import { Icon } from './components/Icon'

export interface User {
  role: string
  name: string
  nim?: string
  id?: string
  email?: string
  isItplnAccount?: boolean
  isEnrolledPraktikan?: boolean
}

const NO_FOOTER_PAGES = [
  'login',
  'forgot-password',
  'reset-password',
  'dashboard-student',
  'dashboard-assistant',
  'unregistered-praktikan',
]

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const hash = window.location.hash
      const search = window.location.search

      // Otomatis buka halaman reset password jika URL atau hash berasal dari link pemulihan email
      if (
        path === '/reset-password' ||
        path.startsWith('/reset-password') ||
        hash.includes('type=recovery') ||
        search.includes('type=recovery') ||
        search.includes('page=reset-password')
      ) {
        return 'reset-password'
      }

      if (path === '/forgot-password' || search.includes('page=forgot-password')) {
        return 'forgot-password'
      }

      if (path === '/modul' || path.startsWith('/modul/') || path === '/module' || path.startsWith('/module/')) {
        return 'module'
      }

      const searchParams = new URLSearchParams(search)
      const pageParam = searchParams.get('page')
      if (pageParam) {
        return pageParam
      }
    }
    return 'home'
  })
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  // Cek sesi login Supabase Auth yang sudah ada (mis. setelah refresh halaman atau redirect OAuth Microsoft)
  useEffect(() => {
    let cancelled = false
    let authSubscription: { unsubscribe: () => void } | null = null

    // Safety timeout: jangan biarkan user tertahan di state 'Memuat...' lebih dari 1.5 detik jika network lambat/error
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setCheckingSession(false)
    }, 1500)

    try {
      const sb = getSupabaseBrowser()

      // Deteksi event auth realtime
      const { data } = sb.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          if (!cancelled) {
            setCurrentPage('reset-password')
            setCheckingSession(false)
          }
          return
        }
        if (event === 'SIGNED_OUT') {
          if (!cancelled) {
            setUser(null)
            setCheckingSession(false)
          }
          return
        }
      })
      authSubscription = data.subscription

      // Cek apakah browser sedang berada di alur recovery password
      const isRecoveryFlow =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/reset-password') ||
          window.location.hash.includes('type=recovery') ||
          window.location.search.includes('type=recovery'))

      if (isRecoveryFlow) {
        if (!cancelled) {
          setCurrentPage('reset-password')
          setCheckingSession(false)
        }
        return
      }

      sb.auth
        .getSession()
        .then(async ({ data: sessionData }) => {
          try {
            const session = sessionData?.session
            if (!session) {
              if (!cancelled) setCheckingSession(false)
              return
            }

            // 1. Cek profil pengguna di database Supabase (jika ada)
            let profile: { role: string; nama_lengkap: string; nim: string | null } | null = null
            try {
              const { data: profileRaw, error: profileError } = await sb
                .from('profiles')
                .select('role, nama_lengkap, nim')
                .eq('id', session.user.id)
                .maybeSingle()

              if (!profileError && profileRaw) {
                profile = profileRaw as { role: string; nama_lengkap: string; nim: string | null }
              }
            } catch (pErr) {
              console.warn('Info query profiles:', pErr)
            }

            const email = session.user.email || ''

            // JIKA ROLE ASISTEN: Langsung beri akses penuh asisten
            if (profile?.role === 'asisten') {
              const asistenUser: User = {
                role: 'asisten',
                name: profile.nama_lengkap,
                nim: profile.nim || undefined,
                id: session.user.id,
                email,
                isItplnAccount: true,
                isEnrolledPraktikan: true,
              }
              if (!cancelled) {
                setUser(asistenUser)
                const savedRedirect = typeof window !== 'undefined' ? localStorage.getItem('ical_redirect_after_login') : null
                if (savedRedirect) {
                  localStorage.removeItem('ical_redirect_after_login')
                  setCurrentPage(savedRedirect)
                } else {
                  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
                  const explicitPage = urlParams?.get('page')
                  if (!explicitPage) {
                    setCurrentPage('dashboard-assistant')
                  }
                }
              }
              return
            }

            // 2. JIKA MAHASISWA (Login Akun ITPLN): Ekstrak NIM dari email
            const extractedNim = extractNimFromItplnEmail(email) || profile?.nim || undefined

            // Cek apakah mahasiswa terdaftar di kelompok praktikum semester ini
            let enrolledData: { id: string; nama_praktikan: string } | null = null
            if (extractedNim) {
              try {
                const { data: akRaw } = await sb
                  .from('anggota_kelompok')
                  .select('id, nama_praktikan')
                  .eq('nim', extractedNim)
                  .limit(1)

                const akList = akRaw as Array<{ id: string; nama_praktikan: string }> | null
                if (akList && akList.length > 0) {
                  enrolledData = {
                    id: akList[0].id,
                    nama_praktikan: akList[0].nama_praktikan,
                  }
                }
              } catch (akErr) {
                console.warn('Gagal cek anggota kelompok:', akErr)
              }
            }

            // Deteksi target halaman:
            // 1. Cek savedRedirect di localStorage
            // 2. Cek parameter URL ?page=...
            // 3. Cek pathname (/modul atau /module)
            const savedRedirect = typeof window !== 'undefined' ? localStorage.getItem('ical_redirect_after_login') : null
            if (typeof window !== 'undefined') {
              localStorage.removeItem('ical_redirect_after_login')
            }

            const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
            const pathName = typeof window !== 'undefined' ? window.location.pathname : ''
            const urlPageParam = urlParams?.get('page')
            const isModuleTarget =
              savedRedirect === 'module' ||
              urlPageParam === 'module' ||
              urlPageParam === 'modul' ||
              pathName.startsWith('/modul') ||
              pathName.startsWith('/module')

            const displayName =
              enrolledData?.nama_praktikan ||
              profile?.nama_lengkap ||
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              (email ? email.split('@')[0] : 'Mahasiswa ITPLN')

            const isEnrolled = !!(enrolledData && extractedNim)

            // Sinkronkan profil ke Supabase jika praktikan terdaftar
            if (isEnrolled) {
              try {
                await (sb.from('profiles') as any).upsert({
                  id: session.user.id,
                  role: 'praktikan',
                  nim: extractedNim,
                  nama_lengkap: displayName,
                  email,
                })
              } catch (uErr) {
                console.warn('Notice profile upsert:', uErr)
              }
            }

            const currentUserObj: User = {
              role: isEnrolled ? 'praktikan' : 'mahasiswa_itpln',
              name: displayName,
              nim: extractedNim,
              id: session.user.id,
              email,
              isItplnAccount: true,
              isEnrolledPraktikan: isEnrolled,
            }

            if (!cancelled) {
              setUser(currentUserObj)

              if (isModuleTarget) {
                // ✅ JALUR MODUL: Semua Mahasiswa ITPLN (@itpln.ac.id) langsung bisa melihat modul!
                setCurrentPage('module')
              } else if (isEnrolled) {
                // ✅ JALUR DASHBOARD (NIM Terdaftar): Masuk ke Dashboard Praktikan
                setCurrentPage('dashboard-student')
              } else {
                // ❌ JALUR DASHBOARD (NIM Tidak Terdaftar): Tampilkan layar Belum Terdaftar
                setCurrentPage('unregistered-praktikan')
              }
            }
          } catch (innerErr) {
            console.error('Error saat memproses sesi user:', innerErr)
          } finally {
            if (!cancelled) setCheckingSession(false)
          }
        })
        .catch((err) => {
          console.error('Error saat getSession Supabase:', err)
          if (!cancelled) setCheckingSession(false)
        })
    } catch {
      // Supabase belum dikonfigurasi (.env.local kosong) -- biarkan pakai halaman publik saja
      if (!cancelled) setCheckingSession(false)
    }

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      if (authSubscription) authSubscription.unsubscribe()
    }
  }, [])

  const handleLogin = (newUser: User) => {
    setUser(newUser)
    const savedRedirect = typeof window !== 'undefined' ? localStorage.getItem('ical_redirect_after_login') : null
    if (savedRedirect) {
      localStorage.removeItem('ical_redirect_after_login')
      setCurrentPage(savedRedirect)
    }
  }

  const handleLogout = () => {
    try {
      getSupabaseBrowser().auth.signOut()
    } catch {
      // no-op jika Supabase belum dikonfigurasi
    }
    setUser(null)
    setCurrentPage('home')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />
      case 'about':
        return <AboutPage setCurrentPage={setCurrentPage} />
      case 'schedule':
        return <SchedulePage />
      case 'module':
        return <ModulePage user={user} setCurrentPage={setCurrentPage} />
      case 'dsk':
      case 'dsk-detail':
      case 'modul-dsk':
        return <DskDetailPage setCurrentPage={setCurrentPage} />
      case 'plc':
      case 'plc-detail':
      case 'modul-plc':
        return <PlcDetailPage setCurrentPage={setCurrentPage} />
      case 'software':
        return <SoftwarePage />
      case 'template':
        return <TemplatePage />
      case 'contact':
        return <ContactPage />
      case 'login':
        return <LoginPage setCurrentPage={setCurrentPage} onLogin={handleLogin} />
      case 'forgot-password':
        return <ForgotPasswordPage setCurrentPage={setCurrentPage} />
      case 'reset-password':
        return <ResetPasswordPage setCurrentPage={setCurrentPage} />
      case 'unregistered-praktikan':
        return (
          <div className="min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#F4F8FC' }}>
            <div className="absolute inset-0 dots-bg opacity-30 pointer-events-none" />
            <div
              className="relative z-10 max-w-lg w-full rounded-3xl p-8 sm:p-10 bg-white text-center"
              style={{
                border: '2px solid #FED7AA',
                boxShadow: '0 20px 50px rgba(0, 20, 47, 0.08)',
              }}
            >
              <h2
                className="text-2xl font-extrabold text-[#00142F] mb-3 leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Akun Belum Terdaftar
              </h2>
              <p className="text-base text-[#24456F] mb-8 leading-relaxed">
                Akun Anda belum terdaftar sebagai praktikan. Silakan hubungi asisten lab untuk didaftarkan terlebih dahulu.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage('module')}
                  className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Icon name="book-open" size={16} /> Lihat Modul Praktikum →
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('contact')}
                  className="btn-secondary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Icon name="phone" size={16} /> Hubungi Asisten Lab
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('home')}
                  className="text-xs text-[#24456F] hover:text-[#00142F] font-semibold transition-colors mt-2 cursor-pointer"
                >
                  ← Kembali ke Beranda
                </button>
              </div>
            </div>
          </div>
        )
      case 'dashboard-student':
        if (!user) {
          return <LoginPage setCurrentPage={setCurrentPage} onLogin={handleLogin} />
        }
        if (!user.isEnrolledPraktikan && user.role !== 'asisten') {
          // Mahasiswa ITPLN yang tidak terdaftar sebagai praktikan aktif
          return (
            <div className="min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#F4F8FC' }}>
              <div className="absolute inset-0 dots-bg opacity-30 pointer-events-none" />
              <div
                className="relative z-10 max-w-lg w-full rounded-3xl p-8 sm:p-10 bg-white text-center"
                style={{ border: '2px solid #FED7AA', boxShadow: '0 20px 50px rgba(0, 20, 47, 0.08)' }}
              >
                <h2 className="text-2xl font-extrabold text-[#00142F] mb-3 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  Akun Belum Terdaftar
                </h2>
                <p className="text-base text-[#24456F] mb-8 leading-relaxed">
                  Akun Anda belum terdaftar sebagai praktikan. Silakan hubungi asisten lab untuk didaftarkan terlebih dahulu.
                </p>
                <div className="flex flex-col gap-3">
                  <button type="button" onClick={() => setCurrentPage('module')} className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md">
                    <Icon name="book-open" size={16} /> Lihat Modul Praktikum
                  </button>
                  <button type="button" onClick={() => setCurrentPage('contact')} className="btn-secondary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer">
                    <Icon name="phone" size={16} /> Hubungi Asisten Lab
                  </button>
                  <button type="button" onClick={() => setCurrentPage('home')} className="text-xs text-[#24456F] hover:text-[#00142F] font-semibold transition-colors mt-2 cursor-pointer">
                    ← Kembali ke Beranda
                  </button>
                </div>
              </div>
            </div>
          )
        }
        return <DashboardStudent user={user} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
      case 'dashboard-assistant':
        return user ? (
          <DashboardAssistant user={user} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
        ) : (
          <LoginPage setCurrentPage={setCurrentPage} onLogin={handleLogin} />
        )
      default:
        return <HomePage setCurrentPage={setCurrentPage} />
    }
  }

  const isChromelessPage = NO_FOOTER_PAGES.includes(currentPage)

  if (checkingSession) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4"
        style={{ background: '#537AB8' }}
      >
        <div className="flex flex-col items-center gap-3.5">
          <div className="w-11 h-11 border-3 border-blue-400/30 border-t-blue-400 rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
          <p style={{ color: '#C6DBF2', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
            Memuat ICAL...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isChromelessPage && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          user={user}
          onLogout={handleLogout}
        />
      )}

      <main style={{ flex: 1, paddingTop: 0 }}>
        {renderPage()}
      </main>

      {!isChromelessPage && <Footer setCurrentPage={setCurrentPage} />}
    </div>
  )
}
