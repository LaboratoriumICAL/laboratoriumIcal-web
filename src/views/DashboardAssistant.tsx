import { useState, useEffect, useCallback, useMemo } from 'react'
import * as XLSX from 'xlsx'
import XLSXStyle from 'xlsx-js-style'
import { Icon } from '../components/Icon'
import QRScannerOverlay, { ScanResultData } from '../components/QRScannerOverlay'

interface DashboardAssistantProps {
  user: { role: string; name: string; id?: string; nim?: string }
  setCurrentPage: (page: string) => void
  onLogout: () => void
}

// Filter "Jadwal Praktikum" untuk Absensi & Scan QR — mengikuti enum jenis_pertemuan di
// database (pengarahan/pertemuan/presentasi/uap). 'urutan_ke' null dipakai untuk jenis yang
// tidak berjenjang per angka (mis. Presentasi), selebihnya cocok dengan pertemuan.urutan_ke.
const JADWAL_OPTIONS = [
  { jenis: 'pengarahan', urutan_ke: 0, label: 'Pengarahan' },
  { jenis: 'pertemuan', urutan_ke: 1, label: 'Pertemuan 1' },
  { jenis: 'pertemuan', urutan_ke: 2, label: 'Pertemuan 2' },
  { jenis: 'pertemuan', urutan_ke: 3, label: 'Pertemuan 3' },
  { jenis: 'pertemuan', urutan_ke: 4, label: 'Pertemuan 4' },
  { jenis: 'presentasi', urutan_ke: null as number | null, label: 'Presentasi' },
  { jenis: 'uap', urutan_ke: 5, label: 'UAP' },
] as const
const jadwalKey = (o: { jenis: string; urutan_ke: number | null }) => `${o.jenis}|${o.urutan_ke}`

// Skema komponen nilai berbeda per jenis praktikum.
// - perPertemuan: komponen yang diinput berulang mengikuti jumlah pertemuan reguler kelompok
//   (mis. TR1..TRn, TA1..TAn, dst — n = jumlah pertemuan yang terdaftar di jadwal kelompok itu).
// - finalTunggal: komponen yang cukup satu nilai per praktikan (bukan per pertemuan), disimpan
//   pada baris "bucket" pertemuan jenis 'uap' milik kelompok (baris yang sama dipakai UAP/Jurnal DSK).
// - Kolom "Kehadiran" (PLC) TIDAK diinput manual — nilainya otomatis dihitung & disinkronkan
//   dari data real Absensi & Scan QR (persentase hadir per pertemuan reguler), lewat trigger
//   database trg_recalc_kehadiran. Lihat cellReadonly() di bawah untuk render-nya (read-only).
const KOMPONEN_SKEMA: Record<string, {
  perPertemuan: { kode: string; label: string }[]
  finalTunggal: { kode: string; label: string }[]
}> = {
  DSK: {
    perPertemuan: [
      { kode: 'TR', label: 'TR' },
      { kode: 'TA', label: 'TA' },
      { kode: 'P', label: 'P' },
      { kode: 'LP', label: 'LP' },
    ],
    finalTunggal: [
      { kode: 'UAP', label: 'UAP' },
      { kode: 'JURNAL', label: 'Jurnal' },
    ],
  },
  PLC: {
    perPertemuan: [
      { kode: 'TR', label: 'TR' },
      { kode: 'TA', label: 'TA' },
      { kode: 'P', label: 'P' },
      { kode: 'M', label: 'M' },
      { kode: 'VID', label: 'Video' },
    ],
    finalTunggal: [
      { kode: 'UAP', label: 'UAP' },
      { kode: 'LAPORAN', label: 'Laporan' },
      { kode: 'POSTER', label: 'Poster' },
      { kode: 'PRESENTASI', label: 'Presentasi' },
      { kode: 'KEHADIRAN', label: 'Kehadiran' },
    ],
  },
}
// Praktikum lain (mis. SKI) yang belum punya skema sendiri jatuh ke default DSK.
const DEFAULT_SKEMA = KOMPONEN_SKEMA.DSK
const getSkema = (praktikumKode: string) => KOMPONEN_SKEMA[praktikumKode] || DEFAULT_SKEMA

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

// Background Wave Gradien Khusus Banner
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
        <linearGradient id="deepNavyBannerBg" x1="0" y1="0" x2="1000" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#000B1A" />
          <stop offset="0.45" stopColor="#00183F" />
          <stop offset="1" stopColor="#002B66" />
        </linearGradient>
        <radialGradient id="bannerGlowCyan" cx="860" cy="75" r="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" stopOpacity="0.25" />
          <stop offset="0.65" stopColor="#0284C7" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000B1A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bannerGlowBlue" cx="140" cy="45" r="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0260D4" stopOpacity="0.22" />
          <stop offset="1" stopColor="#000B1A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Deep Navy Base & Ambient Lighting */}
      <rect width="1000" height="160" fill="url(#deepNavyBannerBg)" />
      <rect width="1000" height="160" fill="url(#bannerGlowCyan)" />
      <rect width="1000" height="160" fill="url(#bannerGlowBlue)" />

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

// Icon Bar Chart Lingkaran Halus (Kiri Banner Nilai)
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

// Icon Kalender Lingkaran Halus (Kiri Banner Absensi/Jadwal)
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

// Ilustrasi 3D Clipboard Nilai (Kanan Banner Nilai)
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
        {/* Clipboard Body */}
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

        {/* Paper Sheet */}
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

        {/* Bar Chart on Paper */}
        <rect x="44" y="66" width="6.5" height="18" rx="2" fill="url(#barGrad1)" />
        <rect x="53.5" y="52" width="6.5" height="32" rx="2" fill="url(#barGrad2)" />
        <rect x="63" y="60" width="6.5" height="24" rx="2" fill="url(#barGrad1)" />

        {/* Top Right Document Lines */}
        <rect x="78" y="54" width="34" height="4" rx="2" fill="#D6E4F0" />
        <rect x="78" y="63" width="30" height="4" rx="2" fill="#D6E4F0" />
        <rect x="78" y="72" width="24" height="4" rx="2" fill="#D6E4F0" />

        {/* Bottom Left Document Lines */}
        <rect x="44" y="98" width="32" height="4" rx="2" fill="#D6E4F0" />
        <rect x="44" y="106" width="26" height="4" rx="2" fill="#D6E4F0" />
        <rect x="44" y="114" width="30" height="4" rx="2" fill="#D6E4F0" />

        {/* 3D Segmented Pie Chart on Bottom Right */}
        <g transform="translate(96, 108)">
          <path d="M0 0 L15 0 A15 15 0 0 1 0 15 Z" fill="url(#pie1)" />
          <path d="M0 0 L0 15 A15 15 0 1 1 0 -15 Z" fill="url(#pie2)" />
          <path d="M0 0 L0 -15 A15 15 0 0 1 15 0 Z" fill="#38BDF8" />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
        </g>

        {/* Top Metallic / Pastel Clip */}
        <rect x="56" y="16" width="48" height="18" rx="7" fill="url(#clipMetal)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="80" cy="23" r="3.5" fill="#ffffff" opacity="0.85" />
      </g>
    </svg>
  )
}

// Ilustrasi 3D Kalender (Kanan Banner Absensi/Jadwal)
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
        {/* Calendar Body */}
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

        {/* Calendar Header */}
        <path
          d="M28 44C28 34.0589 36.0589 26 46 26H114C123.941 26 132 34.0589 132 44V56H28V44Z"
          fill="url(#calHeader)"
        />

        {/* 3 Rings on Top */}
        {[48, 80, 112].map((cx, i) => (
          <g key={i}>
            <rect x={cx - 3.5} y="18" width="7" height="16" rx="3.5" fill="#38BDF8" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={cx} cy="26" r="2" fill="#ffffff" />
          </g>
        ))}

        {/* Calendar Sheet Date Grid */}
        <g opacity="0.85">
          <rect x="40" y="66" width="14" height="10" rx="3" fill="rgba(56, 189, 248, 0.2)" />
          <rect x="60" y="66" width="14" height="10" rx="3" fill="rgba(56, 189, 248, 0.2)" />
          <rect x="80" y="66" width="14" height="10" rx="3" fill="#0284C7" />
          <rect x="100" y="66" width="14" height="10" rx="3" fill="rgba(56, 189, 248, 0.2)" />

          <rect x="40" y="82" width="14" height="10" rx="3" fill="rgba(56, 189, 248, 0.2)" />
          <rect x="60" y="82" width="14" height="10" rx="3" fill="#38BDF8" />
          <rect x="80" y="82" width="14" height="10" rx="3" fill="rgba(56, 189, 248, 0.2)" />
          <rect x="100" y="82" width="14" height="10" rx="3" fill="rgba(56, 189, 248, 0.2)" />

          <rect x="40" y="98" width="14" height="10" rx="3" fill="rgba(56, 189, 248, 0.2)" />
          <rect x="60" y="98" width="14" height="10" rx="3" fill="rgba(56, 189, 248, 0.2)" />
          <rect x="80" y="98" width="14" height="10" rx="3" fill="rgba(56, 189, 248, 0.2)" />
        </g>

        {/* 3D Clock Badge on Bottom Right */}
        <g transform="translate(112, 112)" filter="url(#calShadow)">
          <circle cx="0" cy="0" r="22" fill="url(#clockRing)" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="16" fill="#F4F8FC" />
          <line x1="0" y1="-12" x2="0" y2="-9" stroke="#00142F" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="0" x2="9" y2="0" stroke="#00142F" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="12" x2="0" y2="9" stroke="#00142F" strokeWidth="2" strokeLinecap="round" />
          <line x1="-12" y1="0" x2="-9" y2="0" stroke="#00142F" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="0" x2="0" y2="-7" stroke="#00142F" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="5" y2="4" stroke="#00142F" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="0" cy="0" r="2.5" fill="#38BDF8" />
        </g>
      </g>
    </svg>
  )
}

// Icon Import Excel Lingkaran Halus
function ImportCircleBadge() {
  return (
    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        <rect x="4" y="5" width="28" height="26" rx="6" fill="#ffffff" stroke="#FFFFFF" strokeWidth="2.2" />
        <path d="M4 13H32" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M14 13V31" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M22 25L22 17M22 17L18 21M22 17L26 21" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="9" r="1.5" fill="#38BDF8" />
      </svg>
    </div>
  )
}

// Ilustrasi 3D Spreadsheet Excel Import
function ImportBannerIllustration({ className = 'w-36 h-36' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="importShadow" x="-10" y="-5" width="180" height="170" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#00142F" floodOpacity="0.18" />
        </filter>
        <linearGradient id="excelGrad" x1="28" y1="24" x2="132" y2="148" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#F0F7FF" />
        </linearGradient>
        <linearGradient id="excelHeader" x1="28" y1="24" x2="132" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="arrowBadgeGrad" x1="85" y1="85" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#002466" />
          <stop offset="1" stopColor="#D6E4F0" />
        </linearGradient>
      </defs>

      <g transform="rotate(-2 80 80)">
        <rect
          x="28"
          y="24"
          width="104"
          height="112"
          rx="18"
          fill="url(#excelGrad)"
          stroke="#D6E4F0"
          strokeWidth="2.5"
          filter="url(#importShadow)"
        />

        <path
          d="M28 42C28 32.0589 36.0589 24 46 24H114C123.941 24 132 32.0589 132 42V52H28V42Z"
          fill="url(#excelHeader)"
        />
        <text x="40" y="42" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
          XLSX DATA
        </text>

        <g stroke="#D6E4F0" strokeWidth="1.5">
          <line x1="28" y1="72" x2="132" y2="72" />
          <line x1="28" y1="92" x2="132" y2="92" />
          <line x1="28" y1="112" x2="132" y2="112" />
          <line x1="62" y1="52" x2="62" y2="136" />
          <line x1="96" y1="52" x2="96" y2="136" />
        </g>

        <rect x="36" y="59" width="18" height="6" rx="2" fill="rgba(56, 189, 248, 0.2)" />
        <rect x="70" y="59" width="18" height="6" rx="2" fill="#a7f3d0" />
        <rect x="36" y="79" width="18" height="6" rx="2" fill="rgba(56, 189, 248, 0.2)" />
        <rect x="70" y="79" width="18" height="6" rx="2" fill="rgba(56, 189, 248, 0.2)" />
        <rect x="36" y="99" width="18" height="6" rx="2" fill="#a7f3d0" />
        <rect x="70" y="99" width="18" height="6" rx="2" fill="rgba(56, 189, 248, 0.2)" />

        <g transform="translate(112, 112)" filter="url(#importShadow)">
          <circle cx="0" cy="0" r="22" fill="url(#arrowBadgeGrad)" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="16" fill="#F4F8FC" />
          <path
            d="M0 7V-7M0 -7L-6 -1M0 -7L6 -1"
            stroke="#00142F"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  )
}

// Icon Profil Kontak Lingkaran Halus
function ProfileCircleBadge() {
  return (
    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        <circle cx="18" cy="13" r="6" stroke="#FFFFFF" strokeWidth="2.2" fill="rgba(56, 189, 248, 0.2)" />
        <path d="M6 30C6 24 11 22 18 22C25 22 30 24 30 30" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="27" cy="10" r="2" fill="#0284C7" />
      </svg>
    </div>
  )
}

// Ilustrasi 3D ID Card Profil Asisten
function ProfileBannerIllustration({ className = 'w-36 h-36' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="profShadow" x="-10" y="-5" width="180" height="170" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#00142F" floodOpacity="0.18" />
        </filter>
        <linearGradient id="cardGrad" x1="28" y1="24" x2="132" y2="148" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#F0F7FF" />
        </linearGradient>
        <linearGradient id="cardHeader" x1="28" y1="24" x2="132" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00142F" />
          <stop offset="1" stopColor="#002466" />
        </linearGradient>
        <linearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#00142F" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      <g transform="rotate(2 80 80)">
        <rect
          x="30"
          y="22"
          width="100"
          height="116"
          rx="18"
          fill="url(#cardGrad)"
          stroke="#D6E4F0"
          strokeWidth="2.5"
          filter="url(#profShadow)"
        />

        <rect x="66" y="14" width="28" height="12" rx="5" fill="#38BDF8" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="80" cy="20" r="3" fill="#ffffff" />

        <path
          d="M30 40C30 30.0589 38.0589 22 48 22H112C121.941 22 130 30.0589 130 40V46H30V40Z"
          fill="url(#cardHeader)"
        />

        <circle cx="80" cy="66" r="18" fill="#F4F8FC" stroke="#0284C7" strokeWidth="2" />
        <circle cx="80" cy="62" r="7" fill="url(#avatarGrad)" />
        <path d="M68 79C68 73 73 71 80 71C87 71 92 73 92 79" fill="url(#avatarGrad)" />

        <rect x="52" y="92" width="56" height="5" rx="2.5" fill="#38BDF8" />
        <rect x="62" y="101" width="36" height="4" rx="2" fill="#D6E4F0" />

        <g transform="translate(56, 116)">
          <circle cx="10" cy="8" r="8" fill="#25d366" />
          <path d="M8 5.5C8 5.5 8 9.5 11.5 10.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="38" cy="8" r="8" fill="#e1306c" />
          <circle cx="38" cy="8" r="4" stroke="#ffffff" strokeWidth="1.2" />
        </g>
      </g>
    </svg>
  )
}

// Icon Pengumuman & Berita Lingkaran Halus
function BeritaCircleBadge() {
  return (
    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        <path
          d="M6 14H10L18 8V28L10 22H6C4.89543 22 4 21.1046 4 20V16C4 14.8954 4.89543 14 6 14Z"
          fill="#ffffff"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M22 13C24 15 24 21 22 23" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M26 10C29 13 29 23 26 26" stroke="#00142F" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="31" cy="9" r="1.5" fill="#0284C7" />
      </svg>
    </div>
  )
}

