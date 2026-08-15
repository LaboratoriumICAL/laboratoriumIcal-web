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
import LoginPage from './views/LoginPage'
import RegisterPage from './views/RegisterPage'
import RegisterAsistenPage from './views/RegisterAsistenPage'
import ForgotPasswordPage from './views/ForgotPasswordPage'
import ResetPasswordPage from './views/ResetPasswordPage'
import DashboardStudent from './views/DashboardStudent'
import DashboardAssistant from './views/DashboardAssistant'
import { getSupabaseBrowser } from './lib/supabaseClient'

interface User {
  role: string
  name: string
  nim?: string
  id?: string
}

const NO_FOOTER_PAGES = [
  'login',
  'register',
  'register-asisten',
  'forgot-password',
  'reset-password',
  'dashboard-student',
  'dashboard-assistant',
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
    }
    return 'home'
  })
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  // Cek sesi login Supabase Auth yang sudah ada (mis. setelah refresh halaman)
  useEffect(() => {
    let cancelled = false
    let authSubscription: { unsubscribe: () => void } | null = null

    // Safety timeout: jangan biarkan user tertahan di state 'Memuat...' lebih dari 1.5 detik jika network lambat/error
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setCheckingSession(false)
    }, 1500)

    try {
      const sb = getSupabaseBrowser()

      // Deteksi event auth realtime, khususnya event PASSWORD_RECOVERY dari Supabase
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
            setCurrentPage('home')
            setCheckingSession(false)
          }
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

            const { data: profileRaw, error: profileError } = await sb
              .from('profiles')
              .select('role, nama_lengkap, nim')
              .eq('id', session.user.id)
              .maybeSingle()

            if (profileError) {
              console.warn('Gagal memuat profil pengguna:', profileError.message)
            }

            const profile = profileRaw as { role: string; nama_lengkap: string; nim: string | null } | null
            if (!cancelled && profile) {
              setUser({
                role: profile.role as string,
                name: profile.nama_lengkap as string,
                nim: (profile.nim as string) || undefined,
                id: session.user.id,
              })
              setCurrentPage(profile.role === 'asisten' ? 'dashboard-assistant' : 'dashboard-student')
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

  const handleLogin = (newUser: User) => setUser(newUser)
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
        return <ModulePage />
      case 'software':
        return <SoftwarePage />
      case 'template':
        return <TemplatePage />
      case 'contact':
        return <ContactPage />
      case 'login':
        return <LoginPage setCurrentPage={setCurrentPage} onLogin={handleLogin} />
      case 'register':
        return <RegisterPage setCurrentPage={setCurrentPage} />
      case 'register-asisten':
        return <RegisterAsistenPage setCurrentPage={setCurrentPage} />
      case 'forgot-password':
        return <ForgotPasswordPage setCurrentPage={setCurrentPage} />
      case 'reset-password':
        return <ResetPasswordPage setCurrentPage={setCurrentPage} />
      case 'dashboard-student':
        return user ? (
          <DashboardStudent user={user} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
        ) : (
          <LoginPage setCurrentPage={setCurrentPage} onLogin={handleLogin} />
        )
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
        style={{ background: 'linear-gradient(135deg, #f0fbfb, #e0f7fa, #ccf0f2)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-200 border-t-teal-700 rounded-full animate-spin" />
          <p style={{ color: '#015c61', fontSize: '0.9rem', fontWeight: 500, fontFamily: 'var(--font-heading)' }}>
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
