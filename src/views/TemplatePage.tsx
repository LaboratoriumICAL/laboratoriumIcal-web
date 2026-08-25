'use client'

import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'

interface TemplateItem {
  id: string
  nama: string
  deskripsi: string | null
  kategori: string
  file_path: string | null
  urutan: number
}

const KATEGORI_ORDER = ['Laporan', 'Power Point Presentasi', 'Cover Tugas Rumah', 'Lembar Kerja', 'Jurnal']

const ICON_BY_KATEGORI: Record<string, string> = {
  Laporan: 'file-text',
  'Power Point Presentasi': 'monitor',
  'Cover Tugas Rumah': 'file-text',
  'Lembar Kerja': 'clipboard-list',
  Jurnal: 'notebook',
}

const BADGE_ICON_BY_KATEGORI: Record<string, string> = {
  Laporan: 'file-text',
  'Power Point Presentasi': 'monitor',
  'Cover Tugas Rumah': 'home',
  'Lembar Kerja': 'clipboard-list',
  Jurnal: 'notebook',
}

// Data spesifik Pedoman Laporan per Bidang Praktikum
const DSK_LAPORAN_ITEMS = [
  { id: 'dsk-modul-1', nama: 'Pedoman DSK Modul 1', file_path: 'PEDOMAN DSK MODUL I.docx' },
  { id: 'dsk-modul-2', nama: 'Pedoman DSK Modul 2', file_path: 'PEDOMAN DSK MODUL II.docx' },
  { id: 'dsk-modul-3', nama: 'Pedoman DSK Modul 3', file_path: 'PEDOMAN DSK MODUL III.docx' },
  { id: 'dsk-modul-4', nama: 'Pedoman DSK Modul 4', file_path: 'PEDOMAN DSK MODUL IV.docx' },
  { id: 'dsk-modul-5', nama: 'Pedoman DSK Modul 5', file_path: 'PEDOMAN DSK MODUL V.docx' },
  { id: 'dsk-laporan-besar', nama: 'Pedoman Laporan Besar DSK', file_path: 'PEDOMAN LP BESAR DSK.docx' },
]

const PLC_LAPORAN_ITEMS = [
  { id: 'plc-modul-1', nama: 'Pedoman PLC Modul 1', file_path: 'PEDOMAN PLC LP M1.docx' },
  { id: 'plc-modul-2', nama: 'Pedoman PLC Modul 2', file_path: 'PEDOMAN PLC LP M2.docx' },
  { id: 'plc-modul-3', nama: 'Pedoman PLC Modul 3', file_path: 'PEDOMAN PLC LP M3.docx' },
  { id: 'plc-modul-4', nama: 'Pedoman PLC Modul 4', file_path: 'PEDOMAN PLC LP M4.docx' },
  { id: 'plc-laporan-besar', nama: 'Pedoman Laporan Besar PLC', file_path: 'LAPORAN BESAR PRAKTIKUM PLC.docx' },
]

function groupByKategori(items: TemplateItem[]) {
  const map = new Map<string, TemplateItem[]>()
  for (const item of items) {
    const list = map.get(item.kategori) || []
    list.push(item)
    map.set(item.kategori, list)
  }
  const orderedKeys = [
    ...KATEGORI_ORDER.filter((k) => map.has(k)),
    ...[...map.keys()].filter((k) => !KATEGORI_ORDER.includes(k)),
  ]
  return orderedKeys.map((kategori) => ({
    kategori,
    items: (map.get(kategori) || []).slice().sort((a, b) => a.urutan - b.urutan),
  }))
}

