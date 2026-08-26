import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { Icon } from '../components/Icon'

interface DashboardStudentProps {
  user: { role: string; name: string; nim?: string }
  setCurrentPage: (page: string) => void
  onLogout: () => void
}

interface MeetingItem {
  id: string
  label: string
  date: string
  tanggalRaw?: string | null
  jenis: string
  urutan_ke?: number
}

interface StudentGroupInfo {
  anggotaId: string
  nama: string
  nim: string
  kelompokId: string
  namaKelompok: string
  shift: string
  asisten: string
  namaKelas: string
  hari: string
  jamMulai: string
  jamSelesai: string
  ruangan: string
  praktikumKode: string
  praktikumNama: string
  jurusanNama: string
  jurusanKode: string
  meetings: MeetingItem[]
}

// Data default / fallback
const DEFAULT_STUDENT_INFO: StudentGroupInfo = {
  anggotaId: 'mock-1',
  nama: 'Siti Nur Aziza Latuconsina',
  nim: '202411087',
  kelompokId: 'mock-kel-1',
  namaKelompok: 'TE A5',
  shift: 'Shift 1',
  asisten: 'Putri Sahira',
  namaKelas: 'A',
  hari: 'Rabu',
  jamMulai: '08.00',
  jamSelesai: '10.00',
  ruangan: 'Laboratorium ICAL',
  praktikumKode: 'PLC',
  praktikumNama: 'Programmable Logic Controller',
  jurusanNama: 'Teknik Elektro',
  jurusanKode: 'SITE',
  meetings: [
    { id: 'm-0', label: 'Pengarahan', date: 'Rabu, 4 Mar 2026', jenis: 'pengarahan', urutan_ke: 0 },
    { id: 'm-1', label: 'Pertemuan 1', date: 'Rabu, 1 Apr 2026', jenis: 'pertemuan', urutan_ke: 1 },
    { id: 'm-2', label: 'Pertemuan 2', date: 'Rabu, 8 Apr 2026', jenis: 'pertemuan', urutan_ke: 2 },
    { id: 'm-3', label: 'Pertemuan 3', date: 'Rabu, 15 Apr 2026', jenis: 'pertemuan', urutan_ke: 3 },
    { id: 'm-4', label: 'Pertemuan 4', date: 'Rabu, 22 Apr 2026', jenis: 'pertemuan', urutan_ke: 4 },
    { id: 'm-5', label: 'UAP', date: 'Rabu, 29 Apr 2026', jenis: 'uap', urutan_ke: 5 },
  ],
}

// Logo Hexagonal 3D Isometric ICAL
function IcalLogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M24 4L42 14.5V33.5L24 44L6 33.5V14.5L24 4Z"
        stroke="#D6E4F0"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 4V24M42 14.5L24 24M6 14.5L24 24M24 24V44"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 24L33 19V29L24 34L15 29V19L24 24Z"
        stroke="#0284C7"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="rgba(2, 96, 212, 0.15)"
      />
    </svg>
  )
}