// Icon Data Praktikan Lingkaran Halus
function PraktikanCircleBadge() {
  return (
    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        <circle cx="18" cy="11" r="5" stroke="#FFFFFF" strokeWidth="2.2" />
        <path d="M7 29C7 23.5 11.9 19 18 19C24.1 19 29 23.5 29 29" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="26" cy="14" r="4.5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M23.8 14L25.2 15.4L28.2 12.2" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// Ilustrasi 3D Megaphone & Berita
function BeritaBannerIllustration({ className = 'w-36 h-36' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="newsShadow" x="-10" y="-5" width="180" height="170" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#00142F" floodOpacity="0.18" />
        </filter>
        <linearGradient id="speakerGrad" x1="20" y1="40" x2="90" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00142F" />
          <stop offset="1" stopColor="#002466" />
        </linearGradient>
        <linearGradient id="coneGrad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#0284C7" />
          <stop offset="1" stopColor="#00142F" />
        </linearGradient>
      </defs>

      <g transform="rotate(-3 80 80)">
        <rect
          x="44"
          y="26"
          width="88"
          height="108"
          rx="16"
          fill="#ffffff"
          stroke="#D6E4F0"
          strokeWidth="2.2"
          filter="url(#newsShadow)"
        />
        <rect x="56" y="40" width="46" height="6" rx="3" fill="#38BDF8" />
        <rect x="56" y="52" width="64" height="4" rx="2" fill="#D6E4F0" />
        <rect x="56" y="60" width="58" height="4" rx="2" fill="#D6E4F0" />
        <rect x="56" y="68" width="50" height="4" rx="2" fill="#D6E4F0" />
        <rect x="56" y="80" width="36" height="28" rx="6" fill="rgba(56, 189, 248, 0.2)" />
        <rect x="98" y="80" width="22" height="4" rx="2" fill="#D6E4F0" />
        <rect x="98" y="88" width="22" height="4" rx="2" fill="#D6E4F0" />
        <rect x="98" y="96" width="16" height="4" rx="2" fill="#D6E4F0" />

        <g transform="translate(18, 55)" filter="url(#newsShadow)">
          <path
            d="M20 28 L48 10 L48 54 L20 38 Z"
            fill="url(#coneGrad)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <ellipse cx="48" cy="32" rx="6" ry="22" fill="#0284C7" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="8" y="24" width="14" height="18" rx="4" fill="url(#speakerGrad)" stroke="#ffffff" strokeWidth="1.2" />
          <path d="M14 42 L11 58 L18 58 L19 42" fill="#38BDF8" stroke="#ffffff" strokeWidth="1" />
          <path d="M58 20 C64 26 64 38 58 44" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M65 14 C74 23 74 41 65 50" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function DashboardAssistant({ user, setCurrentPage, onLogout }: DashboardAssistantProps) {
  const [activeSection, setActiveSection] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [gradeFilter, setGradeFilter] = useState({ jurusan: '', practicum: '', kelas: '' })
  const [jurusanList, setJurusanList] = useState<{ id: string; kode: string; nama: string; kelasTersedia?: string[]; praktikum: { id: string; kode: string; nama: string }[] }[]>([])
  const [kelasOptions, setKelasOptions] = useState<{ id: string; nama_kelas: string }[]>([])
  const [kelasLoading, setKelasLoading] = useState(false)

  // ---- Import Praktikan (upload Excel/CSV sungguhan, mendukung banyak sheet/kelas dalam 1 file) ----
  interface ImportRow { nama: string; nim: string; kelompok: string; shift: string; asisten: string }
  interface ImportJadwal { hari: string; jamMulai: string; pengarahan: string; pertemuan: { urutan: number; tanggal: string }[]; uap: string }
  interface ImportSheet { sheetName: string; kelasNama: string; rows: ImportRow[]; jadwal: ImportJadwal | null; error: string | null; included: boolean }
  const [importFilter, setImportFilter] = useState({ jurusan: '', practicum: '' })
  const [importSheets, setImportSheets] = useState<ImportSheet[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [importParsing, setImportParsing] = useState(false)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ kelasCount: number; kelompokCount: number; anggotaCount: number; errors: string[] } | null>(null)

  // ---- Profile Asisten (WhatsApp & Instagram tersambung ke ContactPage & Supabase) ----
  const [profileWa, setProfileWa] = useState('')
  const [profileIg, setProfileIg] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    if (activeSection !== 'profile') return
    setProfileLoading(true)
    setProfileSuccess('')
    setProfileError('')
    fetch(`/api/asisten?id=${encodeURIComponent(user.id || '')}&nim=${encodeURIComponent(user.nim || '')}&name=${encodeURIComponent(user.name || '')}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.assistant) {
          setProfileWa(json.assistant.wa || '')
          setProfileIg(json.assistant.ig || '')
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [activeSection, user.id, user.nim, user.name])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileSuccess('')
    setProfileError('')
    try {
      const res = await fetch('/api/asisten', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          nim: user.nim,
          name: user.name,
          wa: profileWa.trim(),
          ig: profileIg.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal menyimpan profil')
      setProfileSuccess('Kontak WhatsApp & Instagram berhasil disimpan dan langsung terhubung ke halaman Kontak Asisten!')
    } catch (err: any) {
      setProfileError(err.message || 'Terjadi kesalahan saat menyimpan profil')
    } finally {
      setProfileSaving(false)
    }
  }

  const importJurusan = jurusanList.find((j) => j.kode === importFilter.jurusan)

  // Daftar tetap 3 jenis praktikum yang selalu tampil di dropdown, terlepas dari jurusan yang
  // dipilih ada datanya atau tidak — sama seperti pola di halaman Jadwal Praktikum (publik).
  const JENIS_PRAKTIKUM_TETAP = [
    { kode: 'DSK', nama: 'Dasar Sistem Kontrol' },
    { kode: 'PLC', nama: 'Programmable Logic Controller' },
    { kode: 'SKI', nama: 'Sistem Kontrol Industri' },
  ]

  const importPracticumUnavailable =
    !!importFilter.jurusan &&
    !!importFilter.practicum &&
    !importJurusan?.praktikum.some((p) => p.kode === importFilter.practicum)

  const gradeJurusan = jurusanList.find((j) => j.kode === gradeFilter.jurusan)
  const gradePracticumUnavailable =
    !!gradeFilter.jurusan &&
    !!gradeFilter.practicum &&
    !gradeJurusan?.praktikum.some((p) => p.kode === gradeFilter.practicum)

  const BULAN_ID: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
  }
  // Ambil tanggal "1 April 2026" (boleh ada teks tambahan setelahnya, mis. "Modul 1")
  // dari sebuah sel, lalu ubah jadi format ISO "2026-04-01". Return '' kalau tidak ketemu pola tanggal.
  const parseIndoDate = (raw: string): string => {
    const m = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
    if (!m) return ''
    const bulan = BULAN_ID[m[2].toLowerCase()]
    if (!bulan) return ''
    return `${m[3]}-${bulan}-${m[1].padStart(2, '0')}`
  }

  // Parse 1 sheet (1 kelas) dari struktur "raw" (hasil sheet_to_json header:1) menjadi
  // { kelasNama, rows, jadwal } atau error kalau strukturnya tidak dikenali.
  const extractSheetData = (raw: any[][], sheetName: string): ImportSheet => {
    const norm = (v: any) => String(v ?? '').trim().toUpperCase()

    // Cari nama kelas dari blok metadata di atas (baris "KELAS : TE A" dsb), sebelum baris header ditemukan.
    let kelasFromMeta = ''

    // Cari baris header sungguhan: baris yang punya sel "NIM" DAN "NAMA" DAN "KELOMPOK".
    let headerRowIdx = -1
    let col: Record<string, number> = {}
    let pertemuanCols: { urutan: number; idx: number }[] = []
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i].map(norm)

      // Deteksi baris metadata "KELAS" sebelum ketemu header (kolom A = label, kolom B = nilai)
      if (headerRowIdx === -1 && !kelasFromMeta) {
        const kelasIdx = row.findIndex((c) => c === 'KELAS')
        if (kelasIdx !== -1) {
          const rawVal = String(raw[i][kelasIdx + 1] ?? '').trim()
          kelasFromMeta = rawVal.replace(/^:\s*/, '').trim()
        }
      }

      const hasNim = row.some((c) => c === 'NIM')
      const hasNama = row.some((c) => c.startsWith('NAMA') && c !== 'NAMA MK')
      const hasKelompok = row.some((c) => c === 'KELOMPOK')
      if (hasNim && hasNama && hasKelompok) {
        headerRowIdx = i
        row.forEach((c, idx) => {
          if (c === 'NIM') col.nim = idx
          else if (c.startsWith('NAMA') && c !== 'NAMA MK') col.nama = idx
          else if (c === 'KELOMPOK') col.kelompok = idx
          else if (c === 'ASISTEN') col.asisten = idx
          else if (c === 'SHIFT') col.shift = idx
          else if (c === 'HARI/JAM' || c === 'HARI / JAM') col.hariJam = idx
          else if (c === 'PENGARAHAN') col.pengarahan = idx
          else if (c === 'UAP') col.uap = idx
          else {
            const m = c.match(/^PERTEMUAN\s+(\d+)$/)
            if (m) pertemuanCols.push({ urutan: parseInt(m[1], 10), idx })
          }
        })
        pertemuanCols.sort((a, b) => a.urutan - b.urutan)
        break
      }
    }

    if (headerRowIdx === -1) {
      return { sheetName, kelasNama: kelasFromMeta || sheetName, rows: [], jadwal: null, error: 'Tidak ditemukan kolom NIM/NAMA/KELOMPOK di sheet ini — dilewati.', included: false }
    }

    let lastKelompok = ''
    let lastAsisten = ''
    let lastShift = ''
    let hariJamRaw = ''
    let pengarahanRaw = ''
    const pertemuanRawMap = new Map<number, string>(pertemuanCols.map((p) => [p.urutan, '']))
    let uapRaw = ''
    const parsed: ImportRow[] = []
    for (let i = headerRowIdx + 1; i < raw.length; i++) {
      const r = raw[i]
      const nim = String(r[col.nim] ?? '').trim()
      const nama = String(r[col.nama] ?? '').trim()
      if (!nim && !nama) continue

      const kelompokCell = col.kelompok !== undefined ? String(r[col.kelompok] ?? '').trim() : ''
      const asistenCell = col.asisten !== undefined ? String(r[col.asisten] ?? '').trim() : ''
      const shiftCell = col.shift !== undefined ? String(r[col.shift] ?? '').trim() : ''

      if (kelompokCell) lastKelompok = kelompokCell
      if (asistenCell) lastAsisten = asistenCell
      if (shiftCell) lastShift = shiftCell

      if (!hariJamRaw && col.hariJam !== undefined) hariJamRaw = String(r[col.hariJam] ?? '').trim()
      if (!pengarahanRaw && col.pengarahan !== undefined) pengarahanRaw = String(r[col.pengarahan] ?? '').trim()
      for (const p of pertemuanCols) {
        if (!pertemuanRawMap.get(p.urutan)) {
          const v = String(r[p.idx] ?? '').trim()
          if (v) pertemuanRawMap.set(p.urutan, v)
        }
      }
      if (!uapRaw && col.uap !== undefined) uapRaw = String(r[col.uap] ?? '').trim()

      if (!nim || !nama) continue
      parsed.push({ nama, nim, kelompok: lastKelompok, shift: lastShift, asisten: lastAsisten })
    }

    if (parsed.length === 0) {
      return { sheetName, kelasNama: kelasFromMeta || sheetName, rows: [], jadwal: null, error: 'Tidak ada baris praktikan valid di sheet ini — dilewati.', included: false }
    }

    const hariMatch = hariJamRaw.match(/^([A-Za-z]+)/)
    const jamMatch = hariJamRaw.match(/(\d{1,2})[.:](\d{2})/)
    const pertemuanParsed = pertemuanCols
      .map((p) => ({ urutan: p.urutan, tanggal: parseIndoDate(pertemuanRawMap.get(p.urutan) || '') }))
      .filter((p) => p.tanggal)

    // Nama kelas: utamakan dari metadata "KELAS : ..."; kalau tidak ada, pakai nama tab sheet-nya.
    // Ambil huruf terakhir saja kalau formatnya "TE A" -> "A" (biar cocok dengan kelasTersedia di jurusan, mis. ['A','B','C','D']).
    let kelasNama = (kelasFromMeta || sheetName).trim()
    const lastWord = kelasNama.split(/\s+/).pop() || kelasNama
    if (/^[A-Z]$/.test(lastWord)) kelasNama = lastWord

    return {
      sheetName,
      kelasNama,
      rows: parsed,
      jadwal: {
        hari: hariMatch ? hariMatch[1] : '',
        jamMulai: jamMatch ? `${jamMatch[1].padStart(2, '0')}:${jamMatch[2]}` : '',
        pengarahan: parseIndoDate(pengarahanRaw),
        pertemuan: pertemuanParsed,
        uap: parseIndoDate(uapRaw),
      },
      error: null,
      included: true,
    }
  }

  const handleImportFile = (file: File | undefined) => {
    if (!file) return
    setImportError(null)
    setImportResult(null)
    setImportFileName(file.name)
    setImportParsing(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = XLSX.read(data, { type: 'binary' })
        const sheets: ImportSheet[] = wb.SheetNames.map((name) => {
          const raw: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
          return extractSheetData(raw, name)
        })
        setImportSheets(sheets)
        if (sheets.every((s) => s.error)) {
          setImportError('Tidak ada satupun sheet yang berhasil dibaca. Pastikan file adalah format jadwal praktikum resmi.')
        }
      } catch (err) {
        setImportError('Gagal membaca file. Pastikan file berformat .xlsx atau .xls yang valid.')
        setImportSheets([])
      } finally {
        setImportParsing(false)
      }
    }
    reader.onerror = () => {
      setImportError('Gagal membaca file.')
      setImportParsing(false)
    }
    reader.readAsBinaryString(file)
  }

  const toggleSheetIncluded = (sheetName: string) => {
    setImportSheets((prev) => prev.map((s) => (s.sheetName === sheetName ? { ...s, included: !s.included } : s)))
  }

  const handleSubmitImport = async () => {
    const toImport = importSheets.filter((s) => s.included && !s.error && s.rows.length > 0)
    if (!importFilter.practicum || importPracticumUnavailable || toImport.length === 0) return
    setImportSubmitting(true)
    setImportError(null)
    setImportResult(null)
    try {
      let kelompokCount = 0
      let anggotaCount = 0
      const errors: string[] = []
      for (const sheet of toImport) {
        const res = await fetch('/api/import-praktikan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ praktikumKode: importFilter.practicum, jurusanKode: importFilter.jurusan, kelasNama: sheet.kelasNama, rows: sheet.rows, jadwal: sheet.jadwal }),
        })
        const json = await res.json()
        if (!res.ok) {
          errors.push(`Kelas ${sheet.kelasNama}: ${json.error || 'gagal diimport'}`)
          continue
        }
        kelompokCount += json.kelompokCount || 0
        anggotaCount += json.anggotaCount || 0
        errors.push(...(json.errors || []))
      }
      setImportResult({ kelasCount: toImport.length, kelompokCount, anggotaCount, errors })
      setImportSheets([])
      setImportFileName('')
    } catch (err: any) {
      setImportError(err.message)
    } finally {
      setImportSubmitting(false)
    }
  }

  useEffect(() => {
    fetch('/api/jurusan')
      .then((r) => r.json())
      .then((json) => setJurusanList(json.jurusan || []))
      .catch(() => setJurusanList([]))
  }, [])

  useEffect(() => {
    if (!gradeFilter.practicum || gradePracticumUnavailable) {
      setKelasOptions([])
      return
    }
    setKelasLoading(true)
    fetch(`/api/kelas-praktikum?praktikum=${gradeFilter.practicum}&jurusan=${gradeFilter.jurusan}`)
      .then((r) => r.json())
      .then((json) => setKelasOptions(json.kelas || []))
      .catch(() => setKelasOptions([]))
      .finally(() => setKelasLoading(false))
  }, [gradeFilter.practicum, gradeFilter.jurusan, gradePracticumUnavailable])

  // ---- Data Praktikan & Status Akun (Menu khusus untuk monitoring akun praktikan) ----
  const [studentFilter, setStudentFilter] = useState({ jurusan: '', practicum: '', kelas: '' })
  const [studentKelasOptions, setStudentKelasOptions] = useState<{ id: string; nama_kelas: string }[]>([])
  const [studentKelasLoading, setStudentKelasLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'registered' | 'unregistered'>('all')
  const [studentData, setStudentData] = useState<{
    students: {
      id: string
      no: number
      nama: string
      nim: string
      kelompok: string
      shift: string
      kelas: string
      asisten: string
      hasAccount: boolean
      email: string | null
      registeredAt: string | null
    }[]
    total: number
    registeredCount: number
    unregisteredCount: number
  } | null>(null)
  const [studentLoading, setStudentLoading] = useState(false)
  const [studentError, setStudentError] = useState<string | null>(null)

  const studentJurusan = jurusanList.find((j) => j.kode === studentFilter.jurusan)
  const studentPracticumUnavailable =
    !!studentFilter.jurusan &&
    !!studentFilter.practicum &&
    !studentJurusan?.praktikum.some((p) => p.kode === studentFilter.practicum)

  useEffect(() => {
    if (!studentFilter.practicum || studentPracticumUnavailable) {
      setStudentKelasOptions([])
      return
    }
    setStudentKelasLoading(true)
    fetch(`/api/kelas-praktikum?praktikum=${studentFilter.practicum}&jurusan=${studentFilter.jurusan}`)
      .then((r) => r.json())
      .then((json) => setStudentKelasOptions(json.kelas || []))
      .catch(() => setStudentKelasOptions([]))
      .finally(() => setStudentKelasLoading(false))
  }, [studentFilter.practicum, studentFilter.jurusan, studentPracticumUnavailable])

  const fetchStudentData = useCallback(async () => {
    if (!studentFilter.practicum || studentPracticumUnavailable) {
      setStudentData(null)
      return
    }
    setStudentLoading(true)
    setStudentError(null)
    try {
      const qs = new URLSearchParams({ praktikum: studentFilter.practicum })
      if (studentFilter.jurusan) qs.set('jurusan', studentFilter.jurusan)
      if (studentFilter.kelas) qs.set('kelas', studentFilter.kelas)
      const res = await fetch(`/api/asisten/praktikan?${qs.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data praktikan')
      setStudentData(json)
    } catch (err: any) {
      setStudentError(err.message || 'Gagal memuat data praktikan')
      setStudentData(null)
    } finally {
      setStudentLoading(false)
    }
  }, [studentFilter.practicum, studentFilter.jurusan, studentFilter.kelas, studentPracticumUnavailable])

  useEffect(() => {
    if (activeSection === 'students' && studentFilter.practicum && !studentPracticumUnavailable) {
      fetchStudentData()
    }
  }, [activeSection, studentFilter.practicum, studentFilter.jurusan, studentFilter.kelas, studentPracticumUnavailable, fetchStudentData])

  const filteredStudents = useMemo(() => {
    if (!studentData?.students) return []
    return studentData.students.filter((s) => {
      const matchStatus =
        studentStatusFilter === 'all' ||
        (studentStatusFilter === 'registered' && s.hasAccount) ||
        (studentStatusFilter === 'unregistered' && !s.hasAccount)
      const q = studentSearch.toLowerCase().trim()
      const matchSearch =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q) ||
        s.kelompok.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [studentData, studentStatusFilter, studentSearch])

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null)

  const handleDeleteStudents = async () => {
    if (!studentFilter.practicum) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/asisten/praktikan', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurusan: studentFilter.jurusan,
          praktikum: studentFilter.practicum,
          kelas: studentFilter.kelas || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus data praktikan')
      setShowDeleteModal(false)
      setDeleteSuccessMsg(json.message || 'Data praktikan berhasil dihapus')
      setTimeout(() => setDeleteSuccessMsg(null), 5000)
      fetchStudentData()
      if (studentFilter.practicum && studentFilter.jurusan) {
        fetch(`/api/kelas-praktikum?praktikum=${studentFilter.practicum}&jurusan=${studentFilter.jurusan}`)
          .then((r) => r.json())
          .then((j) => setStudentKelasOptions(j.kelas || []))
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menghapus data')
    } finally {
      setDeleteLoading(false)
    }
  }

  interface NilaiAnggota { id: string; kelompok_id: string; nama_praktikan: string; nim: string; nomor_urut: number | null; nama_kelompok?: string; hasAccount?: boolean }
  interface NilaiPertemuanInfo { urutan_ke: number | null; jenis: string; label: string }
  interface NilaiKelasInfo { id: string; nama_kelas: string; dosen_pengampu: string | null; id_dosen: string | null; jumlah_peserta: number | null }
  interface NilaiApiData {
    anggota: NilaiAnggota[]
    pertemuan: NilaiPertemuanInfo[]
    pertemuanRows: { id: string; kelompok_id: string; jenis: string; urutan_ke: number | null }[]
    nilai: { anggota_kelompok_id: string; pertemuan_id: string; kode_komponen: string; nilai: number | null }[]
    absensi?: { anggota_kelompok_id: string; pertemuan_id: string; status: string }[]
    kelas: NilaiKelasInfo[]
  }
  const [nilaiData, setNilaiData] = useState<NilaiApiData | null>(null)
  const [nilaiLoading, setNilaiLoading] = useState(false)
  const [nilaiError, setNilaiError] = useState<string | null>(null)
  const [nilaiSaving, setNilaiSaving] = useState(false)
  const [nilaiSavedMsg, setNilaiSavedMsg] = useState<string | null>(null)
  const [nilaiDrafts, setNilaiDrafts] = useState<Record<string, string>>({})

  const fetchNilai = useCallback(async (praktikumKode: string, kelasNama: string, jurusanKode: string) => {
    setNilaiLoading(true)
    setNilaiError(null)
    try {
      const qs = new URLSearchParams({ praktikum: praktikumKode })
      if (kelasNama) qs.set('kelas', kelasNama)
      if (jurusanKode) qs.set('jurusan', jurusanKode)
      const res = await fetch(`/api/nilai?${qs.toString()}`)
      const json = await res.json()
      if (json.anggota) {
        json.anggota.sort((a: any, b: any) =>
          (a.nim || '').localeCompare(b.nim || '', undefined, { numeric: true })
        )
      }
      setNilaiData(json)
      const drafts: Record<string, string> = {}
      for (const row of json.nilai || []) {
        drafts[`${row.anggota_kelompok_id}::${row.pertemuan_id}::${row.kode_komponen}`] = row.nilai ?? ''
      }
      setNilaiDrafts(drafts)
    } catch (err: any) {
      setNilaiError(err.message)
    } finally {
      setNilaiLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSection === 'grades' && gradeFilter.practicum && !gradePracticumUnavailable) {
      fetchNilai(gradeFilter.practicum, gradeFilter.kelas, gradeFilter.jurusan)
    }
  }, [activeSection, gradeFilter.practicum, gradeFilter.kelas, gradeFilter.jurusan, gradePracticumUnavailable, fetchNilai])

  const handleSaveNilai = async () => {
    if (!nilaiData) return
    setNilaiSaving(true)
    setNilaiSavedMsg(null)
    try {
      const updates = Object.entries(nilaiDrafts)
        .filter(([key, v]) => v !== '' && !key.endsWith('::KEHADIRAN'))
        .map(([key, v]) => {
          const [anggota_kelompok_id, pertemuan_id, kode_komponen] = key.split('::')
          return { anggota_kelompok_id, pertemuan_id, kode_komponen, nilai: Number(v) }
        })
      if (updates.length === 0) {
        setNilaiSaving(false)
        return
      }
      const res = await fetch('/api/nilai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan nilai')
      setNilaiSavedMsg(`${updates.length} nilai berhasil disimpan.`)
      await fetchNilai(gradeFilter.practicum, gradeFilter.kelas, gradeFilter.jurusan)
    } catch (err: any) {
      setNilaiError(err.message)
    } finally {
      setNilaiSaving(false)
    }
  }
  // --- Export tabel nilai ke format Excel resmi (mengikuti struktur TEMPLATE_PENILAIAN_PRAKTIKAN) ---
  const handleExportExcel = () => {
    if (!nilaiData || nilaiData.anggota.length === 0) return

    const pertemuanReguler = nilaiData.pertemuan.filter((p) => p.jenis === 'pertemuan').sort((a, b) => (a.urutan_ke || 0) - (b.urutan_ke || 0))
    const pertemuanUap = nilaiData.pertemuan.find((p) => p.jenis === 'uap')
    const n = pertemuanReguler.length
    const skema = getSkema(gradeFilter.practicum)

    const findPertemuanId = (kelompokId: string, jenis: string, urutanKe: number | null) =>
      nilaiData.pertemuanRows.find((r) => r.kelompok_id === kelompokId && r.jenis === jenis && r.urutan_ke === urutanKe)?.id

    const getNilai = (anggotaId: string, kelompokId: string, jenis: string, urutanKe: number | null, kode: string): number | '' => {
      const pertemuanId = findPertemuanId(kelompokId, jenis, urutanKe)
      if (!pertemuanId) return ''
      const key = `${anggotaId}::${pertemuanId}::${kode}`
      const v = nilaiDrafts[key]
      return v === undefined || v === '' ? '' : Number(v)
    }

    const praktikumLabel = JENIS_PRAKTIKUM_TETAP.find((p) => p.kode === gradeFilter.practicum)?.nama || gradeFilter.practicum
    const colLetter = (i: number) => XLSX.utils.encode_col(i)

    // Praktikum DSK sudah punya bobot penilaian resmi (10/10/20/20/25/15%) dari template kampus,
    // jadi export-nya sertakan rumus rata-rata + bobot + Nilai Akhir + Huruf otomatis.
    // Praktikum lain (mis. PLC) belum ada bobot resmi yang diketahui sistem, jadi export-nya
    // berisi nilai mentah per komponen dulu (siap diisi bobotnya manual oleh koordinator).
    if (gradeFilter.practicum === 'DSK') {
      handleExportExcelDSK({ pertemuanReguler, pertemuanUap, n, getNilai, praktikumLabel, colLetter })
      return
    }
    if (gradeFilter.practicum === 'PLC') {
      handleExportExcelPLC({ pertemuanReguler, pertemuanUap, getNilai })
      return
    }

    // --- Export generik: nilai mentah sesuai skema komponen praktikum ini ---
    const cStart = 4 // kolom E (index 4) = mulai komponen per-pertemuan
    const perPertemuanStarts = skema.perPertemuan.map((_, idx) => cStart + idx * n)
    const cFinalStart = cStart + skema.perPertemuan.length * n
    const totalCols = cFinalStart + skema.finalTunggal.length

    const groupHeader: string[] = new Array(totalCols).fill('')
    groupHeader[0] = 'No'; groupHeader[1] = 'NIM'; groupHeader[2] = 'Nama'; groupHeader[3] = 'Asisten'
    skema.perPertemuan.forEach((k, idx) => { groupHeader[perPertemuanStarts[idx]] = k.label })
    skema.finalTunggal.forEach((k, idx) => { groupHeader[cFinalStart + idx] = k.label })

    const subHeader: string[] = new Array(totalCols).fill('')
    skema.perPertemuan.forEach((k, idx) => {
      for (let i = 0; i < n; i++) subHeader[perPertemuanStarts[idx] + i] = `${k.kode}${i + 1}`
    })

    const aoa: (string | number)[][] = [
      ['SEMESTER', ': '],
      ['KODE MK', `: ${gradeFilter.practicum}`],
      ['NAMA MK', `: PRAK. ${praktikumLabel}`],
      ['KELAS', `: ${gradeFilter.kelas || 'Semua Kelas'}`],
      [],
      ['JUMLAH PESERTA', `: ${nilaiData.anggota.length}`],
      [],
      groupHeader,
      subHeader,
    ]

    nilaiData.anggota.forEach((a, i) => {
      const row: (string | number)[] = new Array(totalCols).fill('')
      row[0] = i + 1
      row[1] = a.nim
      row[2] = a.nama_praktikan
      row[3] = ''
      skema.perPertemuan.forEach((k, idx) => {
        pertemuanReguler.forEach((p, pIdx) => { row[perPertemuanStarts[idx] + pIdx] = getNilai(a.id, a.kelompok_id, 'pertemuan', p.urutan_ke, k.kode) })
      })
      skema.finalTunggal.forEach((k, idx) => {
        row[cFinalStart + idx] = pertemuanUap ? getNilai(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, k.kode) : ''
      })
      aoa.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = []
    const headerRow0 = aoa.length - nilaiData.anggota.length - 2
    const headerRow1 = headerRow0 + 1
    skema.perPertemuan.forEach((_, idx) => {
      if (n > 1) merges.push({ s: { r: headerRow0, c: perPertemuanStarts[idx] }, e: { r: headerRow0, c: perPertemuanStarts[idx] + n - 1 } })
    })
      ;[0, 1, 2, 3, ...skema.finalTunggal.map((_, idx) => cFinalStart + idx)].forEach((c) => {
        merges.push({ s: { r: headerRow0, c }, e: { r: headerRow1, c } })
      })
    ws['!merges'] = merges
    ws['!cols'] = new Array(totalCols).fill({ wch: 9 })

    const wb = XLSX.utils.book_new()
    const sheetName = `${gradeFilter.practicum} ${gradeFilter.kelas || ''}`.trim().slice(0, 31) || 'Nilai'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `Nilai_${gradeFilter.practicum}_${gradeFilter.kelas || 'semua'}.xlsx`)
  }

  // --- Export khusus DSK: pakai rumus rata-rata + bobot resmi (10/10/20/20/25/15%) + Nilai Akhir + Huruf ---
  const handleExportExcelDSK = ({
    pertemuanReguler, pertemuanUap, n, getNilai, praktikumLabel, colLetter,
  }: {
    pertemuanReguler: { urutan_ke: number | null; jenis: string; label: string }[]
    pertemuanUap?: { urutan_ke: number | null; jenis: string; label: string }
    n: number
    getNilai: (anggotaId: string, kelompokId: string, jenis: string, urutanKe: number | null, kode: string) => number | ''
    praktikumLabel: string
    colLetter: (i: number) => string
  }) => {
    if (!nilaiData) return
    const cTRStart = 4 // kolom E (index 4) = mulai TR
    const cTAStart = cTRStart + n
    const cPStart = cTAStart + n
    const cLPStart = cPStart + n
    const cUAP = cLPStart + n
    const cJurnal = cUAP + 1
    const cLulusTA = cJurnal + 1
    const cTRavg = cLulusTA + 1
    const cTRw = cTRavg + 1
    const cTAavg = cTRw + 1
    const cTAw = cTAavg + 1
    const cPavg = cTAw + 1
    const cPw = cPavg + 1
    const cLPavg = cPw + 1
    const cLPw = cLPavg + 1
    const cUAPraw = cLPw + 1
    const cUAPw = cUAPraw + 1
    const cJurnalraw = cUAPw + 1
    const cJurnalw = cJurnalraw + 1
    const cNilaiAkhir = cJurnalw + 2
    const cHuruf = cNilaiAkhir + 1
    const totalCols = cHuruf + 1

    const groupHeader: string[] = new Array(totalCols).fill('')
    groupHeader[0] = 'No'; groupHeader[1] = 'NIM'; groupHeader[2] = 'Nama'; groupHeader[3] = 'Asisten'
    groupHeader[cTRStart] = 'Tugas Rumah'
    groupHeader[cTAStart] = 'Test Awal'
    groupHeader[cPStart] = 'Praktikum (Aktif & Etika)'
    groupHeader[cLPStart] = 'Laporan'
    groupHeader[cUAP] = 'UAP'
    groupHeader[cJurnal] = 'Jurnal'
    groupHeader[cLulusTA] = 'Nilai Kumulatif'
    groupHeader[cNilaiAkhir] = 'Nilai Akhir (100%)'
    groupHeader[cHuruf] = 'Huruf Nilai Akhir'

    const subHeader: string[] = new Array(totalCols).fill('')
    for (let i = 0; i < n; i++) subHeader[cTRStart + i] = `TR${i + 1}`
    for (let i = 0; i < n; i++) subHeader[cTAStart + i] = `TA${i + 1}`
    for (let i = 0; i < n; i++) subHeader[cPStart + i] = `P${i + 1}`
    for (let i = 0; i < n; i++) subHeader[cLPStart + i] = `LP${i + 1}`
    subHeader[cLulusTA] = 'Lulus Tes Awal'
    subHeader[cTRavg] = 'Tugas Rumah'
    subHeader[cTRw] = 'Tugas Rumah (10%)'
    subHeader[cTAavg] = 'Tes Awal'
    subHeader[cTAw] = 'Tes Awal (10%)'
    subHeader[cPavg] = 'Keaktifan'
    subHeader[cPw] = 'Keaktifan (20%)'
    subHeader[cLPavg] = 'Laporan'
    subHeader[cLPw] = 'Laporan (20%)'
    subHeader[cUAPraw] = 'UAP'
    subHeader[cUAPw] = 'UAP (25%)'
    subHeader[cJurnalraw] = 'Jurnal'
    subHeader[cJurnalw] = 'Jurnal (15%)'

    const aoa: (string | number)[][] = [
      ['SEMESTER', ': '],
      ['KODE MK', `: ${gradeFilter.practicum}`],
      ['NAMA MK', `: PRAK. ${praktikumLabel}`],
      ['KELAS', `: ${gradeFilter.kelas || 'Semua Kelas'}`],
      [],
      ['JUMLAH PESERTA', `: ${nilaiData.anggota.length}`],
      [],
      groupHeader,
      subHeader,
    ]

    const dataStartRow = aoa.length
    nilaiData.anggota.forEach((a, i) => {
      const row: (string | number)[] = new Array(totalCols).fill('')
      row[0] = i + 1
      row[1] = a.nim
      row[2] = a.nama_praktikan
      row[3] = ''
      pertemuanReguler.forEach((p, idx) => { row[cTRStart + idx] = getNilai(a.id, a.kelompok_id, 'pertemuan', p.urutan_ke, 'TR') })
      pertemuanReguler.forEach((p, idx) => { row[cTAStart + idx] = getNilai(a.id, a.kelompok_id, 'pertemuan', p.urutan_ke, 'TA') })
      pertemuanReguler.forEach((p, idx) => { row[cPStart + idx] = getNilai(a.id, a.kelompok_id, 'pertemuan', p.urutan_ke, 'P') })
      pertemuanReguler.forEach((p, idx) => { row[cLPStart + idx] = getNilai(a.id, a.kelompok_id, 'pertemuan', p.urutan_ke, 'LP') })
      row[cUAP] = pertemuanUap ? getNilai(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, 'UAP') : ''
      row[cJurnal] = pertemuanUap ? getNilai(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, 'JURNAL') : ''
      aoa.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(aoa)

    const trRange = () => `${colLetter(cTRStart)}R:${colLetter(cTRStart + n - 1)}R`
    const taRange = () => `${colLetter(cTAStart)}R:${colLetter(cTAStart + n - 1)}R`
    const pRange = () => `${colLetter(cPStart)}R:${colLetter(cPStart + n - 1)}R`
    const lpRange = () => `${colLetter(cLPStart)}R:${colLetter(cLPStart + n - 1)}R`

    for (let i = 0; i < nilaiData.anggota.length; i++) {
      const r = dataStartRow + i + 1
      const set = (c: number, formula: string) => {
        const ref = `${colLetter(c)}${r}`
        ws[ref] = { t: 'n', f: formula.replace(/R/g, String(r)) }
      }
      set(cLulusTA, `COUNTIF(${taRange()},">=65")`)
      set(cTRavg, `IFERROR(AVERAGE(${trRange()}),0)`)
      set(cTRw, `0.1*${colLetter(cTRavg)}${r}`)
      set(cTAavg, `IFERROR(AVERAGE(${taRange()}),0)`)
      set(cTAw, `0.1*${colLetter(cTAavg)}${r}`)
      // Keaktifan (DSK) = (-5+15+20+(70*5)+SUM(P1..Pn)*5) / n  ->  (380 + SUM(P)*5) / n
      set(cPavg, `(380+SUM(${pRange()})*5)/${n}`)
      set(cPw, `0.2*${colLetter(cPavg)}${r}`)
      set(cLPavg, `IFERROR(AVERAGE(${lpRange()}),0)`)
      set(cLPw, `0.2*${colLetter(cLPavg)}${r}`)
      // N(...) mengubah sel kosong/belum dinilai jadi 0, supaya tidak #VALUE! saat dikali bobot
      set(cUAPraw, `N(${colLetter(cUAP)}${r})`)
      set(cUAPw, `0.25*${colLetter(cUAPraw)}${r}`)
      set(cJurnalraw, `N(${colLetter(cJurnal)}${r})`)
      set(cJurnalw, `0.15*${colLetter(cJurnalraw)}${r}`)
      set(cNilaiAkhir, `IFERROR(INT(${colLetter(cTRw)}${r}+${colLetter(cTAw)}${r}+${colLetter(cPw)}${r}+${colLetter(cLPw)}${r}+${colLetter(cUAPw)}${r}+${colLetter(cJurnalw)}${r}),0)`)
      ws[`${colLetter(cHuruf)}${r}`] = {
        t: 'str',
        f: `IFERROR(IF(${colLetter(cNilaiAkhir)}${r}>=81,"A",IF(${colLetter(cNilaiAkhir)}${r}>=76,"A-",IF(${colLetter(cNilaiAkhir)}${r}>=72,"B+",IF(${colLetter(cNilaiAkhir)}${r}>=68,"B",IF(${colLetter(cNilaiAkhir)}${r}>=64,"B-",IF(${colLetter(cNilaiAkhir)}${r}>=60,"C+",IF(${colLetter(cNilaiAkhir)}${r}>=56,"C",IF(${colLetter(cNilaiAkhir)}${r}>=41,"D","E")))))))),"-")`,
      }
    }

    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = []
    const headerRow0 = aoa.length - nilaiData.anggota.length - 2
    const headerRow1 = headerRow0 + 1
    const mergeGroup = (startCol: number, span: number) => {
      if (span > 1) merges.push({ s: { r: headerRow0, c: startCol }, e: { r: headerRow0, c: startCol + span - 1 } })
    }
    mergeGroup(cTRStart, n); mergeGroup(cTAStart, n); mergeGroup(cPStart, n); mergeGroup(cLPStart, n)
    mergeGroup(cLulusTA, cJurnalw - cLulusTA + 1)
      ;[0, 1, 2, 3, cUAP, cJurnal, cNilaiAkhir, cHuruf].forEach((c) => {
        merges.push({ s: { r: headerRow0, c }, e: { r: headerRow1, c } })
      })
    ws['!merges'] = merges
    ws['!cols'] = new Array(totalCols).fill({ wch: 9 })

    const wb = XLSX.utils.book_new()
    const sheetName = `${gradeFilter.practicum} ${gradeFilter.kelas || ''}`.trim().slice(0, 31) || 'Nilai'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `Nilai_${gradeFilter.practicum}_${gradeFilter.kelas || 'semua'}.xlsx`)
  }

  // --- Export khusus PLC: replika presisi format resmi TEMPLATE_PENILAIAN PLC (lihat contoh
  // NILAI_PLC_TE_A.xlsx) — tabel ID Dosen, warna kelompok kolom, border, dan rumus Nilai
  // Kumulatif persis seperti file aslinya, tapi jumlah kolom TR/TA/P/M/Video MENGIKUTI JUMLAH
  // PERTEMUAN SEBENARNYA (n = pertemuanReguler.length, otomatis menyesuaikan jadwal kelompok
  // masing-masing) — bukan slot tetap 5/4/6/5/4. (pakai xlsx-js-style karena SheetJS versi
  // gratis tidak bisa menulis fill/border/font).
  const handleExportExcelPLC = ({
    pertemuanReguler, pertemuanUap, getNilai,
  }: {
    pertemuanReguler: { urutan_ke: number | null; jenis: string; label: string }[]
    pertemuanUap?: { urutan_ke: number | null; jenis: string; label: string }
    getNilai: (anggotaId: string, kelompokId: string, jenis: string, urutanKe: number | null, kode: string) => number | ''
  }) => {
    if (!nilaiData) return
    const n = pertemuanReguler.length || 1
    const L = (i: number) => XLSXStyle.utils.encode_col(i)
    const THIN = { style: 'thin', color: { rgb: '000000' } }
    const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN }
    const YELLOW = 'FFFDE49A', GREEN_GROUP = 'FFA6E3B6', GRAY = 'FFF0F4F9', PASS = 'FFCCFFCC', FAIL = 'FFFFCCCC'
    const font = (bold = false) => ({ name: 'Times New Roman', sz: 12, bold })
    const sHeader = (fill?: string) => ({ font: font(true), border: BORDER, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, ...(fill ? { fill: { patternType: 'solid', fgColor: { rgb: fill } } } : {}) })
    const sData = (fill?: string, align: 'center' | 'left' = 'center') => ({ font: font(false), border: BORDER, alignment: { horizontal: align, vertical: 'center' }, ...(fill ? { fill: { patternType: 'solid', fgColor: { rgb: fill } } } : {}) })
    const sPlain = (bold = false) => ({ font: font(bold), alignment: { wrapText: true, vertical: 'center' } })

    // Kolom (0-based), semua blok TR/TA/P/M/Video berukuran n (dinamis sesuai jadwal):
    // 0 No,1 NIM,2 Nama,3 Asisten, lalu TR(n),TA(n),P(n,Keaktifan skala 0-5),M(n),Video(n),
    // UAP(raw),Laporan,Poster,Presentasi,Kehadiran, spacer, Nilai Kumulatif(8 kolom),
    // Nilai Akhir, Huruf Nilai Akhir.
    const cTR = 4
    const cTA = cTR + n
    const cKA = cTA + n // Keaktifan / Praktikum (Aktif & Etika), P1..Pn
    const cM = cKA + n
    const cVID = cM + n
    const cUAPraw = cVID + n
    const cLap = cUAPraw + 1
    const cPos = cLap + 1
    const cPre = cPos + 1
    const cHadir = cPre + 1
    const cSpacer = cHadir + 1
    const cLulusTA = cSpacer + 1
    const cKumTR = cLulusTA + 1
    const cKumTA = cKumTR + 1
    const cKumKA = cKumTA + 1
    const cKumM = cKumKA + 1
    const cKumVID = cKumM + 1
    const cKumUAP = cKumVID + 1
    const cKumLap = cKumUAP + 1
    const cAkhir = cKumLap + 1
    const cHuruf = cAkhir + 1
    const totalCols = cHuruf + 1

    const kelasInfo = nilaiData.kelas.find((k) => k.nama_kelas === gradeFilter.kelas) || (nilaiData.kelas.length === 1 ? nilaiData.kelas[0] : null)

    const groupHeader: string[] = new Array(totalCols).fill('')
    groupHeader[0] = 'No'; groupHeader[1] = 'NIM'; groupHeader[2] = 'Nama'; groupHeader[3] = 'Asisten'
    groupHeader[cTR] = 'Tugas Rumah'
    groupHeader[cTA] = 'Test Awal'
    groupHeader[cKA] = 'Praktikum (Aktif & Etika)'
    groupHeader[cM] = 'Tugas Akhir Modul'
    groupHeader[cVID] = 'Video Kreasi'
    groupHeader[cLap] = 'Laporan Praktikum (Kelompok)'
    groupHeader[cHadir] = 'Kehadiran'
    groupHeader[cLulusTA] = 'Nilai Kumulatif'
    groupHeader[cAkhir] = 'Nilai Akhir'
    groupHeader[cHuruf] = 'Huruf Nilai Akhir'

    const subHeader: string[] = new Array(totalCols).fill('')
    for (let i = 0; i < n; i++) subHeader[cTR + i] = `TR${i + 1}`
    for (let i = 0; i < n; i++) subHeader[cTA + i] = `TA${i + 1}`
    for (let i = 0; i < n; i++) subHeader[cKA + i] = `P${i + 1}`
    for (let i = 0; i < n; i++) subHeader[cM + i] = `M${i + 1}`
    for (let i = 0; i < n; i++) subHeader[cVID + i] = `Minggu ${i + 1}`
      ;['Laporan', 'Poster', 'Presentasi'].forEach((v, i) => { subHeader[cLap + i] = v })
      ;['Lulus Tes Awal', 'Tugas Rumah', 'Tes Awal', 'Keaktifan', 'TA Modul', 'Vid Kreasi', 'UAP', 'Lap Kelompok'].forEach((v, i) => { subHeader[cLulusTA + i] = v })
    subHeader[cUAPraw] = 'UAP'

    const aoa: (string | number)[][] = [
      ['SEMESTER', ': '],
      ['KODE MK', `: ${gradeFilter.practicum}`],
      ['NAMA MK', ': PRAK. Programmable Logic Controller'],
      ['KELAS', `: ${gradeFilter.kelas || 'Semua Kelas'}`],
      ['HARI/JAM', ': ', '', '', 'ID DOSEN', 'NAMA DOSEN'],
      ['JUMLAH PESERTA', `: ${nilaiData.anggota.length}`, '', '', kelasInfo?.id_dosen || '', kelasInfo?.dosen_pengampu || ''],
      [],
      [],
      groupHeader,
      subHeader,
    ]

    const dataStartRow0 = aoa.length // index baris data pertama (0-based, dalam aoa)
    const getVals = (a: NilaiAnggota, kode: string) =>
      pertemuanReguler.map((p) => getNilai(a.id, a.kelompok_id, 'pertemuan', p.urutan_ke, kode))

    nilaiData.anggota.forEach((a) => {
      const row: (string | number)[] = new Array(totalCols).fill('')
      row[1] = a.nim
      row[2] = a.nama_praktikan
      getVals(a, 'TR').forEach((v, i) => { row[cTR + i] = v })
      getVals(a, 'TA').forEach((v, i) => { row[cTA + i] = v })
      getVals(a, 'P').forEach((v, i) => { row[cKA + i] = v })
      getVals(a, 'M').forEach((v, i) => { row[cM + i] = v })
      getVals(a, 'VID').forEach((v, i) => { row[cVID + i] = v })
      row[cUAPraw] = pertemuanUap ? getNilai(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, 'UAP') : ''
      row[cLap] = pertemuanUap ? getNilai(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, 'LAPORAN') : ''
      row[cPos] = pertemuanUap ? getNilai(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, 'POSTER') : ''
      row[cPre] = pertemuanUap ? getNilai(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, 'PRESENTASI') : ''
      row[cHadir] = pertemuanUap ? getNilai(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, 'KEHADIRAN') : ''
      aoa.push(row)
    })

    const ws = XLSXStyle.utils.aoa_to_sheet(aoa)

    nilaiData.anggota.forEach((a, idx) => {
      const r = dataStartRow0 + idx + 1 // nomor baris Excel (1-based)
      ws[`${L(0)}${r}`] = { t: 'n', v: idx + 1, s: sData() }

      const set = (c: number, formula: string, style: any) => { ws[`${L(c)}${r}`] = { t: 'n', f: formula, s: style } }
      const rng = (start: number) => `${L(start)}${r}:${L(start + n - 1)}${r}`

      const taVals = getVals(a, 'TA')
      const lulusCount = taVals.filter((v) => typeof v === 'number' && v >= 65).length
      const lulusFill = lulusCount > 2 ? PASS : lulusCount < 2 ? FAIL : GRAY

      // Rumus (n = jumlah pertemuan aktual, otomatis menyesuaikan jadwal kelompok).
      // IFERROR/N() dipakai supaya nilai yang BELUM diisi asisten (kosong) tidak bikin
      // #VALUE! menjalar ke Nilai Akhir & Huruf — sel kosong dihitung sebagai 0.
      set(cLulusTA, `COUNTIF(${rng(cTA)},">=65")`, sData(lulusFill))
      set(cKumTR, `IFERROR(AVERAGE(${rng(cTR)}),0)`, sData(GRAY))
      set(cKumTA, `IFERROR(AVERAGE(${rng(cTA)}),0)`, sData(GRAY))
      // Keaktifan = ((70*5) + SUM(P1..Pn)*6) / n  (P berskala 0-5, lihat input di Kelola Nilai)
      set(cKumKA, `((70*5)+SUM(${rng(cKA)})*6)/${n}`, sData(GRAY))
      set(cKumM, `IFERROR(AVERAGE(${rng(cM)}),0)`, sData(GRAY))
      set(cKumVID, `IFERROR(AVERAGE(${rng(cVID)}),0)`, sData(GRAY))
      set(cKumUAP, `N(${L(cUAPraw)}${r})`, sData(GRAY))
      set(cKumLap, `(N(${L(cLap)}${r})*(10/35))+(N(${L(cPos)}${r})*(10/35))+(N(${L(cPre)}${r})*(15/35))`, sData(GRAY))
      set(
        cAkhir,
        `IFERROR(INT((${L(cKumTR)}${r}*0.05)+(${L(cKumTA)}${r}*0.05)+(${L(cKumKA)}${r}*0.1)+(${L(cKumM)}${r}*0.08)+(${L(cKumVID)}${r}*0.07)+(${L(cKumUAP)}${r}*0.2)+(N(${L(cLap)}${r})*0.1)+(N(${L(cPos)}${r})*0.1)+(N(${L(cPre)}${r})*0.15)+(N(${L(cHadir)}${r})*0.1)),0)`,
        sData()
      )
      ws[`${L(cHuruf)}${r}`] = {
        t: 'str',
        f: `IFERROR(IF(${L(cAkhir)}${r}>=81,"A",IF(${L(cAkhir)}${r}>=76,"A-",IF(${L(cAkhir)}${r}>=72,"B+",IF(${L(cAkhir)}${r}>=68,"B",IF(${L(cAkhir)}${r}>=64,"B-",IF(${L(cAkhir)}${r}>=60,"C+",IF(${L(cAkhir)}${r}>=56,"C",IF(${L(cAkhir)}${r}>=41,"D","E")))))))),"-")`,
        s: sData(),
      }

      // Style kolom nilai mentah sesuai warna kelompok (kuning/hijau berselang-seling)
      for (let i = 0; i < n; i++) ws[`${L(cTR + i)}${r}`] = { ...(ws[`${L(cTR + i)}${r}`] || { t: 'n', v: '' }), s: sData(YELLOW) }
      for (let i = 0; i < n; i++) ws[`${L(cTA + i)}${r}`] = { ...(ws[`${L(cTA + i)}${r}`] || { t: 'n', v: '' }), s: sData(GREEN_GROUP) }
      for (let i = 0; i < n; i++) ws[`${L(cKA + i)}${r}`] = { ...(ws[`${L(cKA + i)}${r}`] || { t: 'n', v: '' }), s: sData(YELLOW) }
      for (let i = 0; i < n; i++) ws[`${L(cM + i)}${r}`] = { ...(ws[`${L(cM + i)}${r}`] || { t: 'n', v: '' }), s: sData(GREEN_GROUP) }
      for (let i = 0; i < n; i++) ws[`${L(cVID + i)}${r}`] = { ...(ws[`${L(cVID + i)}${r}`] || { t: 'n', v: '' }), s: sData(YELLOW) }
      ws[`${L(cUAPraw)}${r}`] = { ...(ws[`${L(cUAPraw)}${r}`] || { t: 'n', v: '' }), s: sData(YELLOW) }
      for (let i = 0; i < 3; i++) ws[`${L(cLap + i)}${r}`] = { ...(ws[`${L(cLap + i)}${r}`] || { t: 'n', v: '' }), s: sData(GREEN_GROUP) }
      ws[`${L(cHadir)}${r}`] = { ...(ws[`${L(cHadir)}${r}`] || { t: 'n', v: '' }), s: sData(YELLOW) }
      ws[`${L(1)}${r}`] = { ...(ws[`${L(1)}${r}`] || { t: 's', v: '' }), s: sData(undefined, 'center') }
      ws[`${L(2)}${r}`] = { ...(ws[`${L(2)}${r}`] || { t: 's', v: '' }), s: sData(undefined, 'left') }
      ws[`${L(3)}${r}`] = { t: 's', v: '', s: sData() }
    })

      // Style header block (baris info + tabel ID Dosen) & header tabel
      ;['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].forEach((addr, i) => {
        ws[addr] = { ...(ws[addr] || { t: 's', v: '' }), s: sPlain(true) }
        const bAddr = `B${i + 1}`
        ws[bAddr] = { ...(ws[bAddr] || { t: 's', v: '' }), s: sPlain(false) }
      })
      ;['E5', 'F5'].forEach((addr) => { ws[addr] = { ...(ws[addr] || {}), s: sHeader() } })
      ;['E6', 'F6'].forEach((addr) => { ws[addr] = { ...(ws[addr] || { t: 's', v: '' }), s: sData() } })

    const headerRow0 = dataStartRow0 - 2 // baris ke-9 (index 8)
    const headerRow1 = headerRow0 + 1
    const inGroup = (c: number, start: number, span: number) => c >= start && c < start + span
    for (let c = 0; c < totalCols; c++) {
      const addr0 = `${L(c)}${headerRow0 + 1}`
      const addr1 = `${L(c)}${headerRow1 + 1}`
      const fill = inGroup(c, cTR, n) || inGroup(c, cKA, n) || inGroup(c, cVID, n + 1) || c === cHadir
        ? YELLOW
        : inGroup(c, cTA, n) || inGroup(c, cM, n) || inGroup(c, cLap, 3)
          ? GREEN_GROUP
          : undefined
      ws[addr0] = { ...(ws[addr0] || { t: 's', v: '' }), s: sHeader(fill) }
      ws[addr1] = { ...(ws[addr1] || { t: 's', v: '' }), s: sHeader(fill) }
    }

    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [
      { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } }, // NAMA DOSEN header F5:H5
      { s: { r: 5, c: 5 }, e: { r: 5, c: 7 } }, // NAMA DOSEN value F6:H6
    ]
    const mergeGroup = (start: number, span: number) => {
      if (span > 1) merges.push({ s: { r: headerRow0, c: start }, e: { r: headerRow0, c: start + span - 1 } })
    }
    mergeGroup(cTR, n); mergeGroup(cTA, n); mergeGroup(cKA, n); mergeGroup(cM, n); mergeGroup(cVID, n + 1); mergeGroup(cLap, 3)
    mergeGroup(cLulusTA, cKumLap - cLulusTA + 1)
      ;[0, 1, 2, 3, cHadir, cAkhir, cHuruf].forEach((c) => {
        merges.push({ s: { r: headerRow0, c }, e: { r: headerRow1, c } })
      })
    ws['!merges'] = merges

    ws['!cols'] = new Array(totalCols).fill({ wch: 8.5 })
    ws['!cols'][2] = { wch: 28 } // Nama
    ws['!cols'][3] = { wch: 12 } // Asisten
    ws['!cols'][1] = { wch: 12 } // NIM
    ws['!cols'][cSpacer] = { wch: 2 }
    ws['!cols'][cAkhir] = { wch: 11 }
    ws['!cols'][cHuruf] = { wch: 13 }

    const wb = XLSXStyle.utils.book_new()
    const sheetName = `PLC ${gradeFilter.kelas || 'Semua'}`.trim().slice(0, 31)
    XLSXStyle.utils.book_append_sheet(wb, ws, sheetName)
    XLSXStyle.writeFile(wb, `Nilai_PLC_${gradeFilter.kelas || 'semua'}.xlsx`)
  }


  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)

  // --- Berita/Pengumuman: data real dari tabel `berita` lewat /api/berita (bukan mock) ---
  interface BeritaRow {
    id: string
    judul: string
    isi: string
    kategori: 'pengumuman' | 'info' | 'kegiatan'
    tanggal_terbit: string
    is_published: boolean
    penulis: string | null
  }
  const [announcement, setAnnouncement] = useState({ title: '', content: '', date: new Date().toISOString().slice(0, 10), kategori: 'info' as BeritaRow['kategori'], publishNow: true })
  const [announcementSent, setAnnouncementSent] = useState(false)
  const [announcementSaving, setAnnouncementSaving] = useState(false)
  const [announcementError, setAnnouncementError] = useState<string | null>(null)
  const [beritaList, setBeritaList] = useState<BeritaRow[]>([])
  const [beritaLoading, setBeritaLoading] = useState(false)

  const fetchBeritaList = useCallback(async () => {
    setBeritaLoading(true)
    try {
      const res = await fetch('/api/berita?scope=all')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat daftar berita')
      setBeritaList(json.berita || [])
    } catch {
      setBeritaList([])
    } finally {
      setBeritaLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSection === 'announcement') fetchBeritaList()
  }, [activeSection, fetchBeritaList])

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    setAnnouncementSaving(true)
    setAnnouncementError(null)
    try {
      const res = await fetch('/api/berita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: announcement.title,
          isi: announcement.content,
          kategori: announcement.kategori,
          tanggal_terbit: announcement.date,
          is_published: announcement.publishNow,
          ditulis_oleh: user.id || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan berita')
      setAnnouncementSent(true)
      fetchBeritaList()
    } catch (err: any) {
      setAnnouncementError(err.message || 'Gagal menyimpan berita')
    } finally {
      setAnnouncementSaving(false)
    }
  }

  const handleTogglePublish = async (row: BeritaRow) => {
    setBeritaList((prev) => prev.map((b) => (b.id === row.id ? { ...b, is_published: !b.is_published } : b)))
    try {
      const res = await fetch('/api/berita', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, is_published: !row.is_published }),
      })
      if (!res.ok) throw new Error()
    } catch {
      fetchBeritaList()
    }
  }

  const handleDeleteBerita = async (row: BeritaRow) => {
    if (!confirm(`Hapus berita "${row.judul}"?`)) return
    setBeritaList((prev) => prev.filter((b) => b.id !== row.id))
    try {
      const res = await fetch(`/api/berita?id=${row.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      fetchBeritaList()
    }
  }

  // --- Absensi & Scan QR: data real dari database (bukan mock), lewat /api/absensi ---
  // Filter: Jurusan -> Praktikum -> Jadwal Praktikum (Pengarahan/Pertemuan-n/Presentasi/UAP) -> Kelas
  const [scanFilter, setScanFilter] = useState({ jurusan: '', practicum: '' })
  const [scanJadwalKey, setScanJadwalKey] = useState(jadwalKey(JADWAL_OPTIONS[2])) // default: Pertemuan 2
  const [scanKelasOptions, setScanKelasOptions] = useState<{ id: string; nama_kelas: string }[]>([])
  const [scanKelasLoading, setScanKelasLoading] = useState(false)
  const [scanKelas, setScanKelas] = useState('')
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null)
  const [scanTaskError, setScanTaskError] = useState<string | null>(null)

  const selectedJadwal = JADWAL_OPTIONS.find((j) => jadwalKey(j) === scanJadwalKey) || JADWAL_OPTIONS[2]
  const scanJurusanObj = jurusanList.find((j) => j.kode === scanFilter.jurusan)
  const scanPracticumUnavailable =
    !!scanFilter.jurusan && !!scanFilter.practicum && !scanJurusanObj?.praktikum.some((p) => p.kode === scanFilter.practicum)

  useEffect(() => {
    setScanKelas('')
    if (!scanFilter.practicum || scanPracticumUnavailable) {
      setScanKelasOptions([])
      return
    }
    setScanKelasLoading(true)
    fetch(`/api/kelas-praktikum?praktikum=${scanFilter.practicum}&jurusan=${scanFilter.jurusan}`)
      .then((r) => r.json())
      .then((json) => setScanKelasOptions(json.kelas || []))
      .catch(() => setScanKelasOptions([]))
      .finally(() => setScanKelasLoading(false))
  }, [scanFilter.practicum, scanFilter.jurusan, scanPracticumUnavailable])

  interface AbsensiRosterRow {
    anggota_kelompok_id: string
    nama: string
    nim: string
    kelompok_id: string
    nama_kelompok: string
    nama_kelas: string
    pertemuan_id: string | null
    status: 'H' | 'I' | 'S' | 'A' | null
    waktu_absen: string | null
    metode: string | null
    hasAccount?: boolean
  }
  const [attendanceRoster, setAttendanceRoster] = useState<AbsensiRosterRow[]>([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)

  const fetchAttendanceRoster = useCallback(async () => {
    if (!scanFilter.practicum || scanPracticumUnavailable) {
      setAttendanceRoster([])
      return
    }
    setAttendanceLoading(true)
    setAttendanceError(null)
    try {
      const qs = new URLSearchParams({ praktikum: scanFilter.practicum, jenis: selectedJadwal.jenis })
      if (scanFilter.jurusan) qs.set('jurusan', scanFilter.jurusan)
      if (selectedJadwal.urutan_ke !== null) qs.set('urutan_ke', String(selectedJadwal.urutan_ke))
      if (scanKelas) qs.set('kelas_praktikum_id', scanKelas)
      const res = await fetch(`/api/absensi?${qs.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data absensi')
      setAttendanceRoster(json.roster || [])
    } catch (err: any) {
      setAttendanceError(err.message || 'Gagal memuat data absensi')
      setAttendanceRoster([])
    } finally {
      setAttendanceLoading(false)
    }
  }, [scanFilter.practicum, scanFilter.jurusan, scanPracticumUnavailable, scanKelas, selectedJadwal.jenis, selectedJadwal.urutan_ke])

  useEffect(() => {
    if (activeSection === 'attendance') fetchAttendanceRoster()
  }, [activeSection, fetchAttendanceRoster])

  // Tombol H/I/S/A manual di tabel rekap -> langsung tersimpan ke database (optimistic update).
  // anggotaKelompokId yang sedang dalam proses simpan ditandai di sini supaya tombolnya sendiri
  // yang menunjukkan status "menyimpan...", TANPA mengganti seluruh tabel rekap dengan spinner.
  const [savingAttendanceIds, setSavingAttendanceIds] = useState<Set<string>>(new Set())

  const handleManualAttendance = async (row: AbsensiRosterRow, status: 'H' | 'I' | 'S' | 'A') => {
    if (!row.pertemuan_id) return
    const previousStatus = row.status
    setAttendanceError(null)
    setSavingAttendanceIds((prev) => new Set(prev).add(row.anggota_kelompok_id))
    setAttendanceRoster((prev) => prev.map((r) => (r.anggota_kelompok_id === row.anggota_kelompok_id ? { ...r, status } : r)))
    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'manual', anggota_kelompok_id: row.anggota_kelompok_id, pertemuan_id: row.pertemuan_id, status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan absensi')
    } catch (err: any) {
      // Gagal simpan -> kembalikan status baris ini SAJA ke nilai semula. Sebelumnya di sini
      // memanggil fetchAttendanceRoster() yang me-reload SELURUH tabel (mengganti tabel dengan
      // spinner), sehingga kelihatan seperti "nyangkut loading" padahal itu proses pembatalan.
      setAttendanceRoster((prev) =>
        prev.map((r) => (r.anggota_kelompok_id === row.anggota_kelompok_id ? { ...r, status: previousStatus } : r))
      )
      setAttendanceError(err.message || 'Gagal menyimpan absensi. Coba lagi.')
    } finally {
      setSavingAttendanceIds((prev) => {
        const next = new Set(prev)
        next.delete(row.anggota_kelompok_id)
        return next
      })
    }
  }

  // Ekspor rekap absensi LENGKAP: satu kolom per jadwal (Pengarahan, Pertemuan-1..n, Presentasi
  // untuk PLC / UAP untuk DSK) — bukan cuma sesi yang sedang dipilih di layar Scan QR.
  // Hadir = centang (✓), Izin/Sakit/Alfa ditulis teks, belum tercatat = "-".
  const handleExportAbsensiExcel = async () => {
    if (!scanFilter.practicum || scanPracticumUnavailable) return
    try {
      const qs = new URLSearchParams({ mode: 'full', praktikum: scanFilter.practicum })
      if (scanFilter.jurusan) qs.set('jurusan', scanFilter.jurusan)
      if (scanKelas) qs.set('kelas_praktikum_id', scanKelas)
      const res = await fetch(`/api/absensi?${qs.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat rekap absensi')

      const columns: { jenis: string; urutan_ke: number | null; label: string }[] = json.columns || []
      const roster: { anggota_kelompok_id: string; nama: string; nim: string; nama_kelompok: string; nama_kelas: string; attendance: Record<string, string | null> }[] = json.roster || []
      const colKey = (jenis: string, urutan_ke: number | null) => `${jenis}|${urutan_ke}`
      const statusLabel = (s: string | null) => (s === 'H' ? '\u2713' : s === 'I' ? 'Izin' : s === 'S' ? 'Sakit' : s === 'A' ? 'Alfa' : '-')

      const praktikumObj = jurusanList.flatMap((j) => j.praktikum).find((p) => p.kode === scanFilter.practicum)
      const praktikumLabel = praktikumObj?.nama || (scanFilter.practicum === 'DSK' ? 'Dasar Sistem Kontrol' : scanFilter.practicum === 'PLC' ? 'Programmable Logic Controller' : scanFilter.practicum === 'SKI' ? 'Sistem Kontrol Industri' : scanFilter.practicum)
      const namaKelas = scanKelasOptions.find((k) => k.id === scanKelas)?.nama_kelas || 'Semua Kelas'

      const THIN = { style: 'thin', color: { rgb: '000000' } }
      const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN }
      const font = (bold = false) => ({ name: 'Calibri', sz: 11, bold })
      const sHeader = () => ({ font: font(true), border: BORDER, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, fill: { patternType: 'solid', fgColor: { rgb: 'FFEDE9FE' } } })
      const sData = (align: 'center' | 'left' = 'center', color?: string) => ({ font: { ...font(color ? true : false), color: color ? { rgb: color } : undefined }, border: BORDER, alignment: { horizontal: align, vertical: 'center' } })

      const header = ['No', 'Nama', 'NIM', 'Kelompok', 'Kelas', ...columns.map((c) => c.label)]
      const aoa: (string | number)[][] = [
        ['SEMESTER', ': '],
        ['KODE MK', `: ${scanFilter.practicum}`],
        ['NAMA MK', `: PRAK. ${praktikumLabel}`],
        ['KELAS', `: ${namaKelas}`],
        ['HARI/JAM', ': '],
        ['JUMLAH PESERTA', `: ${roster.length}`],
        [],
        header,
      ]

      roster.forEach((r, i) => {
        aoa.push([
          i + 1, r.nama, r.nim, r.nama_kelompok, r.nama_kelas,
          ...columns.map((c) => statusLabel(r.attendance[colKey(c.jenis, c.urutan_ke)])),
        ])
      })

      const ws = XLSXStyle.utils.aoa_to_sheet(aoa)
      const totalCols = header.length
      const headerRowNumber = 8
      const dataStartRowNumber = 9

      // Header row styling
      for (let c = 0; c < totalCols; c++) {
        const addr = `${XLSXStyle.utils.encode_col(c)}${headerRowNumber}`
        ws[addr] = { ...(ws[addr] || { t: 's', v: '' }), s: sHeader() }
      }

      // Metadata block styling (Rows 1-6)
      for (let r = 1; r <= 6; r++) {
        const addrA = `A${r}`
        const addrB = `B${r}`
        if (ws[addrA]) ws[addrA].s = { font: font(true), alignment: { horizontal: 'left', vertical: 'center' } }
        if (ws[addrB]) ws[addrB].s = { font: font(false), alignment: { horizontal: 'left', vertical: 'center' } }
      }

      // Data rows styling
      roster.forEach((r, i) => {
        const row = dataStartRowNumber + i
        ws[`A${row}`] = { t: 'n', v: i + 1, s: sData() }
        ws[`B${row}`] = { ...(ws[`B${row}`] || { t: 's', v: '' }), s: sData('left') }
        ws[`C${row}`] = { ...(ws[`C${row}`] || { t: 's', v: '' }), s: sData() }
        ws[`D${row}`] = { ...(ws[`D${row}`] || { t: 's', v: '' }), s: sData() }
        ws[`E${row}`] = { ...(ws[`E${row}`] || { t: 's', v: '' }), s: sData() }
        columns.forEach((c, ci) => {
          const status = r.attendance[colKey(c.jenis, c.urutan_ke)]
          const color = status === 'H' ? '059669' : status === 'A' ? 'DC2626' : status === 'S' ? '2563EB' : status === 'I' ? 'D97706' : '94A3B8'
          const addr = `${XLSXStyle.utils.encode_col(5 + ci)}${row}`
          ws[addr] = { ...(ws[addr] || { t: 's', v: '' }), s: sData('center', color) }
        })
      })

      ws['!cols'] = [
        { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
        ...columns.map(() => ({ wch: 12 })),
      ]
      ws['!freeze'] = { xSplit: 0, ySplit: headerRowNumber }

      const wb = XLSXStyle.utils.book_new()
      const sheetName = `Absensi ${scanFilter.practicum} ${scanKelasOptions.find((k) => k.id === scanKelas)?.nama_kelas || 'Semua'}`.trim().slice(0, 31)
      XLSXStyle.utils.book_append_sheet(wb, ws, sheetName)
      XLSXStyle.writeFile(wb, `Rekap_Absensi_${scanFilter.practicum}_${scanKelas ? scanKelasOptions.find((k) => k.id === scanKelas)?.nama_kelas : 'semua'}.xlsx`)
    } catch (err: any) {
      setAttendanceError(err.message || 'Gagal mengekspor rekap absensi')
    }
  }

  const sidebarLinks = [
    { id: 'home', label: 'Beranda', icon: 'home' },
    { id: 'students', label: 'Data Praktikan', icon: 'users' },
    { id: 'grades', label: 'Kelola Nilai', icon: 'bar-chart' },
    { id: 'attendance', label: 'Absensi & QR', icon: 'smartphone' },
    { id: 'import', label: 'Import Praktikan', icon: 'inbox' },
    { id: 'profile', label: 'Profil Kontak', icon: 'user' },
    { id: 'announcement', label: 'Buat Berita', icon: 'megaphone' },
  ]

  // Statistik kartu Beranda: data real dari Supabase (RPC get_asisten_dashboard_stats),
  // default 0 sesaat sebelum data selesai dimuat.
  const [homeStats, setHomeStats] = useState({
    kelompokDiampu: 0,
    totalPraktikan: 0,
    pertemuanSelesai: 0,
    pertemuanTotal: 0,
    nilaiBelumInput: 0,
  })
  useEffect(() => {
    if (!user.id) return
    fetch(`/api/asisten-stats?id=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.stats) setHomeStats(json.stats)
      })
      .catch(() => {})
  }, [user.id])

  const [showScanner, setShowScanner] = useState(false)

  const handleOpenScanner = () => {
    if (!scanFilter.jurusan || !scanFilter.practicum) {
      setScanTaskError('Pilih Jurusan & Praktikum terlebih dahulu sebelum mulai scan.')
      return
    }
    setScanResult(null)
    setScanTaskError(null)
    setShowScanner(true)
  }

  // Format QR yang dibuat praktikan: "ICAL-ATTEND:{nim}:{exp}:{sig}", berputar tiap ~30 detik
  // dan ditandatangani server (lihat src/lib/qrAttendance.ts). Kita KIRIM TEKS MENTAH hasil
  // scan apa adanya ke server -- validasi format/tanda-tangan/kadaluarsa sepenuhnya di server,
  // supaya client tidak lagi "menebak" NIM dari sembarang deretan angka di QR.
  const handleDecodeQr = async (text: string) => {
    if (!text || !text.startsWith('ICAL-ATTEND:')) {
      setScanTaskError('QR tidak dikenali (bukan format QR absensi ICAL).')
      return
    }
    setScanTaskError(null)
    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr: text,
          praktikum: scanFilter.practicum,
          jurusan: scanFilter.jurusan || undefined,
          jenis: selectedJadwal.jenis,
          urutan_ke: selectedJadwal.urutan_ke,
          kelas_praktikum_id: scanKelas || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setScanTaskError(json.error || 'Gagal mencatat absensi.')
        setScanResult(null)
        return
      }
      setScanResult({ nama: json.nama, nim: json.nim })
      setAttendanceRoster((prev) =>
        prev.map((r) =>
          r.anggota_kelompok_id === json.anggota_kelompok_id
            ? { ...r, status: 'H', pertemuan_id: json.pertemuan_id, waktu_absen: new Date().toISOString(), metode: 'scan_qr' }
            : r
        )
      )
    } catch (err: any) {
      setScanTaskError(err.message || 'Gagal mencatat absensi.')
      setScanResult(null)
    }
  }

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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-[#D6E4F0] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo, User Info & Nav Links (Scrollable jika layar pendek) */}
        <div className="pt-5 px-5 flex-1 overflow-y-auto relative z-10 scrollbar-none">
          {/* Logo ICAL Text */}
          <div className="mb-4">
            <h1
              className="text-2xl sm:text-[1.65rem] font-extrabold text-[#00142F] tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              ICAL
            </h1>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-3 mb-4 p-2 rounded-2xl bg-[#F4F8FC] border border-[#E2EDF8]">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
              style={{ background: '#002466' }}
            >
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="font-bold text-[#00142F] text-xs leading-snug truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
                title={user.name}
              >
                {user.name}
              </div>
              <div className="text-[10px] text-[#002466] font-medium truncate mt-0.5">
                Asisten • Laboratorium ICAL
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 pb-2">
            {sidebarLinks.map((link) => {
              const isActive = activeSection === link.id
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveSection(link.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                    isActive
                      ? 'text-white'
                      : 'text-[#002466] hover:bg-[#F0F7FF] hover:text-[#002466]'
                  }`}
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)',
                          boxShadow: '0 4px 14px rgba(0, 11, 26, 0.35)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }
                      : {}
                  }
                >
                  <Icon
                    name={link.icon}
                    size={18}
                    color={isActive ? '#ffffff' : '#002466'}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span style={{ fontFamily: 'var(--font-heading)' }}>{link.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Sidebar with Compact Wave Graphic & Locked Logout Button */}
        <div className="relative pt-6 pb-4 px-5 overflow-hidden shrink-0 mt-auto border-t border-[#E2EDF8]">
          {/* Background Layered Wave Graphic + Molecular Network */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
            <svg
              viewBox="0 0 288 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-cover"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="sidebarWaveAssistant1" x1="0" y1="0" x2="288" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D6E4F0" />
                  <stop offset="1" stopColor="#0284C7" />
                </linearGradient>
                <linearGradient id="sidebarWaveAssistant2" x1="0" y1="20" x2="288" y2="160" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#002466" />
                  <stop offset="0.5" stopColor="#001C4A" />
                  <stop offset="1" stopColor="#00142F" />
                </linearGradient>
              </defs>

              {/* Outer Accent Wave */}
              <path
                d="M0 30C70 60 190 10 288 40V160H0V30Z"
                fill="url(#sidebarWaveAssistant1)"
                opacity="0.85"
              />

              {/* Main Deep Royal Navy Wave */}
              <path
                d="M0 50C80 80 180 20 288 60V160H0V50Z"
                fill="url(#sidebarWaveAssistant2)"
              />

              {/* Molecular Network */}
              <g stroke="#D6E4F0" strokeWidth="1" opacity="0.35">
                <line x1="210" y1="30" x2="250" y2="15" />
                <line x1="250" y1="15" x2="280" y2="35" />
                <line x1="280" y1="35" x2="270" y2="75" />
                <line x1="270" y1="75" x2="230" y2="90" />
                <line x1="230" y1="90" x2="200" y2="65" />
                <line x1="200" y1="65" x2="210" y2="30" />
                <line x1="140" y1="80" x2="185" y2="100" />
                <line x1="185" y1="100" x2="225" y2="120" />
              </g>

              {/* Glowing Nodes */}
              {[
                [210, 30], [250, 15], [280, 35], [270, 75], [230, 90], [200, 65],
                [140, 80], [185, 100], [225, 120]
              ].map(([cx, cy], idx) => (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r="3"
                  fill="#ffffff"
                  opacity={0.65}
                />
              ))}
            </svg>
          </div>

          {/* Logout Button */}
          <div className="relative z-10">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-200 cursor-pointer shadow-sm"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Icon name="logout" size={17} color="#ffffff" strokeWidth={2.2} />
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
              Dashboard Asisten
            </h1>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            {/* Profile Pill Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-white border border-[#D6E4F0] rounded-2xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-semibold text-[#00142F]" style={{ fontFamily: 'var(--font-heading)' }}>
                  {user.name}
                </span>
                <Icon name="chevron-down" size={15} color="#64748b" strokeWidth={2} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#D6E4F0] py-2 z-50 animate-fadeInUp">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-[#00142F] truncate">{user.name}</div>
                    <div className="text-[0.7rem] text-slate-500">Asisten Laboratorium</div>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      setActiveSection('profile')
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-[#F0F7FF] flex items-center gap-2 cursor-pointer"
                  >
                    <Icon name="user" size={14} color="#002466" /> Profil & Kontak
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
          {/* Subtle wave gradient background decoration at bottom right */}
          <div className="fixed bottom-0 right-0 w-[550px] h-[350px] pointer-events-none z-0 opacity-40">
            <svg viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M100 300C250 220 380 270 500 180V300H100Z"
                fill="url(#bottomDecorWaveAssistant)"
              />
              <defs>
                <linearGradient id="bottomDecorWaveAssistant" x1="100" y1="200" x2="500" y2="300" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D6E4F0" stopOpacity="0.4" />
                  <stop offset="1" stopColor="#0284C7" stopOpacity="0.15" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="max-w-6xl mx-auto space-y-6 relative z-10">
            {/* ===================== TAB 1: BERANDA ===================== */}
            {activeSection === 'home' && (
              <>
                {/* Hero Banner */}
                <div
                  className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                  style={{
                    background: 'linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)', boxShadow: '0 16px 36px -10px rgba(0,11,26,0.5)', border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  {/* Left Text */}
                  <div className="relative z-10 max-w-xl">
                    <h2
                      className="text-white font-bold text-xl sm:text-2xl lg:text-[1.65rem] tracking-tight"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Halo, {user.name}!
                    </h2>
                    <p className="text-[#D6E4F0] text-xs sm:text-sm mt-2 font-normal leading-relaxed">
                      Selamat bertugas Asisten ICAL, Semester Ganjil 2026/2027
                    </p>
                  </div>

                  {/* Background molecular pattern overlay */}
                  <div className="absolute -bottom-10 right-8 opacity-25 pointer-events-none">
                    <MolecularPattern className="w-80 h-64" />
                  </div>
                </div>

                {/* Statistik Ringkasan Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D6E4F0] shadow-xs relative">
                  {/* Top Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <Icon name="bar-chart" size={20} color="#002466" strokeWidth={2} />
                      <h3
                        className="font-bold text-[#00142F] text-base sm:text-lg"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Statistik Asisten
                      </h3>
                    </div>

                    {/* Faint Dot Matrix Decoration */}
                    <div className="grid grid-cols-4 gap-1.5 opacity-20 pointer-events-none">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                      ))}
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
                    {/* 1. Kelompok Diampu */}
                    <div className="group relative overflow-hidden bg-[#F4F8FC] hover:bg-[#0260D4] hover: hover: active:bg-[#0260D4] active: active: border border-[#D6E4F0] hover:border-[#D6E4F0] active:border-[#D6E4F0] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1.5 active:scale-95 hover:shadow-[0_12px_24px_-6px_rgba(2, 96, 212, 0.25)] active:shadow-md cursor-pointer select-none touch-manipulation">
                      <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/20 group-active:bg-white/20 flex items-center justify-center text-[#002466] group-hover:text-white group-active:text-white shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-110 group-active:scale-110">
                        <Icon name="users" size={20} color="currentColor" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#00142F] group-hover:text-white group-active:text-white text-base sm:text-xl leading-tight transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {homeStats.kelompokDiampu}
                        </div>
                        <div className="text-xs text-[#64748B] group-hover:text-[#D6E4F0] group-active:text-[#D6E4F0] mt-0.5 font-medium transition-colors duration-300">Kelompok Diampu</div>
                      </div>
                    </div>

                    {/* 2. Total Praktikan */}
                    <div className="group relative overflow-hidden bg-[#F4F8FC] hover:bg-[#0260D4] hover: hover: active:bg-[#0260D4] active: active: border border-[#D6E4F0] hover:border-[#D6E4F0] active:border-[#D6E4F0] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1.5 active:scale-95 hover:shadow-[0_12px_24px_-6px_rgba(2, 96, 212, 0.25)] active:shadow-md cursor-pointer select-none touch-manipulation">
                      <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/20 group-active:bg-white/20 flex items-center justify-center text-[#002466] group-hover:text-white group-active:text-white shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-110 group-active:scale-110">
                        <Icon name="graduation-cap" size={20} color="currentColor" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#00142F] group-hover:text-white group-active:text-white text-base sm:text-xl leading-tight transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {homeStats.totalPraktikan}
                        </div>
                        <div className="text-xs text-[#64748B] group-hover:text-[#D6E4F0] group-active:text-[#D6E4F0] mt-0.5 font-medium transition-colors duration-300">Total Praktikan</div>
                      </div>
                    </div>

                    {/* 3. Pertemuan Selesai */}
                    <div className="group relative overflow-hidden bg-[#F4F8FC] hover:bg-[#0260D4] hover: hover: active:bg-[#0260D4] active: active: border border-[#D6E4F0] hover:border-emerald-300/50 active:border-emerald-300/50 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1.5 active:scale-95 hover:shadow-[0_12px_24px_-6px_rgba(16,185,129,0.35)] active:shadow-md cursor-pointer select-none touch-manipulation">
                      <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/20 group-active:bg-white/20 flex items-center justify-center text-[#059669] group-hover:text-white group-active:text-white shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-110 group-active:scale-110">
                        <Icon name="check-circle" size={20} color="currentColor" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#059669] group-hover:text-white group-active:text-white text-base sm:text-xl leading-tight transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {homeStats.pertemuanSelesai}/{homeStats.pertemuanTotal}
                        </div>
                        <div className="text-xs text-[#64748B] group-hover:text-emerald-100 group-active:text-emerald-100 mt-0.5 font-medium transition-colors duration-300">Pertemuan Selesai</div>
                      </div>
                    </div>

                    {/* 4. Nilai Belum Input */}
                    <div className="group relative overflow-hidden bg-[#F4F8FC] hover:bg-[#0260D4] hover: hover: active:bg-[#0260D4] active: active: border border-[#D6E4F0] hover:border-amber-300/50 active:border-amber-300/50 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1.5 active:scale-95 hover:shadow-[0_12px_24px_-6px_rgba(245,158,11,0.35)] active:shadow-md cursor-pointer select-none touch-manipulation">
                      <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/20 group-active:bg-white/20 flex items-center justify-center text-[#d97706] group-hover:text-white group-active:text-white shrink-0 shadow-2xs transition-all duration-300 group-hover:scale-110 group-active:scale-110">
                        <Icon name="warning" size={20} color="currentColor" strokeWidth={1.8} />
                      </div>
                      <div>
                        <div
                          className="font-bold text-[#d97706] group-hover:text-white group-active:text-white text-base sm:text-xl leading-tight transition-colors duration-300"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {homeStats.nilaiBelumInput}
                        </div>
                        <div className="text-xs text-[#64748B] group-hover:text-amber-100 group-active:text-amber-100 mt-0.5 font-medium transition-colors duration-300">Nilai Belum Input</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Navigation Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {[
                    { id: 'grades', label: 'Kelola Nilai', icon: 'bar-chart', desc: 'Input & ekspor nilai praktikan' },
                    { id: 'attendance', label: 'Absensi & QR', icon: 'smartphone', desc: 'Scan QR & kelola kehadiran' },
                    { id: 'import', label: 'Import Praktikan', icon: 'inbox', desc: 'Upload Excel jadwal & mahasiswa' },
                    { id: 'profile', label: 'Profil Kontak', icon: 'user', desc: 'Atur nomor WhatsApp & Instagram' },
                    { id: 'announcement', label: 'Buat Berita', icon: 'megaphone', desc: 'Publikasikan pengumuman lab' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className="relative overflow-hidden bg-white hover:bg-[#0260D4] hover:from-white hover: active:bg-[#F0F7FF] rounded-3xl p-5 border border-[#D6E4F0] hover:border-[#0284C7]/50 active:border-[#0284C7]/50 shadow-xs hover:shadow-lg active:shadow-md transition-all duration-300 flex items-center justify-between cursor-pointer group hover:-translate-y-1.5 active:scale-98 select-none touch-manipulation"
                    >
                      {/* Left accent bar on hover */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0260D4]   opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300" />

                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#F0F7FF] group-hover:bg-[#0260D4] group-hover: group-hover: group-active:bg-[#0260D4] group-active: group-active: border border-[#D6E4F0] group-hover:border-transparent group-active:border-transparent flex items-center justify-center text-[#002466] group-hover:text-white group-active:text-white shrink-0 transition-all duration-300 group-hover:scale-110 group-active:scale-110 group-hover:rotate-3 shadow-2xs">
                          <Icon name={item.icon} size={22} color="currentColor" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-bold text-[#00142F] group-hover:text-[#002466] group-active:text-[#002466] text-sm sm:text-base leading-tight truncate transition-colors duration-300"
                            style={{ fontFamily: 'var(--font-heading)' }}
                          >
                            {item.label}
                          </div>
                          <div className="text-xs text-slate-500 group-hover:text-slate-600 group-active:text-slate-600 mt-1 truncate transition-colors duration-300">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[#002466] group-hover:bg-[#0260D4] group-hover: group-hover: group-active:bg-[#0260D4] group-active: group-active: text-white flex items-center justify-center group-hover:translate-x-1.5 group-active:translate-x-1 transition-all duration-300 shadow-xs shrink-0 group-hover:scale-110 group-active:scale-105">
                        <Icon name="arrow-right" size={16} color="#ffffff" strokeWidth={2.2} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ===================== TAB: DATA PRAKTIKAN ===================== */}
            {activeSection === 'students' && (
              <div className="space-y-6">
                {/* Banner */}
                <div
                  className="rounded-3xl relative overflow-hidden p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_16px_36px_-10px_rgba(0,11,26,0.5)] border border-white/15 min-h-[145px]"
                  style={{ background: 'linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)' }}
                >
                  <BannerWavesBackground />
                  <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                    <PraktikanCircleBadge />
                    <div className="max-w-md">
                      <h2
                        className="font-bold text-white text-xl sm:text-2xl tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Data Praktikan & Status Akun
                      </h2>
                      <p className="text-xs sm:text-sm text-[#BAE6FD] mt-1 leading-relaxed">
                        Pantau kelengkapan pendaftaran akun praktikan per jurusan, praktikum, dan kelas secara real-time.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter Card */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D6E4F0] shadow-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                        Jurusan
                      </label>
                      <select
                        className="input-field rounded-2xl"
                        value={studentFilter.jurusan}
                        onChange={(e) => setStudentFilter({ jurusan: e.target.value, practicum: '', kelas: '' })}
                      >
                        <option value="">-- Pilih Jurusan --</option>
                        {jurusanList.map((j) => (
                          <option key={j.id} value={j.kode}>
                            {j.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                        Praktikum
                      </label>
                      <select
                        className="input-field rounded-2xl"
                        value={studentFilter.practicum}
                        onChange={(e) => setStudentFilter((p) => ({ ...p, practicum: e.target.value, kelas: '' }))}
                        disabled={!studentFilter.jurusan}
                      >
                        <option value="">-- Pilih Praktikum --</option>
                        {JENIS_PRAKTIKUM_TETAP.map((p) => (
                          <option key={p.kode} value={p.kode}>
                            {p.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                        Kelas
                      </label>
                      <select
                        className="input-field rounded-2xl"
                        value={studentFilter.kelas}
                        onChange={(e) => setStudentFilter((p) => ({ ...p, kelas: e.target.value }))}
                        disabled={!studentFilter.practicum || studentKelasLoading || studentPracticumUnavailable}
                      >
                        <option value="">Semua Kelas</option>
                        {studentKelasOptions.map((k) => (
                          <option key={k.id} value={k.nama_kelas}>
                            Kelas {k.nama_kelas}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {studentPracticumUnavailable && (
                    <div className="rounded-2xl px-4 py-2.5 text-xs bg-red-50 border border-red-200 text-red-700 mt-4 flex items-center gap-2">
                      <Icon name="warning" size={14} /> Praktikum ini belum dibuka untuk jurusan yang dipilih.
                    </div>
                  )}
                </div>

                {!studentFilter.practicum && (
                  <div className="bg-white rounded-3xl p-8 text-center border border-[#D6E4F0] shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0260D4] flex items-center justify-center mx-auto mb-3">
                      <Icon name="users" size={24} />
                    </div>
                    <p className="text-sm font-semibold text-[#00142F]">Pilih Jurusan & Praktikum Terlebih Dahulu</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Pilih jurusan dan praktikum pada filter di atas untuk memuat daftar praktikan beserta status akunnya.
                    </p>
                  </div>
                )}

                {studentFilter.practicum && studentLoading && (
                  <div className="bg-white rounded-3xl p-12 text-center border border-[#D6E4F0] shadow-xs">
                    <Icon name="loader" size={28} className="inline animate-spin text-[#0260D4] mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Memuat data praktikan & status akun...</p>
                  </div>
                )}

                {studentFilter.practicum && studentError && (
                  <div className="bg-red-50 rounded-2xl p-4 text-xs sm:text-sm text-red-700 border border-red-200 flex items-center gap-2">
                    <Icon name="warning" size={16} /> {studentError}
                  </div>
                )}

                {studentFilter.practicum && !studentLoading && studentData && (
                  <>
                    {/* KPI Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                      {/* 1. Total Praktikan */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D6E4F0] shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0260D4] flex items-center justify-center shrink-0">
                          <Icon name="users" size={22} color="#0260D4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Praktikan</div>
                          <div className="text-xl sm:text-2xl font-extrabold text-[#00142F] leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                            {studentData.total}
                          </div>
                        </div>
                      </div>

                      {/* 2. Sudah Mendaftar */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D6E4F0] shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0260D4] flex items-center justify-center shrink-0">
                          <Icon name="check-circle" size={22} color="#0260D4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sudah Mendaftar</div>
                          <div className="text-xl sm:text-2xl font-extrabold text-[#00142F] leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                            {studentData.registeredCount}
                          </div>
                        </div>
                      </div>

                      {/* 3. Belum Buat Akun */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D6E4F0] shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0260D4] flex items-center justify-center shrink-0">
                          <Icon name="alert-circle" size={22} color="#0260D4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Belum Buat Akun</div>
                          <div className="text-xl sm:text-2xl font-extrabold text-[#00142F] leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                            {studentData.unregisteredCount}
                          </div>
                        </div>
                      </div>

                      {/* 4. Persentase Aktivasi */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D6E4F0] shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0260D4] flex items-center justify-center shrink-0">
                          <Icon name="activity" size={22} color="#0260D4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Aktivasi Akun</div>
                          <div className="text-xl sm:text-2xl font-extrabold text-[#00142F] leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                            {studentData.total > 0 ? Math.round((studentData.registeredCount / studentData.total) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Toolbar Search & Filter Status */}
                    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#D6E4F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl w-full sm:w-auto overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setStudentStatusFilter('all')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            studentStatusFilter === 'all'
                              ? 'bg-white text-[#00142F] shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Semua ({studentData.total})
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatusFilter('registered')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            studentStatusFilter === 'registered'
                              ? 'bg-white text-[#00142F] shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Terdaftar ({studentData.registeredCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatusFilter('unregistered')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            studentStatusFilter === 'unregistered'
                              ? 'bg-white text-[#00142F] shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Belum Buat Akun ({studentData.unregisteredCount})
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Icon name="search" size={15} />
                          </div>
                          <input
                            type="text"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Cari nama atau NIM..."
                            className="input-field rounded-2xl text-xs w-full transition-all"
                            style={{
                              paddingLeft: '2.4rem',
                              paddingRight: studentSearch ? '2.2rem' : '1rem',
                              paddingTop: '0.55rem',
                              paddingBottom: '0.55rem',
                            }}
                          />
                          {studentSearch && (
                            <button
                              type="button"
                              onClick={() => setStudentSearch('')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Hapus pencarian"
                            >
                              <span className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                ✕
                              </span>
                            </button>
                          )}
                        </div>

                        {studentData.total > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="py-2.5 px-3.5 rounded-2xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                            title="Hapus data mahasiswa & kelompok untuk filter yang sedang aktif"
                          >
                            <Icon name="trash" size={14} className="text-rose-600" />
                            <span className="hidden md:inline">
                              {studentFilter.kelas ? `Hapus Kelas ${studentFilter.kelas}` : 'Hapus Data'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {deleteSuccessMsg && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                        <Icon name="check" size={15} className="text-emerald-600" />
                        {deleteSuccessMsg}
                      </div>
                    )}

                    {/* Table Data Praktikan */}
                    <div className="bg-white rounded-3xl border border-[#D6E4F0] shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-[#0260D4]">
                              {['No', 'Nama Praktikan', 'NIM', 'Kelompok', 'Shift', 'Kelas', 'Status Akun'].map((h) => (
                                <th
                                  key={h}
                                  className="p-3 text-left text-xs font-bold text-white uppercase tracking-wider border-b border-[#D6E4F0]"
                                  style={{ fontFamily: 'var(--font-heading)' }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.map((s: any, idx: number) => (
                              <tr key={s.id} className="hover:bg-[#F4F8FC] transition border-b border-slate-100 last:border-0">
                                <td className="p-3 text-xs text-slate-400">{idx + 1}</td>
                                <td className="p-3 font-bold text-xs sm:text-sm text-[#00142F] whitespace-nowrap">
                                  {s.nama}
                                </td>
                                <td className="p-3 text-xs text-slate-600 font-mono whitespace-nowrap">{s.nim}</td>
                                <td className="p-3 text-xs whitespace-nowrap">
                                  <span className="px-2.5 py-1 rounded-full text-white text-xs font-bold bg-[#002466]">
                                    {s.kelompok}
                                  </span>
                                </td>
                                <td className="p-3 text-xs text-slate-600 whitespace-nowrap">{s.shift}</td>
                                <td className="p-3 text-xs text-slate-600 whitespace-nowrap">{s.kelas}</td>
                                <td className="p-3 text-xs whitespace-nowrap">
                                  {s.hasAccount ? (
                                    <div className="flex flex-col">
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                                        <Icon name="check" size={13} strokeWidth={2.5} /> Terdaftar
                                      </span>
                                      {s.email && <span className="text-[11px] text-slate-500 font-mono mt-1">{s.email}</span>}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                      Belum buat akun
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-sm text-slate-400">
                                  {studentSearch || studentStatusFilter !== 'all'
                                    ? 'Tidak ada praktikan yang cocok dengan filter pencarian.'
                                    : 'Belum ada praktikan terdaftar pada praktikum ini.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Modal Konfirmasi Hapus Data Praktikan */}
                    {showDeleteModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
                          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                            <Icon name="alert-triangle" size={24} />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-[#00142F]" style={{ fontFamily: 'var(--font-heading)' }}>
                              Hapus Data Praktikan?
                            </h3>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                              Apakah Anda yakin ingin menghapus data praktikan untuk{' '}
                              <strong>
                                {studentFilter.jurusan} • {studentFilter.practicum} {studentFilter.kelas ? `• Kelas ${studentFilter.kelas}` : '(Semua Kelas)'}
                              </strong>{' '}
                              sebanyak <strong>{studentData?.total || 0} praktikan</strong>?
                            </p>
                            <div className="text-[11px] text-rose-700 bg-rose-50 p-3 rounded-2xl mt-3 text-left border border-rose-100 leading-relaxed space-y-1">
                              <div className="font-bold">⚠️ Efek Penghapusan:</div>
                              <ul className="list-disc pl-4 space-y-0.5">
                                <li>Seluruh data kelompok, anggota, nilai, dan rekap absensi terkait akan dihapus permanen.</li>
                                <li>Jadwal kelas ini otomatis lenyap dari dropdown jadwal publik mahasiswa.</li>
                              </ul>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowDeleteModal(false)}
                              disabled={deleteLoading}
                              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteStudents}
                              disabled={deleteLoading}
                              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              {deleteLoading ? (
                                <><Icon name="loader" size={14} className="animate-spin" /> Menghapus...</>
                              ) : (
                                <><Icon name="trash" size={14} /> Ya, Hapus Data</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===================== TAB 2: KELOLA NILAI ===================== */}
            {activeSection === 'grades' && (
              <div className="space-y-6">
                {/* Banner */}
                <div className="rounded-3xl relative overflow-hidden p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_16px_36px_-10px_rgba(0,11,26,0.5)] border border-white/15 min-h-[145px]" style={{ background: "linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)" }}>
                  <BannerWavesBackground />
                  <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                    <BarChartCircleBadge />
                    <div className="max-w-md">
                      <h2 className="font-bold text-white text-xl sm:text-2xl tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Kelola Nilai Praktikan
                      </h2>
                      <p className="text-xs sm:text-sm text-[#BAE6FD] mt-1 leading-relaxed">
                        Kelola, input nilai komponen per pertemuan, dan ekspor format resmi Excel.
                      </p>
                    </div>
                  </div>

                  {/* 3D Clipboard Illustration on Right */}
                  <div className="relative z-10 shrink-0 hidden sm:flex items-center justify-center">
                    <NilaiBannerIllustration className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-md" />
                  </div>
                </div>

                {/* Filter Card */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D6E4F0] shadow-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                        Jurusan
                      </label>
                      <select
                        className="input-field rounded-2xl"
                        value={gradeFilter.jurusan}
                        onChange={(e) => setGradeFilter({ jurusan: e.target.value, practicum: '', kelas: '' })}
                      >
                        <option value="">-- Pilih Jurusan --</option>
                        {jurusanList.map((j) => (
                          <option key={j.id} value={j.kode}>
                            {j.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                        Praktikum
                      </label>
                      <select
                        className="input-field rounded-2xl"
                        value={gradeFilter.practicum}
                        onChange={(e) => setGradeFilter((p) => ({ ...p, practicum: e.target.value, kelas: '' }))}
                        disabled={!gradeFilter.jurusan}
                      >
                        <option value="">-- Pilih Praktikum --</option>
                        {JENIS_PRAKTIKUM_TETAP.map((p) => (
                          <option key={p.kode} value={p.kode}>
                            {p.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                        Kelas
                      </label>
                      <select
                        className="input-field rounded-2xl"
                        value={gradeFilter.kelas}
                        onChange={(e) => setGradeFilter((p) => ({ ...p, kelas: e.target.value }))}
                        disabled={!gradeFilter.practicum || kelasLoading || gradePracticumUnavailable}
                      >
                        <option value="">Semua Kelas</option>
                        {kelasOptions.map((k) => (
                          <option key={k.id} value={k.nama_kelas}>
                            Kelas {k.nama_kelas}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {gradePracticumUnavailable && (
                    <div className="rounded-2xl px-4 py-2.5 text-xs bg-red-50 border border-red-200 text-red-700 mt-4 flex items-center gap-2">
                      <Icon name="warning" size={14} /> Praktikum ini belum dibuka untuk jurusan yang dipilih.
                    </div>
                  )}
                </div>

                {!gradeFilter.practicum && (
                  <div className="bg-white rounded-3xl p-8 text-center border border-[#D6E4F0] shadow-xs">
                    <p className="text-sm text-slate-500">Pilih jurusan & praktikum untuk menampilkan tabel nilai.</p>
                  </div>
                )}

                {/* Grade Table Area */}
                {gradeFilter.practicum && !gradePracticumUnavailable && nilaiLoading && (
                  <div className="p-12 text-center bg-white rounded-3xl border border-[#D6E4F0] shadow-xs">
                    <Icon name="loader" size={32} className="inline animate-spin text-[#0284C7] mb-2" />
                    <div className="text-xs text-slate-500 font-medium">Memuat data nilai praktikan...</div>
                  </div>
                )}

                {nilaiError && (
                  <div className="rounded-3xl p-6 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
                    {nilaiError}
                  </div>
                )}

                {gradeFilter.practicum && !gradePracticumUnavailable && !nilaiLoading && nilaiData && (() => {
                  const pertemuanReguler = nilaiData.pertemuan.filter((p) => p.jenis === 'pertemuan').sort((a, b) => (a.urutan_ke || 0) - (b.urutan_ke || 0))
                  const pertemuanUap = nilaiData.pertemuan.find((p) => p.jenis === 'uap')
                  const skema = getSkema(gradeFilter.practicum)

                  const findPertemuanId = (kelompokId: string, jenis: string, urutanKe: number | null) =>
                    nilaiData.pertemuanRows.find((r) => r.kelompok_id === kelompokId && r.jenis === jenis && r.urutan_ke === urutanKe)?.id

                  const cell = (anggotaId: string, kelompokId: string, jenis: string, urutanKe: number | null, kode: string, maxOverride?: number) => {
                    const pertemuanId = findPertemuanId(kelompokId, jenis, urutanKe)
                    if (!pertemuanId) return <td key={`${jenis}${urutanKe}${kode}`} className="p-1.5 text-center text-slate-300">—</td>
                    const key = `${anggotaId}::${pertemuanId}::${kode}`
                    return (
                      <td key={key} className="p-1.5 text-center">
                        <input
                          type="number"
                          value={nilaiDrafts[key] ?? ''}
                          min={0}
                          max={maxOverride ?? 100}
                          onChange={(e) => setNilaiDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-14 text-center border border-[#D6E4F0] focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] rounded-lg py-1 px-1 text-xs outline-hidden transition"
                        />
                      </td>
                    )
                  }

                  const cellReadonly = (anggotaId: string, kelompokId: string, jenis: string, urutanKe: number | null, kode: string) => {
                    const pertemuanId = findPertemuanId(kelompokId, jenis, urutanKe)
                    if (!pertemuanId) return <td key={`ro-${jenis}${urutanKe}${kode}`} className="p-1.5 text-center text-slate-300">—</td>
                    const key = `${anggotaId}::${pertemuanId}::${kode}`
                    const val = nilaiDrafts[key]

                    if (kode === 'KEHADIRAN') {
                      // Seluruh total sesi yang seharusnya hadir: Pengarahan, Pertemuan 1..n, dan UAP
                      const allSesiIds = new Set(
                        nilaiData.pertemuanRows
                          .filter((r) => r.kelompok_id === kelompokId && ['pengarahan', 'pertemuan', 'uap', 'presentasi'].includes(r.jenis))
                          .map((r) => r.id)
                      )
                      const totalSesi = allSesiIds.size > 0
                        ? allSesiIds.size
                        : nilaiData.pertemuan.filter((p) => ['pengarahan', 'pertemuan', 'uap', 'presentasi'].includes(p.jenis)).length

                      const hadirReal = (nilaiData.absensi || []).filter(
                        (ab) => ab.anggota_kelompok_id === anggotaId && ab.status === 'H' && allSesiIds.has(ab.pertemuan_id)
                      ).length

                      const hasAbsensiData = nilaiData.absensi && nilaiData.absensi.some((ab) => ab.anggota_kelompok_id === anggotaId)
                      const hasVal = val !== undefined && val !== ''

                      let hadirCount = 0
                      if (hasAbsensiData) {
                        hadirCount = hadirReal
                      } else if (hasVal && totalSesi > 0) {
                        hadirCount = Math.round((Number(val) / 100) * totalSesi)
                      }

                      const hasRecord = hasAbsensiData || hasVal
                      const displayStr = totalSesi > 0 && hasRecord ? `${hadirCount} / ${totalSesi}` : (totalSesi > 0 ? `0 / ${totalSesi}` : '—')

                      return (
                        <td key={key} className="p-1.5 text-center">
                          <span
                            title={`Hadir ${hadirCount} dari ${totalSesi} sesi (Pengarahan, Pertemuan 1..n, & UAP)`}
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                              hasRecord && hadirCount > 0
                                ? hadirCount === totalSesi
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-50 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {displayStr}
                          </span>
                        </td>
                      )
                    }

                    return (
                      <td key={key} className="p-1.5 text-center">
                        <span
                          title="Otomatis dari data sistem"
                          className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                            val !== undefined && val !== '' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                          }`}
                        >
                          {val !== undefined && val !== '' ? val : '—'}
                        </span>
                      </td>
                    )
                  }

                  return (
                    <div className="bg-white rounded-3xl border border-[#D6E4F0] shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-[#0260D4]  ">
                              {[
                                'No', 'Nama', 'NIM', 'Kelompok',
                                ...skema.perPertemuan.flatMap((k) => pertemuanReguler.map((p) => `${k.label} ${p.urutan_ke}`)),
                                ...skema.finalTunggal.map((k) => (k.kode === 'KEHADIRAN' ? `${k.label} (auto)` : k.label)),
                              ].map((h, idx) => (
                                <th
                                  key={`${h}-${idx}`}
                                  className="p-3 text-center text-xs font-bold text-[#00142F] uppercase tracking-wider border-b border-[#D6E4F0]"
                                  style={{ fontFamily: 'var(--font-heading)' }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {nilaiData.anggota.map((a, i) => (
                              <tr key={a.id} className="hover:bg-[#F4F8FC] transition border-b border-slate-100 last:border-0">
                                <td className="p-2.5 text-center text-xs text-slate-400">{i + 1}</td>
                                <td className="p-2.5 font-bold text-xs sm:text-sm text-[#00142F] whitespace-nowrap">
                                  {a.nama_praktikan}
                                </td>
                                <td className="p-2.5 text-xs text-slate-500 whitespace-nowrap">{a.nim}</td>
                                <td className="p-2.5 text-center text-xs whitespace-nowrap">
                                  <span className="px-2.5 py-1 rounded-full text-white text-xs font-bold bg-[#002466]">
                                    {a.nama_kelompok || '—'}
                                  </span>
                                </td>
                                {skema.perPertemuan.map((k) =>
                                  pertemuanReguler.map((p) => cell(a.id, a.kelompok_id, 'pertemuan', p.urutan_ke, k.kode, gradeFilter.practicum === 'PLC' && k.kode === 'P' ? 5 : undefined))
                                )}
                                {skema.finalTunggal.map((k) => (
                                  pertemuanUap
                                    ? (k.kode === 'KEHADIRAN'
                                      ? cellReadonly(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, k.kode)
                                      : cell(a.id, a.kelompok_id, 'uap', pertemuanUap.urutan_ke, k.kode))
                                    : <td key={k.kode} className="p-2 text-center text-slate-300">—</td>
                                ))}
                              </tr>
                            ))}
                            {nilaiData.anggota.length === 0 && (
                              <tr>
                                <td colSpan={4 + pertemuanReguler.length * skema.perPertemuan.length + skema.finalTunggal.length} className="p-8 text-center text-sm text-slate-400">
                                  Belum ada praktikan terdaftar pada praktikum ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Bottom action buttons */}
                      <div className="p-4 bg-slate-50/50 border-t border-[#D6E4F0] flex items-center justify-end gap-3 flex-wrap">
                        {nilaiSavedMsg && <span className="text-xs font-semibold text-emerald-700">{nilaiSavedMsg}</span>}
                        <button
                          onClick={handleExportExcel}
                          className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          <Icon name="download" size={15} /> Export Excel
                        </button>
                        <button
                          onClick={handleSaveNilai}
                          disabled={nilaiSaving}
                          className="py-2.5 px-5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0260D4]    hover:shadow-md transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {nilaiSaving ? (
                            <><Icon name="loader" size={15} className="animate-spin" /> Menyimpan...</>
                          ) : (
                            <><Icon name="save" size={15} /> Simpan Nilai</>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ===================== TAB 3: ABSENSI & QR ===================== */}
            {activeSection === 'attendance' && (
              <div className="space-y-6">
                {/* Banner */}
                <div className="rounded-3xl relative overflow-hidden p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_16px_36px_-10px_rgba(0,11,26,0.5)] border border-white/15 min-h-[145px]" style={{ background: "linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)" }}>
                  <BannerWavesBackground />
                  <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                    <CalendarCircleBadge />
                    <div className="max-w-md">
                      <h2 className="font-bold text-white text-xl sm:text-2xl tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Absensi & Scanner QR
                      </h2>
                      <p className="text-xs sm:text-sm text-[#BAE6FD] mt-1 leading-relaxed">
                        Pindai QR absensi praktikan secara langsung atau kelola rekap kehadiran.
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 shrink-0 hidden sm:flex items-center justify-center">
                    <CalendarBannerIllustration className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-md" />
                  </div>
                </div>

                {/* QR Scanner Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D6E4F0] shadow-xs text-center">
                  <h3
                    className="font-bold text-[#00142F] text-base sm:text-lg mb-4"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Scan QR Praktikan
                  </h3>

                  {/* Filter selectors */}
                  <div className="flex gap-2.5 justify-center flex-wrap mb-5">
                    <select
                      value={scanFilter.jurusan}
                      onChange={(e) => setScanFilter({ jurusan: e.target.value, practicum: '' })}
                      className="input-field rounded-2xl !w-auto text-xs sm:text-sm"
                    >
                      <option value="">-- Jurusan --</option>
                      {jurusanList.map((j) => (
                        <option key={j.id} value={j.kode}>
                          {j.nama}
                        </option>
                      ))}
                    </select>

                    <select
                      value={scanFilter.practicum}
                      onChange={(e) => setScanFilter((p) => ({ ...p, practicum: e.target.value }))}
                      disabled={!scanFilter.jurusan}
                      className="input-field rounded-2xl !w-auto text-xs sm:text-sm"
                    >
                      <option value="">-- Praktikum --</option>
                      {JENIS_PRAKTIKUM_TETAP.map((p) => (
                        <option key={p.kode} value={p.kode}>
                          {p.nama}
                        </option>
                      ))}
                    </select>

                    <select
                      value={scanJadwalKey}
                      onChange={(e) => setScanJadwalKey(e.target.value)}
                      className="input-field rounded-2xl !w-auto text-xs sm:text-sm"
                    >
                      {JADWAL_OPTIONS.map((p) => (
                        <option key={jadwalKey(p)} value={jadwalKey(p)}>
                          {p.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={scanKelas}
                      onChange={(e) => setScanKelas(e.target.value)}
                      disabled={!scanFilter.practicum || scanKelasLoading || scanPracticumUnavailable}
                      className="input-field rounded-2xl !w-auto text-xs sm:text-sm"
                    >
                      <option value="">Semua Kelas</option>
                      {scanKelasOptions.map((k) => (
                        <option key={k.id} value={k.id}>
                          Kelas {k.nama_kelas}
                        </option>
                      ))}
                    </select>
                  </div>

                  {scanPracticumUnavailable && (
                    <div className="rounded-2xl px-4 py-2.5 text-xs bg-red-50 border border-red-200 text-red-700 mb-4 inline-flex items-center gap-2">
                      <Icon name="warning" size={14} /> Praktikum ini belum dibuka untuk jurusan yang dipilih.
                    </div>
                  )}

                  {/* Scan preview box */}
                  <div className="mx-auto w-52 h-52 rounded-3xl bg-[#F4F8FC] border-2 border-dashed border-[#0284C7]/60 flex items-center justify-center mb-5 overflow-hidden shadow-inner relative">
                    {scanResult ? (
                      <div className="animate-scaleIn text-center p-4">
                        <div className="mb-2 flex justify-center">
                          <Icon name="check-circle" size={36} color="#059669" />
                        </div>
                        <div className="font-bold text-[#059669] text-sm truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                          {scanResult.nama || scanResult.nim}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">NIM {scanResult.nim} — Hadir</div>
                      </div>
                    ) : (
                      <div className="text-[#0284C7] flex flex-col items-center gap-2">
                        <Icon name="camera" size={44} strokeWidth={1.5} />
                        <span className="text-xs text-slate-400">Siap memindai</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleOpenScanner}
                    className="py-3 px-8 rounded-2xl font-bold text-white bg-[#0260D4]    hover:shadow-lg transition-all cursor-pointer shadow-xs text-sm"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    <Icon name="camera" size={18} className="inline mr-2 align-text-bottom" /> Mulai Scan QR
                  </button>
                  <p className="text-xs text-slate-400 mt-2.5">
                    Kamera akan mendeteksi QR secara otomatis (real-time).
                  </p>

                  {showScanner && (
                    <QRScannerOverlay
                      onClose={() => setShowScanner(false)}
                      onDecode={handleDecodeQr}
                      scanResult={scanResult}
                      scanLoading={false}
                      scanError={scanTaskError}
                      onScanAgain={() => {
                        setScanResult(null)
                        setScanTaskError(null)
                      }}
                    />
                  )}
                </div>

                {/* Attendance table */}
                <div className="bg-white rounded-3xl border border-[#D6E4F0] shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#D6E4F0] flex items-center justify-between flex-wrap gap-2">
                    <h3
                      className="font-bold text-[#00142F] text-base"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Rekap Absensi {selectedJadwal.label}
                    </h3>
                    <button
                      onClick={handleExportAbsensiExcel}
                      disabled={!scanFilter.practicum || scanPracticumUnavailable}
                      className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Icon name="download" size={13} /> Ekspor Excel
                    </button>
                  </div>

                  {!scanFilter.practicum && (
                    <p className="p-8 text-center text-xs sm:text-sm text-slate-400">
                      Pilih jurusan & praktikum untuk menampilkan rekap absensi.
                    </p>
                  )}

                  {attendanceError && (
                    <p className="p-4 text-xs sm:text-sm text-red-600 bg-red-50">{attendanceError}</p>
                  )}

                  {scanFilter.practicum && attendanceLoading && (
                    <div className="p-8 text-center">
                      <Icon name="loader" size={24} className="inline animate-spin text-[#0284C7]" />
                    </div>
                  )}

                  {scanFilter.practicum && !attendanceLoading && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#0260D4]  ">
                            {['No', 'Nama', 'NIM', 'Kelompok', 'Kelas', 'Kehadiran'].map((h) => (
                              <th
                                key={h}
                                className="p-3 text-left text-xs font-bold text-[#00142F] uppercase tracking-wider border-b border-[#D6E4F0]"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRoster.map((row, i) => (
                            <tr key={row.anggota_kelompok_id} className="hover:bg-[#F4F8FC] transition border-b border-slate-100 last:border-0">
                              <td className="p-3 text-xs text-slate-400">{i + 1}</td>
                              <td className="p-3 font-bold text-xs sm:text-sm text-[#00142F]">
                                {row.nama}
                              </td>
                              <td className="p-3 text-xs text-slate-500">{row.nim}</td>
                              <td className="p-3">
                                <span className="px-2.5 py-1 rounded-full text-white text-xs font-bold bg-[#002466]">
                                  {row.nama_kelompok}
                                </span>
                              </td>
                              <td className="p-3 text-xs text-slate-600">{row.nama_kelas}</td>
                              <td className="p-3">
                                {row.pertemuan_id ? (
                                  <div className="flex items-center gap-1.5">
                                    {savingAttendanceIds.has(row.anggota_kelompok_id) && (
                                      <Icon name="loader" size={14} className="animate-spin text-[#0284C7] mr-0.5" />
                                    )}
                                    {(['H', 'I', 'S', 'A'] as const).map((status) => (
                                      <button
                                        key={status}
                                        onClick={() => handleManualAttendance(row, status)}
                                        disabled={savingAttendanceIds.has(row.anggota_kelompok_id)}
                                        title={status === 'H' ? 'Hadir' : status === 'I' ? 'Izin' : status === 'S' ? 'Sakit' : 'Alfa'}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait ${
                                          row.status === status
                                            ? status === 'H'
                                              ? 'bg-emerald-600 text-white'
                                              : status === 'I'
                                              ? 'bg-amber-500 text-white'
                                              : status === 'S'
                                              ? 'bg-[#002466] text-white'
                                              : 'bg-red-600 text-white'
                                            : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-300">Jadwal belum tersedia</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {attendanceRoster.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-xs sm:text-sm text-slate-400">
                                Belum ada praktikan terdaftar pada filter ini.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================== TAB 4: IMPORT PRAKTIKAN ===================== */}
            {activeSection === 'import' && (
              <div className="space-y-6">
                {/* Banner */}
                <div className="rounded-3xl relative overflow-hidden p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_16px_36px_-10px_rgba(0,11,26,0.5)] border border-white/15 min-h-[145px]" style={{ background: "linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)" }}>
                  <BannerWavesBackground />
                  <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                    <ImportCircleBadge />
                    <div className="max-w-md">
                      <h2 className="font-bold text-white text-xl sm:text-2xl tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Import Data Praktikan & Jadwal
                      </h2>
                      <p className="text-xs sm:text-sm text-[#BAE6FD] mt-1 leading-relaxed">
                        Upload file Excel (.xlsx) untuk mendaftarkan kelompok, jadwal, dan mahasiswa sekaligus.
                      </p>
                    </div>
                  </div>

                  {/* 3D Import Illustration on Right */}
                  <div className="relative z-10 shrink-0 hidden sm:flex items-center justify-center">
                    <ImportBannerIllustration className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-md" />
                  </div>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Step 1: Destination */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D6E4F0] shadow-xs">
                    <h3
                      className="font-bold text-[#00142F] text-sm sm:text-base mb-4"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      1. Pilih Tujuan Import
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                          Jurusan
                        </label>
                        <select
                          className="input-field rounded-2xl"
                          value={importFilter.jurusan}
                          onChange={(e) => setImportFilter({ jurusan: e.target.value, practicum: '' })}
                        >
                          <option value="">-- Pilih Jurusan --</option>
                          {jurusanList.map((j) => (
                            <option key={j.id} value={j.kode}>
                              {j.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                          Praktikum
                        </label>
                        <select
                          className="input-field rounded-2xl"
                          value={importFilter.practicum}
                          onChange={(e) => setImportFilter((p) => ({ ...p, practicum: e.target.value }))}
                          disabled={!importFilter.jurusan}
                        >
                          <option value="">-- Pilih Praktikum --</option>
                          {JENIS_PRAKTIKUM_TETAP.map((p) => (
                            <option key={p.kode} value={p.kode}>
                              {p.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {importPracticumUnavailable && (
                      <div className="rounded-2xl px-4 py-2.5 text-xs bg-red-50 border border-red-200 text-red-700 mt-3 flex items-center gap-2">
                        <Icon name="warning" size={14} /> Praktikum ini belum dibuka untuk jurusan yang dipilih.
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-3">
                      Kelas otomatis terdeteksi per sheet/tab dari file Excel yang diupload (misal tab "TE A", "TE B", dst).
                    </p>
                  </div>

                  {/* Step 2: Upload Zone */}
                  <div
                    className={`bg-white rounded-3xl p-8 text-center border-2 border-dashed border-[#0284C7]/50 shadow-xs transition-opacity ${
                      importFilter.practicum && !importPracticumUnavailable ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div className="mb-4 flex justify-center">
                      <Icon name="file-text" size={44} color="#002466" strokeWidth={1.5} />
                    </div>
                    <h3
                      className="font-bold text-[#00142F] text-base sm:text-lg mb-2"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      2. Upload File Jadwal Praktikum
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                      Upload file .xlsx. Seluruh sheet/kelas dalam file akan diproses sekaligus.
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      id="import-file"
                      className="hidden"
                      disabled={!importFilter.practicum || importPracticumUnavailable}
                      onChange={(e) => handleImportFile(e.target.files?.[0])}
                    />
                    <label
                      htmlFor="import-file"
                      className={`inline-block py-3 px-8 rounded-2xl font-bold text-white shadow-xs transition-all ${
                        importFilter.practicum && !importPracticumUnavailable
                          ? 'bg-[#0260D4]    hover:shadow-md cursor-pointer'
                          : 'bg-slate-300 cursor-not-allowed'
                      }`}
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {importParsing ? (
                        <><Icon name="loader" size={16} className="inline mr-2 animate-spin" /> Membaca file...</>
                      ) : (
                        <><Icon name="folder-open" size={16} className="inline mr-2" /> Pilih File Excel</>
                      )}
                    </label>
                    {importFileName && !importParsing && (
                      <p className="text-xs font-semibold text-[#002466] mt-3">{importFileName}</p>
                    )}
                  </div>

                  {importError && (
                    <div className="rounded-2xl px-4 py-3 text-xs sm:text-sm bg-red-50 border border-red-200 text-red-700">
                      {importError}
                    </div>
                  )}

                  {/* Step 3: Sheet Preview */}
                  {importSheets.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D6E4F0] shadow-xs">
                      <h3
                        className="font-bold text-[#00142F] text-sm sm:text-base mb-4"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        3. Pratinjau — {importSheets.filter((s) => !s.error).length} sheet/kelas terdeteksi
                      </h3>

                      <div className="space-y-3 mb-5">
                        {importSheets.map((sheet) => (
                          <div
                            key={sheet.sheetName}
                            className={`rounded-2xl p-4 border ${
                              sheet.error ? 'bg-red-50 border-red-200' : 'bg-[#F4F8FC] border-[#D6E4F0]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {!sheet.error && (
                                <input
                                  type="checkbox"
                                  checked={sheet.included}
                                  onChange={() => toggleSheetIncluded(sheet.sheetName)}
                                  className="mt-1"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-bold text-sm ${
                                    sheet.error ? 'text-red-700' : 'text-[#00142F]'
                                  }`}
                                  style={{ fontFamily: 'var(--font-heading)' }}
                                >
                                  Sheet "{sheet.sheetName}" {!sheet.error && `→ Kelas ${sheet.kelasNama}`}
                                </div>
                                {sheet.error ? (
                                  <div className="text-xs text-red-600 mt-1">{sheet.error}</div>
                                ) : (
                                  <>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {sheet.rows.length} praktikan terdeteksi
                                    </div>
                                    {sheet.jadwal && (
                                      <div className="text-xs flex flex-wrap gap-x-3 gap-y-1 mt-2 text-slate-600">
                                        <span>Hari/Jam: {sheet.jadwal.hari && sheet.jadwal.jamMulai ? `${sheet.jadwal.hari}, ${sheet.jadwal.jamMulai}` : '-'}</span>
                                        <span>Pengarahan: {sheet.jadwal.pengarahan || '-'}</span>
                                        {sheet.jadwal.pertemuan.map((p) => (
                                          <span key={p.urutan}>P{p.urutan}: {p.tanggal}</span>
                                        ))}
                                        <span>UAP: {sheet.jadwal.uap || '-'}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleSubmitImport}
                        disabled={importSubmitting || importSheets.filter((s) => s.included && !s.error).length === 0}
                        className="w-full py-3 px-6 rounded-2xl font-bold text-white bg-[#0260D4]    hover:shadow-md transition cursor-pointer shadow-xs disabled:opacity-50 text-sm"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {importSubmitting ? (
                          <><Icon name="loader" size={16} className="inline mr-2 animate-spin" /> Mengimport...</>
                        ) : (
                          <><Icon name="save" size={16} className="inline mr-2" /> Import {importSheets.filter((s) => s.included && !s.error).length} Kelas ke Database</>
                        )}
                      </button>
                    </div>
                  )}

                  {importResult && (
                    <div className="rounded-3xl p-6 bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                        <Icon name="check-circle" size={18} /> Import Selesai
                      </div>
                      <p className="text-xs sm:text-sm text-emerald-700">
                        {importResult.kelasCount} kelas diproses, {importResult.kelompokCount} kelompok, {importResult.anggotaCount} praktikan berhasil disimpan ke database.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================== TAB 5: PROFIL KONTAK ===================== */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                {/* Banner */}
                <div className="rounded-3xl relative overflow-hidden p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_16px_36px_-10px_rgba(0,11,26,0.5)] border border-white/15 min-h-[145px]" style={{ background: "linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)" }}>
                  <BannerWavesBackground />
                  <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                    <ProfileCircleBadge />
                    <div className="max-w-md">
                      <h2 className="font-bold text-white text-xl sm:text-2xl tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Profil & Kontak Asisten
                      </h2>
                      <p className="text-xs sm:text-sm text-[#BAE6FD] mt-1 leading-relaxed">
                        Kelola nomor WhatsApp dan Instagram yang akan ditampilkan di laman Kontak Asisten.
                      </p>
                    </div>
                  </div>

                  {/* 3D Profile Illustration on Right */}
                  <div className="relative z-10 shrink-0 hidden sm:flex items-center justify-center">
                    <ProfileBannerIllustration className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-md" />
                  </div>
                </div>

                <div className="max-w-lg mx-auto">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D6E4F0] shadow-xs">
                    <div className="flex flex-col items-center text-center gap-3 mb-6">
                      <div
                        className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-md"
                        style={{ background: 'linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)', boxShadow: '0 16px 36px -10px rgba(0,11,26,0.5)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <h3
                          className="font-bold text-[#00142F] text-base sm:text-lg"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {user.name}
                        </h3>
                        <div className="text-xs text-slate-500">Asisten Laboratorium ICAL</div>
                      </div>
                    </div>

                    {profileLoading ? (
                      <div className="text-center py-8 text-slate-400">
                        <Icon name="loader" size={24} className="inline animate-spin mb-2" />
                        <div className="text-xs">Memuat data profil...</div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        {profileSuccess && (
                          <div className="rounded-2xl px-4 py-3 text-xs flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800">
                            <Icon name="check-circle" size={16} className="shrink-0" />
                            <span>{profileSuccess}</span>
                          </div>
                        )}
                        {profileError && (
                          <div className="rounded-2xl px-4 py-3 text-xs flex items-center gap-2 bg-red-50 border border-red-200 text-red-800">
                            <Icon name="warning" size={16} className="shrink-0" />
                            <span>{profileError}</span>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                            <Icon name="whatsapp" size={14} color="#059669" /> WhatsApp
                          </label>
                          <input
                            type="text"
                            className="input-field rounded-2xl"
                            placeholder="Contoh: 081283020758"
                            value={profileWa}
                            onChange={(e) => setProfileWa(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                            <Icon name="instagram" size={14} color="#e1306c" /> Instagram
                          </label>
                          <input
                            type="text"
                            className="input-field rounded-2xl"
                            placeholder="Contoh: ical.itpln atau @username"
                            value={profileIg}
                            onChange={(e) => setProfileIg(e.target.value)}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="w-full py-3 rounded-2xl font-bold text-white bg-[#0260D4]    hover:shadow-md transition cursor-pointer shadow-xs disabled:opacity-50 text-sm"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {profileSaving ? (
                            <><Icon name="loader" size={15} className="inline mr-2 animate-spin" /> Menyimpan...</>
                          ) : (
                            <><Icon name="save" size={15} className="inline mr-2" /> Simpan Profil</>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 6: BUAT BERITA ===================== */}
            {activeSection === 'announcement' && (
              <div className="space-y-6">
                {/* Banner */}
                <div className="rounded-3xl relative overflow-hidden p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_16px_36px_-10px_rgba(0,11,26,0.5)] border border-white/15 min-h-[145px]" style={{ background: "linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)" }}>
                  <BannerWavesBackground />
                  <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                    <BeritaCircleBadge />
                    <div className="max-w-md">
                      <h2 className="font-bold text-white text-xl sm:text-2xl tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Buat Pengumuman & Berita
                      </h2>
                      <p className="text-xs sm:text-sm text-[#BAE6FD] mt-1 leading-relaxed">
                        Tulis dan publikasikan informasi terkini laboratorium untuk praktikan.
                      </p>
                    </div>
                  </div>

                  {/* 3D Announcement Illustration on Right */}
                  <div className="relative z-10 shrink-0 hidden sm:flex items-center justify-center">
                    <BeritaBannerIllustration className="w-32 h-32 sm:w-36 sm:h-36 drop-shadow-md" />
                  </div>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {announcementSent ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-emerald-200 shadow-xs animate-scaleIn">
                      <div className="mb-3 flex justify-center">
                        <Icon name="megaphone" size={44} color="#059669" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-bold text-emerald-800 text-base sm:text-lg mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                        {announcement.publishNow ? 'Berita Dipublikasikan!' : 'Berita Disimpan sebagai Draft'}
                      </h3>
                      <p className="text-slate-600 text-xs sm:text-sm">
                        "{announcement.title}" {announcement.publishNow ? 'sudah tampil di halaman Beranda.' : 'tersimpan sebagai draft.'}
                      </p>
                      <button
                        className="mt-5 py-2.5 px-6 rounded-2xl text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                        onClick={() => {
                          setAnnouncementSent(false)
                          setAnnouncement({ title: '', content: '', date: new Date().toISOString().slice(0, 10), kategori: 'info', publishNow: true })
                        }}
                      >
                        + Buat Pengumuman Lain
                      </button>
                    </div>
                  ) : (
                    <form
                      className="bg-white rounded-3xl p-6 sm:p-7 space-y-4 border border-[#D6E4F0] shadow-xs"
                      onSubmit={handleSubmitAnnouncement}
                    >
                      {announcementError && (
                        <div className="rounded-2xl px-4 py-3 text-xs sm:text-sm bg-red-50 border border-red-200 text-red-700">
                          {announcementError}
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                          Judul Pengumuman
                        </label>
                        <input
                          type="text"
                          className="input-field rounded-2xl"
                          placeholder="Contoh: Pengumpulan Laporan Pertemuan 2"
                          value={announcement.title}
                          onChange={(e) => setAnnouncement((p) => ({ ...p, title: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                          Isi Pengumuman
                        </label>
                        <textarea
                          className="input-field rounded-2xl"
                          rows={4}
                          placeholder="Tulis isi pengumuman di sini..."
                          value={announcement.content}
                          onChange={(e) => setAnnouncement((p) => ({ ...p, content: e.target.value }))}
                          required
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                            Kategori
                          </label>
                          <select
                            className="input-field rounded-2xl"
                            value={announcement.kategori}
                            onChange={(e) => setAnnouncement((p) => ({ ...p, kategori: e.target.value as typeof p.kategori }))}
                          >
                            <option value="info">Info</option>
                            <option value="pengumuman">Pengumuman</option>
                            <option value="kegiatan">Kegiatan</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                            Tanggal Terbit
                          </label>
                          <input
                            type="date"
                            className="input-field rounded-2xl"
                            value={announcement.date}
                            onChange={(e) => setAnnouncement((p) => ({ ...p, date: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={announcement.publishNow}
                          onChange={(e) => setAnnouncement((p) => ({ ...p, publishNow: e.target.checked }))}
                        />
                        <span>Langsung publish (tampil di halaman publik)</span>
                      </label>

                      <button
                        type="submit"
                        disabled={announcementSaving}
                        className="w-full py-3 rounded-2xl font-bold text-white bg-[#0260D4]    hover:shadow-md transition cursor-pointer shadow-xs disabled:opacity-50 text-sm"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        <Icon name="megaphone" size={16} className="inline mr-2 align-text-bottom" />
                        {announcementSaving ? 'Menyimpan...' : 'Simpan Pengumuman'}
                      </button>
                    </form>
                  )}

                  {/* List of existing announcements */}
                  <div className="bg-white rounded-3xl border border-[#D6E4F0] shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#D6E4F0]">
                      <h3
                        className="font-bold text-[#00142F] text-sm sm:text-base"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        Semua Berita & Pengumuman
                      </h3>
                    </div>
                    {beritaLoading ? (
                      <div className="p-8 text-center text-xs text-slate-400">Memuat berita...</div>
                    ) : beritaList.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">Belum ada berita.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {beritaList.map((b) => (
                          <div key={b.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-[#F4F8FC] transition">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span
                                  className={`text-[0.7rem] px-2.5 py-0.5 rounded-full font-bold ${
                                    b.is_published
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {b.is_published ? 'Published' : 'Draft'}
                                </span>
                                <span className="text-[0.7rem] px-2.5 py-0.5 rounded-full font-bold bg-[#F0F7FF] text-[#002466] uppercase">
                                  {b.kategori}
                                </span>
                              </div>
                              <div className="font-bold text-sm text-[#00142F] leading-snug">{b.judul}</div>
                              <div className="line-clamp-2 text-xs text-slate-500 mt-1">{b.isi}</div>
                              <div className="text-[0.7rem] text-slate-400 mt-1.5">{b.tanggal_terbit}{b.penulis ? ` · ${b.penulis}` : ''}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleTogglePublish(b)}
                                className="text-xs px-3 py-1.5 rounded-xl font-semibold bg-[#F0F7FF] text-[#002466] border border-[#D6E4F0] hover:bg-[#D6E4F0]/30 transition cursor-pointer"
                              >
                                {b.is_published ? 'Jadikan Draft' : 'Publish'}
                              </button>
                              <button
                                onClick={() => handleDeleteBerita(b)}
                                className="text-xs px-3 py-1.5 rounded-xl font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