export default function TemplatePage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLaporanLab, setSelectedLaporanLab] = useState<'dsk' | 'plc' | null>(null)

  useEffect(() => {
    fetch('/api/template-dokumen')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setTemplates(json.templates || [])
      })
      .catch((err) => setError(err.message || 'Gagal memuat daftar template.'))
      .finally(() => setLoading(false))
  }, [])

  const groups = groupByKategori(templates)

  return (
    <div className="min-h-screen" style={{ background: '#F0F5FC' }}>
      {/* Header */}
      <div
        className="relative pt-24 pb-14 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #162D4E 0%, #234575 45%, #537AB8 100%)',
        }}
      >
        {/* Sharp Dot Matrix Background */}
        <div
          className="absolute inset-0 dots-header pointer-events-none opacity-40"
          style={{ zIndex: 1 }}
        />

        {/* Ambient Glow Accents */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(186, 214, 235, 0.2) 0%, transparent 70%)',
            zIndex: 2,
          }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(83, 122, 184, 0.25) 0%, transparent 70%)',
            zIndex: 2,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 text-center" style={{ zIndex: 10 }}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 shadow-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(22, 45, 78, 0.2)',
            }}
          >
            Template Dokumen
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
              lineHeight: 1.2,
              marginBottom: '1.1rem',
              color: 'white',
              textShadow: '0 4px 20px rgba(22, 45, 78, 0.5)',
            }}
          >
            <span className="text-white block">Pusat Template &</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D8EBFF 35%, #BAD6EB 70%, #93C5FD 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(186, 214, 235, 0.6))',
              }}
            >
              Pedoman Laporan
            </span>
          </h1>
          <p
            className="max-w-2xl mx-auto text-base sm:text-lg font-normal"
            style={{
              color: '#E8F1FA',
              lineHeight: 1.7,
              textShadow: '0 2px 8px rgba(22, 45, 78, 0.4)',
            }}
          >
            Unduh format resmi untuk laporan, tugas rumah, dan dokumen praktikum laboratorium lainnya
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14">
        {loading && (
          <div className="text-center py-10" style={{ color: '#2F4D7B' }}>
            <Icon name="loader" size={22} className="inline animate-spin text-[#5C8BC8]" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl px-4 py-3 text-sm mb-6" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
            <Icon name="warning" size={15} className="inline mr-1 align-text-bottom" /> {error}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="rounded-3xl p-10 text-center bg-white" style={{ border: '1.5px solid #C6DBF2' }}>
            <div className="mb-4 flex justify-center"><Icon name="inbox" size={44} color="#94A3B8" strokeWidth={1.5} /></div>
            <p style={{ color: '#2F4D7B' }}>Belum ada template yang tersedia.</p>
          </div>
        )}

        <div className="space-y-12">
          {groups.map((group) => {
            const isLaporanCategory = group.kategori === 'Laporan'

            return (
              <div key={group.kategori}>
                {/* Category title */}
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#EEF4FB] text-[#2F4D7B] border border-[#C6DBF2]">
                      <Icon name={ICON_BY_KATEGORI[group.kategori] || 'file-text'} size={18} />
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: '#1B3258' }}>
                      {group.kategori}
                    </h2>
                  </div>

                  {/* Back button when inside a specific lab's report list */}
                  {isLaporanCategory && selectedLaporanLab && (
                    <button
                      onClick={() => setSelectedLaporanLab(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#102544] bg-white hover:bg-[#EEF5FA] border border-[#BAD6EB] shadow-2xs transition-all cursor-pointer"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      ← Kembali ke Pilihan Praktikum
                    </button>
                  )}
                </div>

                {/* SPECIAL HANDLING FOR 'LAPORAN' CATEGORY */}
                {isLaporanCategory ? (
                  <div>
                    {/* 1. TAMPILAN PERTAMA: HANYA 2 CARD UTAMA */}
                    {selectedLaporanLab === null ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card 1: Pedoman Laporan Dasar Sistem Kontrol */}
                        <div
                          onClick={() => setSelectedLaporanLab('dsk')}
                          className="relative bg-white rounded-3xl p-6 sm:p-8 overflow-hidden card-hover transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                          style={{
                            border: '1.5px solid #BAD6EB',
                            boxShadow: '0 8px 24px rgba(83, 122, 184, 0.1)',
                          }}
                        >
                          {/* Left fluid wave accent */}
                          <svg
                            className="absolute left-0 top-0 bottom-0 h-full w-14 sm:w-16 pointer-events-none"
                            viewBox="0 0 50 160"
                            fill="none"
                            preserveAspectRatio="none"
                          >
                            <path d="M0 0 C 18 35, 24 55, 12 95 C 4 125, 16 148, 0 160 L 0 0 Z" fill="#537AB8" />
                            <path d="M0 0 C 26 38, 32 62, 18 105 C 8 135, 22 152, 0 160" stroke="#BAD6EB" strokeWidth="2.5" fill="none" opacity="0.85" />
                          </svg>

                          {/* Bottom-left dot grid */}
                          <div className="absolute left-3.5 bottom-3.5 grid grid-cols-4 gap-1 opacity-25 pointer-events-none">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <span key={i} className="w-1 h-1 rounded-full bg-[#537AB8]" />
                            ))}
                          </div>

                          <div className="relative z-10 pl-6 sm:pl-8">
                            <h3
                              style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#102544', marginBottom: '0.5rem' }}
                            >
                              Pedoman Laporan Dasar Sistem Kontrol
                            </h3>
                            <p style={{ color: '#4B6B94', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                              Panduan penyusunan dan template laporan mingguan Modul 1 sampai Modul 5 serta Pedoman Laporan Besar praktikum DSK.
                            </p>
                          </div>

                          <div className="relative z-10 pl-6 sm:pl-8 pt-4 border-t border-[#E1EDF8] flex items-center justify-end">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white shadow-md group-hover:shadow-lg transition-all"
                              style={{
                                background: 'linear-gradient(135deg, #162D4E 0%, #294D80 45%, #537AB8 85%, #6E94D2 100%)',
                                fontFamily: 'var(--font-heading)',
                              }}
                            >
                              <span>Buka Modul</span>
                              <span className="transition-transform group-hover:translate-x-1">→</span>
                            </button>
                          </div>
                        </div>

                        {/* Card 2: Pedoman Programmable Logic Controller */}
                        <div
                          onClick={() => setSelectedLaporanLab('plc')}
                          className="relative bg-white rounded-3xl p-6 sm:p-8 overflow-hidden card-hover transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                          style={{
                            border: '1.5px solid #BAD6EB',
                            boxShadow: '0 8px 24px rgba(83, 122, 184, 0.1)',
                          }}
                        >
                          {/* Left fluid wave accent */}
                          <svg
                            className="absolute left-0 top-0 bottom-0 h-full w-14 sm:w-16 pointer-events-none"
                            viewBox="0 0 50 160"
                            fill="none"
                            preserveAspectRatio="none"
                          >
                            <path d="M0 0 C 18 35, 24 55, 12 95 C 4 125, 16 148, 0 160 L 0 0 Z" fill="#537AB8" />
                            <path d="M0 0 C 26 38, 32 62, 18 105 C 8 135, 22 152, 0 160" stroke="#BAD6EB" strokeWidth="2.5" fill="none" opacity="0.85" />
                          </svg>

                          {/* Bottom-left dot grid */}
                          <div className="absolute left-3.5 bottom-3.5 grid grid-cols-4 gap-1 opacity-25 pointer-events-none">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <span key={i} className="w-1 h-1 rounded-full bg-[#537AB8]" />
                            ))}
                          </div>

                          <div className="relative z-10 pl-6 sm:pl-8">
                            <h3
                              style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#102544', marginBottom: '0.5rem' }}
                            >
                              Pedoman Programmable Logic Controller
                            </h3>
                            <p style={{ color: '#4B6B94', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                              Panduan penyusunan dan template laporan mingguan Modul 1 sampai Modul 4 serta Pedoman Laporan Besar praktikum PLC.
                            </p>
                          </div>

                          <div className="relative z-10 pl-6 sm:pl-8 pt-4 border-t border-[#E1EDF8] flex items-center justify-end">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white shadow-md group-hover:shadow-lg transition-all"
                              style={{
                                background: 'linear-gradient(135deg, #162D4E 0%, #294D80 45%, #537AB8 85%, #6E94D2 100%)',
                                fontFamily: 'var(--font-heading)',
                              }}
                            >
                              <span>Buka Modul</span>
                              <span className="transition-transform group-hover:translate-x-1">→</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 2. TAMPILAN DETAIL MODUL KETIKA SALAH SATU DIKLIK */
                      <div className="space-y-4">
                        {/* Grid Card Modul Spesifik */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(selectedLaporanLab === 'dsk' ? DSK_LAPORAN_ITEMS : PLC_LAPORAN_ITEMS).map((item) => {
                            const isLaporanBesar = item.nama.toLowerCase().includes('laporan besar')

                            return (
                              <div
                                key={item.id}
                                className="relative bg-white rounded-3xl p-5 sm:p-6 overflow-hidden card-hover transition-all duration-300 flex items-center gap-4 sm:gap-5"
                                style={{
                                  border: isLaporanBesar ? '1.5px solid #0A58BE' : '1.5px solid #BAD6EB',
                                  boxShadow: '0 8px 24px rgba(83, 122, 184, 0.08)',
                                }}
                              >
                                {/* Left fluid wave accent */}
                                <svg
                                  className="absolute left-0 top-0 bottom-0 h-full w-14 sm:w-16 pointer-events-none"
                                  viewBox="0 0 50 160"
                                  fill="none"
                                  preserveAspectRatio="none"
                                >
                                  <path d="M0 0 C 18 35, 24 55, 12 95 C 4 125, 16 148, 0 160 L 0 0 Z" fill={isLaporanBesar ? '#0A58BE' : '#537AB8'} />
                                  <path d="M0 0 C 26 38, 32 62, 18 105 C 8 135, 22 152, 0 160" stroke="#BAD6EB" strokeWidth="2.5" fill="none" opacity="0.85" />
                                </svg>

                                {/* Bottom-left dot grid */}
                                <div className="absolute left-3.5 bottom-3.5 grid grid-cols-4 gap-1 opacity-25 pointer-events-none">
                                  {Array.from({ length: 12 }).map((_, i) => (
                                    <span key={i} className="w-1 h-1 rounded-full bg-[#537AB8]" />
                                  ))}
                                </div>

                                {/* Top-Right Bookmark Ribbon */}
                                <div
                                  className="absolute top-0 right-7 sm:right-8 w-6 sm:w-7 h-8 sm:h-9 flex items-center justify-center pt-0.5 text-white shadow-xs pointer-events-none z-10"
                                  style={{
                                    background: isLaporanBesar
                                      ? 'linear-gradient(135deg, #0A58BE 0%, #164E8E 100%)'
                                      : 'linear-gradient(135deg, #162D4E 0%, #294D80 45%, #537AB8 85%, #6E94D2 100%)',
                                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)',
                                  }}
                                >
                                  <Icon name="download" size={13} color="white" />
                                </div>

                                {/* Left Circle Icon Badge */}
                                <div className="relative z-10 pl-2 shrink-0">
                                  <div
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                                    style={{
                                      background: '#EEF4FB',
                                      border: '1.5px solid #BAD6EB',
                                      boxShadow: '0 4px 12px rgba(83, 122, 184, 0.1)',
                                    }}
                                  >
                                    <Icon name="file-text" size={24} color="#162D4E" />
                                  </div>
                                </div>

                                {/* Right Content */}
                                <div className="relative z-10 flex-1 min-w-0 pr-5">
                                  <h3
                                    className="font-bold text-[0.92rem] sm:text-[1rem] leading-snug line-clamp-2 mb-2"
                                    style={{
                                      fontFamily: 'var(--font-heading)',
                                      color: '#102544',
                                    }}
                                  >
                                    {item.nama}
                                  </h3>

                                  {/* Decorative dash and dots */}
                                  <div className="flex items-center gap-1.5 mb-3">
                                    <span className="w-7 h-[3px] rounded-full bg-[#537AB8]" />
                                    <span className="w-1 h-1 rounded-full bg-[#537AB8] opacity-80" />
                                    <span className="w-1 h-1 rounded-full bg-[#537AB8] opacity-60" />
                                    <span className="w-1 h-1 rounded-full bg-[#537AB8] opacity-40" />
                                  </div>

                                  {/* Download button */}
                                  <a
                                    href={`/api/download-template?file=${encodeURIComponent(item.file_path)}`}
                                    download={item.file_path}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full font-bold text-xs sm:text-sm text-white shadow-xs hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                                    style={{
                                      background: 'linear-gradient(135deg, #162D4E 0%, #294D80 45%, #537AB8 85%, #6E94D2 100%)',
                                      fontFamily: 'var(--font-heading)',
                                    }}
                                  >
                                    <Icon name="download" size={14} color="white" />
                                    <span>Unduh</span>
                                  </a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* OTHER CATEGORIES (Power Point, Cover Tugas Rumah, Lembar Kerja, Jurnal) */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.items.map((item) => {
                      const belumAda = !item.file_path
                      const badgeIcon = BADGE_ICON_BY_KATEGORI[group.kategori] || 'file-text'

                      return (
                        <div
                          key={item.id}
                          className="relative bg-white rounded-3xl p-5 sm:p-6 overflow-hidden card-hover transition-all duration-300 flex items-center gap-4 sm:gap-5"
                          style={{
                            border: '1.5px solid #BAD6EB',
                            boxShadow: '0 8px 24px rgba(83, 122, 184, 0.08)',
                          }}
                        >
                          {/* Left fluid wave accent */}
                          <svg
                            className="absolute left-0 top-0 bottom-0 h-full w-14 sm:w-16 pointer-events-none"
                            viewBox="0 0 50 160"
                            fill="none"
                            preserveAspectRatio="none"
                          >
                            <path d="M0 0 C 18 35, 24 55, 12 95 C 4 125, 16 148, 0 160 L 0 0 Z" fill="#537AB8" />
                            <path d="M0 0 C 26 38, 32 62, 18 105 C 8 135, 22 152, 0 160" stroke="#BAD6EB" strokeWidth="2.5" fill="none" opacity="0.85" />
                          </svg>

                          {/* Bottom-left dot grid */}
                          <div className="absolute left-3.5 bottom-3.5 grid grid-cols-4 gap-1 opacity-25 pointer-events-none">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <span key={i} className="w-1 h-1 rounded-full bg-[#537AB8]" />
                            ))}
                          </div>

                          {/* Top-Right Bookmark Ribbon */}
                          <div
                            className="absolute top-0 right-7 sm:right-8 w-6 sm:w-7 h-8 sm:h-9 flex items-center justify-center pt-0.5 text-white shadow-xs pointer-events-none z-10"
                            style={{
                              background: 'linear-gradient(135deg, #162D4E 0%, #294D80 45%, #537AB8 85%, #6E94D2 100%)',
                              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)',
                            }}
                          >
                            <Icon name="download" size={13} color="white" />
                          </div>

                          {/* Left Circle Icon Badge */}
                          <div className="relative z-10 pl-2 shrink-0">
                            <div
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                              style={{
                                background: '#EEF4FB',
                                border: '1.5px solid #BAD6EB',
                                boxShadow: '0 4px 12px rgba(83, 122, 184, 0.1)',
                              }}
                            >
                              <Icon name={badgeIcon} size={24} color="#162D4E" />
                            </div>
                          </div>

                          {/* Right Content */}
                          <div className="relative z-10 flex-1 min-w-0 pr-5">
                            <h3
                              className="font-bold text-[0.92rem] sm:text-[1rem] leading-snug line-clamp-2 mb-2"
                              style={{
                                fontFamily: 'var(--font-heading)',
                                color: '#102544',
                              }}
                            >
                              {item.nama}
                            </h3>

                            {/* Decorative dash and dots */}
                            <div className="flex items-center gap-1.5 mb-3">
                              <span className="w-7 h-[3px] rounded-full bg-[#537AB8]" />
                              <span className="w-1 h-1 rounded-full bg-[#537AB8] opacity-80" />
                              <span className="w-1 h-1 rounded-full bg-[#537AB8] opacity-60" />
                              <span className="w-1 h-1 rounded-full bg-[#537AB8] opacity-40" />
                            </div>

                            {/* Download button */}
                            {belumAda ? (
                              <button
                                disabled
                                className="inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full font-bold text-xs sm:text-sm"
                                style={{ background: '#F1F5F9', color: '#94A3B8', fontFamily: 'var(--font-heading)', cursor: 'not-allowed' }}
                              >
                                <Icon name="download" size={13} /> Belum Ada
                              </button>
                            ) : (
                              <a
                                href={`/api/download-template?file=${encodeURIComponent(item.file_path || '')}`}
                                download={item.file_path || true}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full font-bold text-xs sm:text-sm text-white shadow-xs hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                                style={{
                                  background: 'linear-gradient(135deg, #162D4E 0%, #294D80 45%, #537AB8 85%, #6E94D2 100%)',
                                  fontFamily: 'var(--font-heading)',
                                }}
                              >
                                <Icon name="download" size={14} color="white" />
                                <span>Unduh</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