// Molecular network pattern SVG
function MolecularPattern({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none ${className}`}
    >
      <g stroke="#D6E4F0" strokeWidth="1.2" opacity="0.45">
        <line x1="40" y1="50" x2="110" y2="30" />
        <line x1="110" y1="30" x2="170" y2="70" />
        <line x1="170" y1="70" x2="150" y2="140" />
        <line x1="150" y1="140" x2="90" y2="160" />
        <line x1="90" y1="160" x2="40" y2="120" />
        <line x1="40" y1="120" x2="40" y2="50" />
        
        <line x1="170" y1="70" x2="230" y2="50" />
        <line x1="230" y1="50" x2="270" y2="100" />
        <line x1="270" y1="100" x2="230" y2="150" />
        <line x1="230" y1="150" x2="150" y2="140" />

        <line x1="90" y1="160" x2="70" y2="220" />
        <line x1="150" y1="140" x2="180" y2="210" />
        <line x1="70" y1="220" x2="180" y2="210" />
      </g>
      {[
        [40, 50], [110, 30], [170, 70], [150, 140], [90, 160], [40, 120],
        [230, 50], [270, 100], [230, 150], [70, 220], [180, 210]
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.5" fill="#0284C7" opacity="0.7" />
      ))}
    </svg>
  )
}

// Background Wave Gradien Khusus Banner (Ultra Deep Navy High-Tech)
function BannerWavesBackground() {
  return (
    <svg
      viewBox="0 0 1000 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="deepNavyBannerBgStudent" x1="0" y1="0" x2="1000" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#000B1A" />
          <stop offset="0.45" stopColor="#00183F" />
          <stop offset="1" stopColor="#002B66" />
        </linearGradient>
        <radialGradient id="bannerGlowCyanStudent" cx="860" cy="75" r="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" stopOpacity="0.25" />
          <stop offset="0.65" stopColor="#0284C7" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000B1A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bannerGlowBlueStudent" cx="140" cy="45" r="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0260D4" stopOpacity="0.22" />
          <stop offset="1" stopColor="#000B1A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Deep Navy Base & Ambient Lighting */}
      <rect width="1000" height="160" fill="url(#deepNavyBannerBgStudent)" />
      <rect width="1000" height="160" fill="url(#bannerGlowCyanStudent)" />
      <rect width="1000" height="160" fill="url(#bannerGlowBlueStudent)" />

      {/* High-Tech Dot Matrix Pattern */}
      <g opacity="0.16">
        {Array.from({ length: 15 }).map((_, r) =>
          Array.from({ length: 5 }).map((_, c) => (
            <circle key={`dot-${r}-${c}`} cx={380 + r * 30} cy={18 + c * 26} r="1.2" fill="#BAE6FD" />
          ))
        )}
      </g>

      {/* Wave 1: Flowing Sky Blue Ambient Ribbon */}
      <path
        d="M0 160C140 120 280 148 450 115C620 80 780 138 1000 90V160H0Z"
        fill="rgba(56, 189, 248, 0.08)"
      />

      {/* Wave 2: Luminous Deep Royal Blue Curve */}
      <path
        d="M0 160C160 135 340 158 520 128C700 98 860 142 1000 115V160H0Z"
        fill="rgba(2, 96, 212, 0.16)"
      />

      {/* High-Tech Circuit & Molecular Constellation in Center-Right */}
      <g stroke="#38BDF8" strokeWidth="1.2" opacity="0.4">
        <line x1="580" y1="40" x2="630" y2="25" />
        <line x1="630" y1="25" x2="670" y2="55" />
        <line x1="670" y1="55" x2="655" y2="100" />
        <line x1="655" y1="100" x2="610" y2="115" />
        <line x1="610" y1="115" x2="580" y2="85" />
        <line x1="580" y1="85" x2="580" y2="40" />

        <line x1="670" y1="55" x2="715" y2="40" />
        <line x1="715" y1="40" x2="745" y2="75" />
        <line x1="745" y1="75" x2="715" y2="110" />
        <line x1="715" y1="110" x2="655" y2="100" />

        <circle cx="580" cy="40" r="3" fill="#38BDF8" />
        <circle cx="630" cy="25" r="3" fill="#38BDF8" />
        <circle cx="670" cy="55" r="3" fill="#38BDF8" />
        <circle cx="655" cy="100" r="3" fill="#38BDF8" />
        <circle cx="610" cy="115" r="3" fill="#38BDF8" />
        <circle cx="580" cy="85" r="3" fill="#38BDF8" />
        <circle cx="715" cy="40" r="3" fill="#38BDF8" />
        <circle cx="745" cy="75" r="3" fill="#38BDF8" />
        <circle cx="715" cy="110" r="3" fill="#38BDF8" />
      </g>
    </svg>
  )
}

function BarChartCircleBadge() {
  return (
    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
        <rect x="4" y="20" width="4.5" height="12" rx="2" fill="#38BDF8" />
        <rect x="11.5" y="10" width="4.5" height="22" rx="2" fill="#0284C7" />
        <rect x="19" y="16" width="4.5" height="16" rx="2" fill="#0284C7" />
        <rect x="26.5" y="22" width="4.5" height="10" rx="2" fill="#D6E4F0" />
        <circle cx="28.75" cy="14" r="2" fill="#0284C7" />
      </svg>
    </div>
  )
}

function CalendarCircleBadge() {
  return (
    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        <rect x="4" y="8" width="28" height="24" rx="6" fill="#ffffff" stroke="#FFFFFF" strokeWidth="2.2" />
        <path d="M4 14H32" stroke="#FFFFFF" strokeWidth="2.2" />
        <line x1="10" y1="5" x2="10" y2="10" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="26" y1="5" x2="26" y2="10" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="11" cy="20" r="1.5" fill="#D6E4F0" />
        <circle cx="18" cy="20" r="1.5" fill="#D6E4F0" />
        <circle cx="25" cy="20" r="1.5" fill="#D6E4F0" />
        <circle cx="11" cy="26" r="1.5" fill="#D6E4F0" />
        <circle cx="18" cy="26" r="1.5" fill="#38BDF8" />
      </svg>
    </div>
  )
}

function NilaiBannerIllustration({ className = 'w-36 h-36' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="clipShadow" x="-10" y="-5" width="180" height="170" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#00142F" floodOpacity="0.18" />
        </filter>
        <linearGradient id="boardGrad" x1="28" y1="24" x2="132" y2="148" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#F0F7FF" />
        </linearGradient>
        <linearGradient id="clipMetal" x1="56" y1="16" x2="104" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D6E4F0" />
          <stop offset="1" stopColor="#002466" />
        </linearGradient>
        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#D6E4F0" />
          <stop offset="1" stopColor="#002466" />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#DBEAFE" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="pie1" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#D6E4F0" />
          <stop offset="1" stopColor="#002466" />
        </linearGradient>
        <linearGradient id="pie2" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#DBEAFE" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      <g transform="rotate(-3 80 80)">
        <rect
          x="28"
          y="24"
          width="104"
          height="124"
          rx="18"
          fill="url(#boardGrad)"
          stroke="#D6E4F0"
          strokeWidth="2.5"
          filter="url(#clipShadow)"
        />

        <rect
          x="36"
          y="34"
          width="88"
          height="106"
          rx="10"
          fill="#ffffff"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />

        <rect x="44" y="66" width="6.5" height="18" rx="2" fill="url(#barGrad1)" />
        <rect x="53.5" y="52" width="6.5" height="32" rx="2" fill="url(#barGrad2)" />
        <rect x="63" y="60" width="6.5" height="24" rx="2" fill="url(#barGrad1)" />

        <rect x="78" y="54" width="34" height="4" rx="2" fill="#D6E4F0" />
        <rect x="78" y="63" width="30" height="4" rx="2" fill="#D6E4F0" />
        <rect x="78" y="72" width="24" height="4" rx="2" fill="#D6E4F0" />

        <rect x="44" y="98" width="32" height="4" rx="2" fill="#D6E4F0" />
        <rect x="44" y="106" width="26" height="4" rx="2" fill="#D6E4F0" />
        <rect x="44" y="114" width="30" height="4" rx="2" fill="#D6E4F0" />

        <g transform="translate(96, 108)">
          <path d="M0 0 L15 0 A15 15 0 0 1 0 15 Z" fill="url(#pie1)" />
          <path d="M0 0 L0 15 A15 15 0 1 1 0 -15 Z" fill="url(#pie2)" />
          <path d="M0 0 L0 -15 A15 15 0 0 1 15 0 Z" fill="#38BDF8" />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>

        <rect x="56" y="16" width="48" height="18" rx="7" fill="url(#clipMetal)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="80" cy="23" r="3.5" fill="#ffffff" opacity="0.85" />
      </g>
    </svg>
  )
}

function CalendarBannerIllustration({ className = 'w-36 h-36' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="calShadow" x="-10" y="-5" width="180" height="170" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#00142F" floodOpacity="0.18" />
        </filter>
        <linearGradient id="calHeader" x1="28" y1="26" x2="132" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00142F" />
          <stop offset="1" stopColor="#002466" />
        </linearGradient>
        <linearGradient id="clockRing" x1="85" y1="85" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#002466" />
          <stop offset="1" stopColor="#D6E4F0" />
        </linearGradient>
      </defs>

      <g transform="rotate(2 80 80)">
        <rect
          x="28"
          y="26"
          width="104"
          height="106"
          rx="18"
          fill="#ffffff"
          stroke="#D6E4F0"
          strokeWidth="2.5"
          filter="url(#calShadow)"
        />

        <path
          d="M28 44C28 34.0589 36.0589 26 46 26H114C123.941 26 132 34.0589 132 44V56H28V44Z"
          fill="url(#calHeader)"
        />

        {[48, 80, 112].map((cx, i) => (
          <g key={i}>
            <rect x={cx - 3.5} y="18" width="7" height="16" rx="3.5" fill="#38BDF8" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={cx} cy="26" r="2" fill="#ffffff" />
          </g>
        ))}

        <g opacity="0.85">
          <rect x="40" y="66" width="14" height="10" rx="3" fill="#EEF6FE" />
          <rect x="60" y="66" width="14" height="10" rx="3" fill="#EEF6FE" />
          <rect x="80" y="66" width="14" height="10" rx="3" fill="#0284C7" />
          <rect x="100" y="66" width="14" height="10" rx="3" fill="#EEF6FE" />

          <rect x="40" y="82" width="14" height="10" rx="3" fill="#EEF6FE" />
          <rect x="60" y="82" width="14" height="10" rx="3" fill="#0B192C" />
          <rect x="80" y="82" width="14" height="10" rx="3" fill="#EEF6FE" />
          <rect x="100" y="82" width="14" height="10" rx="3" fill="#EEF6FE" />

          <rect x="40" y="98" width="14" height="10" rx="3" fill="#EEF6FE" />
          <rect x="60" y="98" width="14" height="10" rx="3" fill="#EEF6FE" />
          <rect x="80" y="98" width="14" height="10" rx="3" fill="#EEF6FE" />
        </g>

        <g transform="translate(112, 112)" filter="url(#calShadow)">
          <circle cx="0" cy="0" r="22" fill="url(#clockRing)" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="16" fill="#F4F8FD" />
          <line x1="0" y1="-12" x2="0" y2="-9" stroke="#0B192C" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="0" x2="9" y2="0" stroke="#0B192C" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="12" x2="0" y2="9" stroke="#0B192C" strokeWidth="2" strokeLinecap="round" />
          <line x1="-12" y1="0" x2="-9" y2="0" stroke="#0B192C" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="0" x2="0" y2="-7" stroke="#0B192C" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="5" y2="4" stroke="#0B192C" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="0" cy="0" r="2.5" fill="#0B192C" />
        </g>
      </g>
    </svg>
  )
}

export default function DashboardStudent({ user, setCurrentPage, onLogout }: DashboardStudentProps) {
  const [activeSection, setActiveSection] = useState<'home' | 'schedule' | 'grades' | 'qr'>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const [collapsed, setCollapsed] = useState<{ [key: string]: boolean }>({
    ta: false,
    tr: false,
    p: false,
  })

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const [studentInfo, setStudentInfo] = useState<StudentGroupInfo | null>(null)
  const [allPraktikum, setAllPraktikum] = useState<StudentGroupInfo[]>([])
  const [loadingInfo, setLoadingInfo] = useState(false)

  const effectiveName = user.name || DEFAULT_STUDENT_INFO.nama
  const effectiveNim = user.nim || DEFAULT_STUDENT_INFO.nim

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  useEffect(() => {
    if (!user.nim) {
      setStudentInfo(DEFAULT_STUDENT_INFO)
      return
    }
    setLoadingInfo(true)
    fetch(`/api/student/info?nim=${encodeURIComponent(user.nim)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.registered && json.primaryInfo) {
          setStudentInfo(json.primaryInfo)
          setAllPraktikum(json.praktikumList || [])
        } else {
          setStudentInfo(DEFAULT_STUDENT_INFO)
        }
      })
      .catch(() => {
        setStudentInfo(DEFAULT_STUDENT_INFO)
      })
      .finally(() => setLoadingInfo(false))
  }, [user.nim])

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number | null>(null)
  const [qrError, setQrError] = useState(false)

  useEffect(() => {
    const nimVal = user.nim || DEFAULT_STUDENT_INFO.nim
    let cancelled = false
    let countdownTimer: ReturnType<typeof setInterval> | null = null
    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleRefresh = (delayMs: number) => {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(refresh, delayMs)
    }

    async function refresh() {
      try {
        const res = await fetch(`/api/absensi/qr-token?nim=${encodeURIComponent(nimVal)}`)
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.payload) throw new Error(json.error || 'Gagal membuat QR')

        const dataUrl = await QRCode.toDataURL(json.payload, {
          width: 320,
          margin: 1,
          color: { dark: '#1B2A4A', light: '#ffffff' },
        })
        if (cancelled) return

        setQrDataUrl(dataUrl)
        setQrError(false)

        const expMs = json.exp * 1000
        if (countdownTimer) clearInterval(countdownTimer)
        setQrSecondsLeft(Math.max(0, Math.round((expMs - Date.now()) / 1000)))
        countdownTimer = setInterval(() => {
          setQrSecondsLeft(Math.max(0, Math.round((expMs - Date.now()) / 1000)))
        }, 1000)

        scheduleRefresh(Math.max(1000, expMs - Date.now() - 5000))
      } catch {
        if (!cancelled) {
          setQrError(true)
          scheduleRefresh(5000)
        }
      }
    }

    refresh()
    return () => {
      cancelled = true
      if (countdownTimer) clearInterval(countdownTimer)
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [user.nim])

  const [nilaiPertemuan, setNilaiPertemuan] = useState<{ id: string; urutan_ke: number | null; jenis: string; label: string }[]>([])
  const [nilaiRows, setNilaiRows] = useState<{ pertemuan_id: string; kode_komponen: string; nilai: number | null }[]>([])
  const [nilaiLoading, setNilaiLoading] = useState(false)

  useEffect(() => {
    if (activeSection !== 'grades' || !user.nim) return
    setNilaiLoading(true)
    fetch(`/api/nilai/mine?nim=${encodeURIComponent(user.nim)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) {
          setNilaiPertemuan(json.pertemuan || [])
          setNilaiRows(json.nilai || [])
        }
      })
      .catch(() => {})
      .finally(() => setNilaiLoading(false))
  }, [activeSection, user.nim])

  const sidebarLinks = [
    { id: 'home', label: 'Beranda', icon: 'home' },
    { id: 'schedule', label: 'Jadwal', icon: 'calendar' },
    { id: 'grades', label: 'Nilai Saya', icon: 'bar-chart' },
    { id: 'qr', label: 'QR Absensi', icon: 'qr-code' },
  ] as const

  const displayMeetings =
    studentInfo && studentInfo.meetings && studentInfo.meetings.length > 0
      ? studentInfo.meetings
      : DEFAULT_STUDENT_INFO.meetings

  const currentPraktikumKode = studentInfo?.praktikumKode || DEFAULT_STUDENT_INFO.praktikumKode
  const currentNamaKelompok = studentInfo?.namaKelompok || DEFAULT_STUDENT_INFO.namaKelompok
  const currentShift = studentInfo?.shift || DEFAULT_STUDENT_INFO.shift
  const currentAsisten = studentInfo?.asisten || DEFAULT_STUDENT_INFO.asisten
  const currentHari = studentInfo?.hari || DEFAULT_STUDENT_INFO.hari
  const currentJamMulai = studentInfo?.jamMulai || DEFAULT_STUDENT_INFO.jamMulai
  const currentJamSelesai = studentInfo?.jamSelesai || DEFAULT_STUDENT_INFO.jamSelesai
  const currentRuangan = studentInfo?.ruangan || DEFAULT_STUDENT_INFO.ruangan
  const currentNamaKelas = studentInfo?.namaKelas || DEFAULT_STUDENT_INFO.namaKelas
  const currentJurusanKode = studentInfo?.jurusanKode || DEFAULT_STUDENT_INFO.jurusanKode

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#F4F8FC', color: '#00142F' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===================== SIDEBAR ===================== */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-[#D6E4F0] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo, User Info & Nav Links */}
        <div className="pt-7 px-6 relative z-10">
          {/* Logo ICAL Text */}
          <div className="mb-6">
            <h1
              className="text-2xl sm:text-[1.75rem] font-extrabold text-[#00142F] tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              ICAL
            </h1>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-3.5 mb-7">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-xs"
              style={{ background: '#002466' }}
            >
              {getInitials(effectiveName)}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="font-bold text-[#00142F] text-sm leading-snug truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
                title={effectiveName}
              >
                {effectiveName}
              </div>
              <div className="text-[11px] text-[#002466] font-medium truncate mt-0.5">
                Praktikan • Kelompok {currentNamaKelompok}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {sidebarLinks.map((link) => {
              const isActive = activeSection === link.id
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveSection(link.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                    isActive
                      ? 'text-white'
                      : 'text-[#002466] hover:bg-[#F0F7FF] hover:text-[#002466]'
                  }`}
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)',
                          boxShadow: '0 6px 18px rgba(0, 11, 26, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }
                      : {}
                  }
                >
                  <Icon
                    name={link.icon}
                    size={20}
                    color={isActive ? '#ffffff' : '#002466'}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span style={{ fontFamily: 'var(--font-heading)' }}>{link.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Sidebar with Fluid Wave Graphic & Logout */}
        <div className="relative pt-32 pb-6 px-6 overflow-hidden mt-auto">
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
            <svg
              viewBox="0 0 288 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-cover"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="sidebarWaveCyan" x1="0" y1="0" x2="288" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D6E4F0" />
                  <stop offset="1" stopColor="#0284C7" />
                </linearGradient>
                <linearGradient id="sidebarWaveDark" x1="0" y1="50" x2="288" y2="320" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#002466" />
                  <stop offset="0.5" stopColor="#001C4A" />
                  <stop offset="1" stopColor="#00142F" />
                </linearGradient>
              </defs>

              <path
                d="M0 120C70 160 190 50 288 110V320H0V120Z"
                fill="#BAD6EB"
                opacity="0.85"
              />

              <path
                d="M0 150C80 190 180 90 288 140V320H0V150Z"
                fill="#162D4E"
              />

              <g stroke="#D6E4F0" strokeWidth="1.2" opacity="0.45">
                <line x1="210" y1="50" x2="250" y2="30" />
                <line x1="250" y1="30" x2="280" y2="55" />
                <line x1="280" y1="55" x2="270" y2="95" />
                <line x1="270" y1="95" x2="230" y2="110" />
                <line x1="230" y1="110" x2="200" y2="85" />
                <line x1="200" y1="85" x2="210" y2="50" />

                <line x1="200" y1="85" x2="155" y2="95" />
                <line x1="155" y1="95" x2="125" y2="130" />
                <line x1="125" y1="130" x2="140" y2="170" />
                <line x1="140" y1="170" x2="185" y2="160" />
                <line x1="185" y1="160" x2="200" y2="85" />

                <line x1="140" y1="170" x2="100" y2="190" />
                <line x1="100" y1="190" x2="80" y2="235" />
                <line x1="185" y1="160" x2="225" y2="190" />
                <line x1="225" y1="190" x2="215" y2="240" />
                <line x1="215" y1="240" x2="255" y2="260" />
              </g>

              {[
                [210, 50], [250, 30], [280, 55], [270, 95], [230, 110], [200, 85],
                [155, 95], [125, 130], [140, 170], [185, 160],
                [100, 190], [80, 235], [225, 190], [215, 240], [255, 260]
              ].map(([cx, cy], idx) => (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill={cy > 150 ? '#ffffff' : '#D6E4F0'}
                  opacity={cy > 150 ? 0.6 : 0.75}
                />
              ))}
            </svg>
          </div>

          <div className="relative z-10">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-white/95 border border-white/30 bg-white/5 backdrop-blur-xs hover:bg-white/15 transition-all duration-200 cursor-pointer"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Icon name="logout" size={19} color="#ffffff" strokeWidth={2} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT ===================== */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#D6E4F0] px-6 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#002466] hover:bg-[#F0F7FF] cursor-pointer"
            >
              <Icon name="menu" size={22} />
            </button>
            <h1
              className="text-lg sm:text-xl font-bold text-[#00142F]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Dashboard Praktikan
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-white border border-[#D6E4F0] rounded-2xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-semibold text-[#00142F]" style={{ fontFamily: 'var(--font-heading)' }}>
                  {effectiveName}
                </span>
                <Icon name="chevron-down" size={15} color="#64748b" strokeWidth={2} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#D6E4F0] py-2 z-50 animate-fadeInUp">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-[#00142F] truncate">{effectiveName}</div>
                    <div className="text-[0.7rem] text-slate-500">NIM: {effectiveNim}</div>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      setActiveSection('qr')
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-[#F0F7FF] flex items-center gap-2 cursor-pointer"
                  >
                    <Icon name="qr-code" size={14} color="#002466" /> QR Absensi Saya
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Icon name="logout" size={14} color="#dc2626" /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Body Area */}
        <main className="p-4 sm:p-7 flex-1 relative overflow-hidden">
          <div className="fixed bottom-0 right-0 w-[550px] h-[350px] pointer-events-none z-0 opacity-40">
            <svg viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M100 300C250 220 380 270 500 180V300H100Z"
                fill="#BAD6EB"
              />
              <defs>
                <linearGradient id="bottomDecorWave" x1="100" y1="200" x2="500" y2="300" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D6E4F0" stopOpacity="0.4" />
                  <stop offset="1" stopColor="#0284C7" stopOpacity="0.15" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="max-w-6xl mx-auto space-y-6 relative z-10">
            {/* TAB 1: BERANDA */}
            {activeSection === 'home' && (
              <>
                {/* Hero Banner */}
                <div
                  className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                  style={{
                    background: 'linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)', boxShadow: '0 16px 36px -10px rgba(0,11,26,0.5)', border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <div className="relative z-10 max-w-xl">
                    <h2
                      className="text-white font-bold text-xl sm:text-2xl lg:text-[1.65rem] tracking-tight"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Halo, {effectiveName}!
                    </h2>
                    <p className="text-[#D6E4F0] text-xs sm:text-sm mt-2 font-normal leading-relaxed">
                      Selamat datang praktikan ICAL, Semester Ganjil 2026/2027
                    </p>
                  </div>

                  <div className="absolute -bottom-10 right-8 opacity-25 pointer-events-none">
                    <MolecularPattern className="w-80 h-64" />
                  </div>
                </div>

                {/* Info Kelompokku Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D6E4F0] shadow-xs relative">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <Icon name="users" size={20} color="#002466" strokeWidth={2} />
                      <h3
                        className="font-bold text-[#00142F] text-base sm:text-lg"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Info Kelompokku
                      </h3>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 opacity-20 pointer-events-none">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                      ))}
                    </div>
                  </div>

                  {/* 4 Metric Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
                    {/* 1. Kelompok */}
                    <div className="group relative overflow-hidden bg-[#F4F8FC] hover:bg-[#0260D4] hover: hover: active:bg-[#0260D4] active: active: border border-[#D6E4F0] hover:border-[#D6E4F0] active:border-[#D6E4F0] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1.5 active:scale-95 hover:shadow-[0_12px_24px_-6px_rgba(2, 96, 212, 0.25)] active:shadow-md cursor-pointer select-none touch-manipulation">
                      <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/20 group-active:bg-white/20 flex items-center justify-center text-[#002466] group-hover:text-white group-active:text-white shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-110 group-active:scale-110">
                        <Icon name="users" size={20} color="currentColor" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#00142F] group-hover:text-white group-active:text-white text-base sm:text-lg leading-tight transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {currentNamaKelompok}
                        </div>
                        <div className="text-xs text-[#64748B] group-hover:text-[#D6E4F0] group-active:text-[#D6E4F0] mt-0.5 font-medium transition-colors duration-300">Kelompok</div>
                      </div>
                    </div>

                    {/* 2. Shift */}
                    <div className="group relative overflow-hidden bg-[#F4F8FC] hover:bg-[#0260D4] hover: hover: active:bg-[#0260D4] active: active: border border-[#D6E4F0] hover:border-[#D6E4F0] active:border-[#D6E4F0] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1.5 active:scale-95 hover:shadow-[0_12px_24px_-6px_rgba(2, 96, 212, 0.25)] active:shadow-md cursor-pointer select-none touch-manipulation">
                      <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/20 group-active:bg-white/20 flex items-center justify-center text-[#002466] group-hover:text-white group-active:text-white shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-110 group-active:scale-110">
                        <Icon name="building" size={20} color="currentColor" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#00142F] group-hover:text-white group-active:text-white text-base sm:text-lg leading-tight transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {currentShift}
                        </div>
                        <div className="text-xs text-[#64748B] group-hover:text-[#D6E4F0] group-active:text-[#D6E4F0] mt-0.5 font-medium transition-colors duration-300">Shift</div>
                      </div>
                    </div>

                    {/* 3. Asisten */}
                    <div className="group relative overflow-hidden bg-[#F4F8FC] hover:bg-[#0260D4] hover: hover: hover: active:bg-[#0260D4] active: active: active: border border-[#D6E4F0] hover:border-[#D6E4F0] active:border-[#D6E4F0] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 transition-all duration-400 hover:-translate-y-2 hover:scale-[1.02] active:scale-95 hover:shadow-[0_16px_30px_-6px_rgba(92, 139, 200,0.45)] active:shadow-lg cursor-pointer select-none touch-manipulation">
                      <div className="absolute inset-0 bg-[#0260D4] from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full group-active:translate-x-full transition-transform duration-700 pointer-events-none" />

                      <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/20 group-active:bg-white/20 group-hover:ring-2 group-hover:ring-white/40 group-active:ring-2 group-active:ring-white/40 flex items-center justify-center text-[#002466] group-hover:text-white group-active:text-white shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-115 group-active:scale-115 group-hover:rotate-3">
                        <Icon name="user" size={20} color="currentColor" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <div
                          className="font-bold text-[#00142F] group-hover:text-white group-active:text-white text-base sm:text-lg leading-tight truncate max-w-[130px] transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-heading)' }}
                          title={currentAsisten}
                        >
                          {currentAsisten}
                        </div>
                        <div className="text-xs text-[#64748B] group-hover:text-[#D6E4F0] group-active:text-[#D6E4F0] mt-0.5 font-medium transition-colors duration-300 flex items-center gap-1">
                          <span>Asisten</span>
                          <span className="opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 text-[10px] text-amber-200">✨</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Praktikum */}
                    <div className="group relative overflow-hidden bg-[#F4F8FC] hover:bg-[#0260D4] hover: hover: active:bg-[#0260D4] active: active: border border-[#D6E4F0] hover:border-[#D6E4F0] active:border-[#D6E4F0] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1.5 active:scale-95 hover:shadow-[0_12px_24px_-6px_rgba(2, 96, 212, 0.25)] active:shadow-md cursor-pointer select-none touch-manipulation">
                      <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/20 group-active:bg-white/20 flex items-center justify-center text-[#002466] group-hover:text-white group-active:text-white shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-110 group-active:scale-110">
                        <Icon name="flask" size={20} color="currentColor" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#00142F] group-hover:text-white group-active:text-white text-base sm:text-lg leading-tight transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {currentPraktikumKode}
                        </div>
                        <div className="text-xs text-[#64748B] group-hover:text-[#D6E4F0] group-active:text-[#D6E4F0] mt-0.5 font-medium transition-colors duration-300">Praktikum</div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Metadata */}
                  <div className="mt-5 pt-4 border-t border-[#D6E4F0] flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-[#002466]">
                    <span className="flex items-center gap-2 font-medium text-[#002466]">
                      <Icon name="clock" size={16} color="#002466" strokeWidth={1.8} />
                      {currentHari}, {currentJamMulai} - {currentJamSelesai} WIB
                    </span>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <span className="flex items-center gap-2 text-[#002466] font-medium">
                      <Icon name="map-pin" size={16} color="#0284C7" strokeWidth={1.8} />
                      {currentRuangan}
                    </span>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <span className="flex items-center gap-2 text-[#002466] font-medium">
                      <Icon name="users" size={16} color="#0284C7" strokeWidth={1.8} />
                      Kelas {currentNamaKelas} ({currentJurusanKode})
                    </span>
                  </div>
                </div>

                {/* 3 Quick Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                  {/* Card 1 */}
                  <div
                    onClick={() => setActiveSection('schedule')}
                    className="bg-white rounded-3xl p-5 border border-[#D6E4F0] shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#F0F7FF] border border-[#D6E4F0] flex items-center justify-center text-[#002466]">
                        <Icon name="calendar" size={22} color="#002466" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#00142F] text-sm sm:text-base leading-tight"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          Lihat Jadwal
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Cek jadwal praktikum</div>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#002466] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-xs shrink-0">
                      <Icon name="arrow-right" size={16} color="#ffffff" strokeWidth={2.2} />
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div
                    onClick={() => setActiveSection('grades')}
                    className="bg-white rounded-3xl p-5 border border-[#D6E4F0] shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#F0F7FF] border border-[#D6E4F0] flex items-center justify-center text-[#002466]">
                        <Icon name="bar-chart" size={22} color="#002466" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#00142F] text-sm sm:text-base leading-tight"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          Nilai Saya
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Lihat nilai praktikum</div>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#002466] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-xs shrink-0">
                      <Icon name="arrow-right" size={16} color="#ffffff" strokeWidth={2.2} />
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div
                    onClick={() => setActiveSection('qr')}
                    className="bg-white rounded-3xl p-5 border border-[#D6E4F0] shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#F0F7FF] border border-[#D6E4F0] flex items-center justify-center text-[#002466]">
                        <Icon name="smartphone" size={22} color="#002466" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#00142F] text-sm sm:text-base leading-tight"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          QR Absensi
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Scan untuk absensi</div>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#002466] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-xs shrink-0">
                      <Icon name="arrow-right" size={16} color="#ffffff" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: JADWAL */}
            {activeSection === 'schedule' && (
              <>
                {/* Jadwal Banner */}
                <div className="rounded-3xl relative overflow-hidden p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_16px_36px_-10px_rgba(0,11,26,0.5)] border border-white/15 min-h-[145px]" style={{ background: "linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)" }}>
                  <BannerWavesBackground />
                  <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                    <CalendarCircleBadge />
                    <div className="max-w-md">
                      <h2 className="font-bold text-white text-xl sm:text-2xl tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Jadwal Pertemuan ({currentPraktikumKode})
                      </h2>
                      <p className="text-xs sm:text-sm text-[#BAE6FD] mt-1 leading-relaxed">
                        Berikut adalah jadwal pertemuan Praktikan Laboratorium {currentPraktikumKode}.
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 shrink-0 hidden sm:flex items-center justify-center">
                    <CalendarBannerIllustration className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-md" />
                  </div>
                </div>

                {/* List of Pertemuan Cards */}
                <div className="space-y-3.5">
                  {displayMeetings.map((m, idx) => {
                    return (
                      <div
                        key={m.id || idx}
                        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#D6E4F0] shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3 sm:gap-4"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="text-slate-300 hidden sm:block shrink-0">
                            <Icon name="grip-vertical" size={18} color="#cbd5e1" />
                          </div>

                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{
                              background: 'linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)', boxShadow: '0 16px 36px -10px rgba(0,11,26,0.5)', border: '1px solid rgba(255, 255, 255, 0.12)',
                            }}
                          >
                            <Icon name="check" size={20} color="#ffffff" strokeWidth={2.5} />
                          </div>

                          <div className="min-w-0">
                            <h4
                              className="font-bold text-[#00142F] text-sm sm:text-base leading-snug truncate"
                              style={{ fontFamily: 'var(--font-heading)' }}
                            >
                              {m.label}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#64748B] mt-0.5">
                              <Icon name="calendar" size={13} color="#64748B" />
                              <span>{m.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#f0fdf4] text-[#059669] border border-[#bbf7d0]">
                            <Icon name="check-circle" size={13} color="#059669" strokeWidth={2.2} />
                            <span>Selesai</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* TAB 3: NILAI SAYA */}
            {activeSection === 'grades' && (
              <>
                <div className="rounded-3xl relative overflow-hidden p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_16px_36px_-10px_rgba(0,11,26,0.5)] border border-white/15 min-h-[145px]" style={{ background: "linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)" }}>
                  <BannerWavesBackground />
                  <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                    <BarChartCircleBadge />
                    <div className="max-w-md">
                      <h2 className="font-bold text-white text-xl sm:text-2xl tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Nilai Saya
                      </h2>
                      <p className="text-xs sm:text-sm text-[#BAE6FD] mt-1 leading-relaxed">
                        Pantau perkembangan penilaian praktikummu dengan mudah dan transparan.
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 shrink-0 hidden sm:flex items-center justify-center">
                    <NilaiBannerIllustration className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-md" />
                  </div>
                </div>

                {/* Grade Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Card 1: Tugas Awal */}
                  <div className="bg-white rounded-3xl p-6 border border-[#D6E4F0] shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#002466] text-white flex items-center justify-center shadow-2xs">
                            <Icon name="clipboard-list" size={17} color="#ffffff" strokeWidth={2} />
                          </div>
                          <h3
                            className="font-bold text-[#00142F] text-base"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            Tugas Awal
                          </h3>
                        </div>
                        <button
                          onClick={() => toggleCollapse('ta')}
                          className="w-7 h-7 rounded-full bg-[#F0F7FF] border border-[#D6E4F0] flex items-center justify-center text-[#002466] hover:bg-[#D6E4F0] transition cursor-pointer"
                        >
                          <Icon name={collapsed.ta ? 'plus' : 'minus'} size={14} color="#002466" strokeWidth={2} />
                        </button>
                      </div>

                      {!collapsed.ta && (
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((num) => {
                            const pertemuanItem = nilaiPertemuan.find((p) => p.urutan_ke === num)
                            const row = nilaiRows.find(
                              (r) => r.pertemuan_id === pertemuanItem?.id && r.kode_komponen === 'TA'
                            )
                            const score = row?.nilai

                            return (
                              <div
                                key={num}
                                className="flex items-center justify-between py-1.5 border-b border-[#F4F8FC] last:border-0"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                                  <span className="text-sm font-medium text-slate-700">
                                    Pertemuan {num}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#F0F7FF] text-[#002466] border border-[#D6E4F0]">
                                  {score != null ? score : 'Belum dinilai'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Tugas Rumah */}
                  <div className="bg-white rounded-3xl p-6 border border-[#D6E4F0] shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#002466] text-white flex items-center justify-center shadow-2xs">
                            <Icon name="home" size={17} color="#ffffff" strokeWidth={2} />
                          </div>
                          <h3
                            className="font-bold text-[#00142F] text-base"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            Tugas Rumah
                          </h3>
                        </div>
                        <button
                          onClick={() => toggleCollapse('tr')}
                          className="w-7 h-7 rounded-full bg-[#F0F7FF] border border-[#D6E4F0] flex items-center justify-center text-[#002466] hover:bg-[#D6E4F0] transition cursor-pointer"
                        >
                          <Icon name={collapsed.tr ? 'plus' : 'minus'} size={14} color="#002466" strokeWidth={2} />
                        </button>
                      </div>

                      {!collapsed.tr && (
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((num) => {
                            const pertemuanItem = nilaiPertemuan.find((p) => p.urutan_ke === num)
                            const row = nilaiRows.find(
                              (r) => r.pertemuan_id === pertemuanItem?.id && r.kode_komponen === 'TR'
                            )
                            const score = row?.nilai

                            return (
                              <div
                                key={num}
                                className="flex items-center justify-between py-1.5 border-b border-[#F4F8FC] last:border-0"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                                  <span className="text-sm font-medium text-slate-700">
                                    Pertemuan {num}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#F0F7FF] text-[#002466] border border-[#D6E4F0]">
                                  {score != null ? score : 'Belum dinilai'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Keaktifan */}
                  <div className="bg-white rounded-3xl p-6 border border-[#D6E4F0] shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#002466] text-white flex items-center justify-center shadow-2xs">
                            <Icon name="star" size={17} color="#ffffff" strokeWidth={2} />
                          </div>
                          <h3
                            className="font-bold text-[#00142F] text-base"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            Keaktifan
                          </h3>
                        </div>
                        <button
                          onClick={() => toggleCollapse('p')}
                          className="w-7 h-7 rounded-full bg-[#F0F7FF] border border-[#D6E4F0] flex items-center justify-center text-[#002466] hover:bg-[#D6E4F0] transition cursor-pointer"
                        >
                          <Icon name={collapsed.p ? 'plus' : 'minus'} size={14} color="#002466" strokeWidth={2} />
                        </button>
                      </div>

                      {!collapsed.p && (
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((num) => {
                            const pertemuanItem = nilaiPertemuan.find((p) => p.urutan_ke === num)
                            const row = nilaiRows.find(
                              (r) => r.pertemuan_id === pertemuanItem?.id && r.kode_komponen === 'P'
                            )
                            const score = row?.nilai

                            return (
                              <div
                                key={num}
                                className="flex items-center justify-between py-1.5 border-b border-[#F4F8FC] last:border-0"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                                  <span className="text-sm font-medium text-slate-700">
                                    Pertemuan {num}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#F0F7FF] text-[#002466] border border-[#D6E4F0]">
                                  {score != null ? score : 'Belum dinilai'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 4: QR ABSENSI */}
            {activeSection === 'qr' && (
              <>
                <div className="flex items-center gap-2.5">
                  <Icon name="qr-code" size={22} color="#002466" strokeWidth={2} />
                  <h2
                    className="font-bold text-[#00142F] text-lg sm:text-xl"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    QR Code Absensi
                  </h2>
                </div>

                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#D6E4F0] shadow-xs relative overflow-hidden flex flex-col items-center justify-center text-center">
                  <div className="absolute -top-6 -right-6 opacity-25 pointer-events-none">
                    <MolecularPattern className="w-60 h-48" />
                  </div>
                  <div className="absolute -bottom-6 -left-6 opacity-25 pointer-events-none">
                    <MolecularPattern className="w-60 h-48" />
                  </div>

                  <div className="w-12 h-12 rounded-full bg-[#F0F7FF] flex items-center justify-center text-[#002466] mb-3 shadow-2xs">
                    <Icon name="scan" size={22} color="#002466" strokeWidth={2} />
                  </div>

                  <p className="text-[#002466] text-xs sm:text-sm font-medium max-w-md mb-1 leading-relaxed">
                    Tunjukkan QR code ini kepada asisten untuk konfirmasi kehadiran
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium max-w-md mb-6 leading-relaxed">
                    Kode ini berganti otomatis setiap ~30 detik demi keamanan — screenshot lama tidak akan berlaku.
                  </p>

                  <div className="relative p-4 rounded-3xl bg-white border-2 border-[#0284C7]/80 shadow-md">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-[#002466] rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-[#002466] rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-[#002466] rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-[#002466] rounded-br-xl" />

                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code Absensi"
                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                      />
                    ) : qrError ? (
                      <div className="w-56 h-56 sm:w-64 sm:h-64 flex flex-col items-center justify-center gap-2 text-red-500 text-center px-6">
                        <Icon name="warning" size={26} color="#ef4444" />
                        <span className="text-xs font-medium">Gagal memuat QR. Mencoba lagi...</span>
                      </div>
                    ) : (
                      <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-slate-400">
                        <Icon name="loader" size={28} className="animate-spin text-[#0284C7]" />
                      </div>
                    )}
                  </div>

                  {qrDataUrl && !qrError && qrSecondsLeft !== null && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F7FF] text-[#002466] text-[11px] font-bold border border-[#D6E4F0]">
                      <Icon name="loader" size={12} color="#002466" />
                      Kode baru dalam {qrSecondsLeft}s
                    </div>
                  )}

                  <div className="mt-6">
                    <h3
                      className="font-bold text-[#00142F] text-lg sm:text-xl"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {effectiveName}
                    </h3>
                    <div className="text-xs sm:text-sm text-slate-500 mt-1">
                      NIM: <span className="font-bold text-[#002466]">{effectiveNim}</span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] shadow-2xs">
                      <Icon name="check-circle" size={16} color="#166534" strokeWidth={2.2} />
                      <span>Aktif</span>
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
