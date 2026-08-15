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

// Urutan tampil kategori di halaman (sesuai urutan yang diminta).
// Kategori baru yang belum terdaftar di sini otomatis ditambahkan di akhir.
const KATEGORI_ORDER = ['Power Point Presentasi', 'Laporan', 'Cover Tugas Rumah', 'Lembar Kerja', 'Jurnal']

const ICON_BY_KATEGORI: Record<string, string> = {
  'Power Point Presentasi': 'monitor',
  Laporan: 'file-text',
  'Cover Tugas Rumah': 'file-text',
  'Lembar Kerja': 'clipboard-list',
  Jurnal: 'notebook',
}

const BADGE_ICON_BY_KATEGORI: Record<string, string> = {
  'Power Point Presentasi': 'monitor',
  Laporan: 'file-text',
  'Cover Tugas Rumah': 'home',
  'Lembar Kerja': 'clipboard-list',
  Jurnal: 'notebook',
}

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
    <div className="min-h-screen" style={{ background: '#f0fbfb' }}>
      {/* Header */}
      <div
        className="relative pt-24 pb-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #014346, #015c61, #016e75)' }}
      >
        <div className="absolute inset-0 dots-bg opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 text-center">
          <div className="section-badge mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Icon name="file-text" size={14} /> Template
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'white' }}>
            Template Dokumen
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.75rem', fontSize: '1rem' }}>
            Unduh format resmi untuk laporan, tugas rumah, dan dokumen praktikum lainnya
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14">
        {loading && (
          <div className="text-center py-10" style={{ color: '#64748b' }}>
            <Icon name="loader" size={22} className="inline animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-6" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            <Icon name="warning" size={15} className="inline mr-1 align-text-bottom" /> {error}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'white', border: '1.5px solid #e0f7fa' }}>
            <div className="mb-4 flex justify-center"><Icon name="inbox" size={44} color="#94a3b8" strokeWidth={1.5} /></div>
            <p style={{ color: '#64748b' }}>Belum ada template yang tersedia.</p>
          </div>
        )}

        <div className="space-y-12">
          {groups.map((group) => (
            <div key={group.kategori}>
              {/* Category title */}
              <div className="flex items-center gap-2.5 mb-6">
                <Icon name={ICON_BY_KATEGORI[group.kategori] || 'file-text'} size={24} color="#015c61" />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: '#015c61' }}>
                  {group.kategori}
                </h2>
              </div>

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((item) => {
                  const belumAda = !item.file_path
                  const displayName = item.nama ? item.nama.replace(/Laporan Praktikum Modul/gi, 'Pedoman Laporan Modul') : ''
                  const badgeIcon = BADGE_ICON_BY_KATEGORI[group.kategori] || 'file-text'

                  return (
                    <div
                      key={item.id}
                      className="relative bg-white rounded-3xl p-5 sm:p-6 overflow-hidden card-hover transition-all duration-300 flex items-center gap-4 sm:gap-5"
                      style={{
                        border: '1.5px solid #d8f3f5',
                        boxShadow: '0 8px 24px rgba(1,92,97,0.06)',
                      }}
                    >
                      {/* Left fluid wave accent */}
                      <svg
                        className="absolute left-0 top-0 bottom-0 h-full w-14 sm:w-16 pointer-events-none"
                        viewBox="0 0 50 160"
                        fill="none"
                        preserveAspectRatio="none"
                      >
                        <path d="M0 0 C 18 35, 24 55, 12 95 C 4 125, 16 148, 0 160 L 0 0 Z" fill="#015c61" />
                        <path d="M0 0 C 26 38, 32 62, 18 105 C 8 135, 22 152, 0 160" stroke="#a5eef2" strokeWidth="2.5" fill="none" opacity="0.75" />
                      </svg>

                      {/* Bottom-left dot grid */}
                      <div className="absolute left-3.5 bottom-3.5 grid grid-cols-4 gap-1 opacity-25 pointer-events-none">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <span key={i} className="w-1 h-1 rounded-full bg-[#015c61]" />
                        ))}
                      </div>

                      {/* Top-Right Bookmark Ribbon */}
                      <div
                        className="absolute top-0 right-7 sm:right-8 w-6 sm:w-7 h-8 sm:h-9 flex items-center justify-center pt-0.5 text-white shadow-sm pointer-events-none z-10"
                        style={{
                          background: 'linear-gradient(180deg, #014346, #015c61)',
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
                            background: '#f0fbfb',
                            border: '1.5px solid #d2f3f5',
                            boxShadow: '0 4px 12px rgba(1,92,97,0.06)',
                          }}
                        >
                          <Icon name={badgeIcon} size={24} color="#015c61" />
                        </div>
                      </div>

                      {/* Right Content */}
                      <div className="relative z-10 flex-1 min-w-0 pr-5">
                        <h3
                          className="font-bold text-[0.92rem] sm:text-[1rem] leading-snug line-clamp-2 mb-2"
                          style={{
                            fontFamily: 'var(--font-heading)',
                            color: '#014346',
                          }}
                        >
                          {displayName}
                        </h3>

                        {/* Decorative dash and dots */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="w-7 h-[3px] rounded-full bg-[#06aeb7]" />
                          <span className="w-1 h-1 rounded-full bg-[#06aeb7] opacity-80" />
                          <span className="w-1 h-1 rounded-full bg-[#06aeb7] opacity-60" />
                          <span className="w-1 h-1 rounded-full bg-[#06aeb7] opacity-40" />
                        </div>

                        {/* Download button */}
                        {belumAda ? (
                          <button
                            disabled
                            className="inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full font-bold text-xs sm:text-sm"
                            style={{ background: '#e0f7fa', color: '#94a3b8', fontFamily: 'var(--font-heading)', cursor: 'not-allowed' }}
                          >
                            <Icon name="download" size={13} /> Belum Ada
                          </button>
                        ) : (
                          <a
                            href={`/template/${item.file_path}`}
                            download
                            className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full font-bold text-xs sm:text-sm text-white shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                            style={{
                              background: 'linear-gradient(135deg, #015c61, #06aeb7)',
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
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
