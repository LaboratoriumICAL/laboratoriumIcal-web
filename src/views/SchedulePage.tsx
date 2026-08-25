import { useEffect, useState, useMemo } from 'react'
import { Icon } from '../components/Icon'

interface PraktikumOption { id: string; kode: string; nama: string }
interface JurusanOption { id: string; kode: string; nama: string; kelasTersedia: string[]; praktikum: PraktikumOption[] }
interface Member { name: string; nim: string }
interface Group { id: string; shift: number | null; assistant: string; hari?: string; jamMulai?: string; jamSelesai?: string; ruangan?: string; members: Member[] }
interface ScheduleEntry { label: string; date: string }

export default function SchedulePage() {
  const [jurusanList, setJurusanList] = useState<JurusanOption[]>([])
  const [loadingJurusan, setLoadingJurusan] = useState(true)

  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedPracticum, setSelectedPracticum] = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  const [results, setResults] = useState<Group[] | null>(null)
  const [scheduleDates, setScheduleDates] = useState<ScheduleEntry[]>([])
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [memberSearchTerm, setMemberSearchTerm] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/jurusan')
      .then((r) => r.json())
      .then((json) => setJurusanList(json.jurusan || []))
      .catch(() => setJurusanList([]))
      .finally(() => setLoadingJurusan(false))
  }, [])

  const JENIS_PRAKTIKUM_TETAP = [
    { kode: 'DSK', nama: 'Dasar Sistem Kontrol' },
    { kode: 'PLC', nama: 'Programmable Logic Controller' },
    { kode: 'SKI', nama: 'Sistem Kontrol Industri' },
  ]

  const currentJurusan = jurusanList.find((j) => j.kode === selectedProgram)
  const availableClasses = currentJurusan?.kelasTersedia || []

  const practicumUnavailable =
    !!selectedProgram &&
    !!selectedPracticum &&
    !currentJurusan?.praktikum.some((p) => p.kode === selectedPracticum)

  const canSearch = !!selectedProgram && !!selectedPracticum && !!selectedClass && !practicumUnavailable

  const handleSearch = async () => {
    if (!canSearch) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/jadwal?praktikum=${encodeURIComponent(selectedPracticum)}&kelas=${encodeURIComponent(selectedClass)}&jurusan=${encodeURIComponent(selectedProgram)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat jadwal')
      setResults(json.groups || [])
      setScheduleDates(json.scheduleDates || [])
      setSearched(true)
      setOpenGroup(null)
      setMemberSearchTerm('')
    } catch (err: any) {
      setError(err.message)
      setResults([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedProgram('')
    setSelectedPracticum('')
    setSelectedClass('')
    setResults(null)
    setScheduleDates([])
    setSearched(false)
    setOpenGroup(null)
    setMemberSearchTerm('')
    setError('')
  }

  const filteredResults = useMemo(() => {
    if (!results) return []
    const q = memberSearchTerm.toLowerCase().trim()
    if (!q) return results
    return results.filter((g) => {
      const hasMember = (g.members || []).some(
        (m) => (m.name || '').toLowerCase().includes(q) || (m.nim || '').toLowerCase().includes(q)
      )
      const hasAssistant = (g.assistant || '').toLowerCase().includes(q)
      const hasGroupId = (g.id || '').toLowerCase().includes(q)
      return hasMember || hasAssistant || hasGroupId
    })
  }, [results, memberSearchTerm])

  return (
    <div className="min-h-screen" style={{ background: '#F0F5FC' }}>
      {/* Header */}
      <div
        className="relative pt-24 pb-14 overflow-hidden mb-6"
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
            Jadwal Praktikum
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
            <span className="text-white block">Jadwal Praktikum</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D8EBFF 35%, #BAD6EB 70%, #93C5FD 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(186, 214, 235, 0.6))',
              }}
            >
              Laboratorium ICAL
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
            Pilih program studi, jenis praktikum, dan kelas untuk menemukan jadwal dan kelompokmu secara cepat
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        {/* Search card */}
        <div
          className="rounded-3xl p-6 sm:p-8 mb-8 bg-white"
          style={{
            border: '1.5px solid #C6DBF2',
            boxShadow: '0 8px 32px rgba(92, 139, 200,0.08)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#1B3258', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
            <Icon name="search" size={18} className="inline mr-1.5 align-text-bottom text-[#5C8BC8]" /> Filter Pencarian
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                Jurusan
              </label>
              <select
                className="input-field"
                value={selectedProgram}
                onChange={(e) => { setSelectedProgram(e.target.value); setSelectedPracticum(''); setSelectedClass(''); setResults(null); }}
                disabled={loadingJurusan}
              >
                <option value="">{loadingJurusan ? 'Memuat...' : '-- Pilih Jurusan --'}</option>
                {jurusanList.map((j) => <option key={j.id} value={j.kode}>{j.nama}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                Jenis Praktikum
              </label>
              <select
                className="input-field"
                value={selectedPracticum}
                onChange={(e) => { setSelectedPracticum(e.target.value); setSelectedClass(''); setResults(null); }}
                disabled={!selectedProgram}
              >
                <option value="">-- Pilih Praktikum --</option>
                {JENIS_PRAKTIKUM_TETAP.map((p) => <option key={p.kode} value={p.kode}>{p.nama}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#2F4D7B', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                Kelas
              </label>
              <select
                className="input-field"
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setResults(null); }}
                disabled={!selectedProgram || !selectedPracticum || loadingJurusan}
              >
                <option value="">
                  {loadingJurusan ? 'Memuat kelas...' : !selectedPracticum ? '-- Pilih Praktikum Dulu --' : availableClasses.length === 0 ? '-- Tidak Ada Kelas --' : '-- Pilih Kelas --'}
                </option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={!canSearch || loading}
            className="w-full btn-primary justify-center py-3.5"
            style={{ opacity: canSearch && !loading ? 1 : 0.6 }}
          >
            {loading ? (
              <><Icon name="loader" size={18} className="animate-spin mr-2" /> Mencari Jadwal...</>
            ) : (
              <><Icon name="search" size={18} className="mr-1.5" /> Cari Jadwal & Kelompok</>
            )}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-2xl p-4 mb-6 flex items-start gap-3 bg-red-50 border border-red-200">
            <Icon name="warning" size={18} color="#EF4444" className="shrink-0 mt-0.5" />
            <p style={{ color: '#EF4444', fontSize: '0.9rem' }}>{error}</p>
          </div>
        )}

        {/* Schedule dates */}
        {searched && scheduleDates.length > 0 && (
          <div
            className="rounded-3xl p-6 mb-6"
            style={{ background: '#EEF5FA', border: '1.5px solid #C6DBF2' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#1B3258', marginBottom: '0.75rem' }}>
              <Icon name="calendar" size={16} className="inline mr-1.5 align-text-bottom text-[#5C8BC8]" /> Jadwal Pertemuan
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {scheduleDates.map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-3 text-center bg-white shadow-xs"
                  style={{ border: '1px solid #C6DBF2' }}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8rem', color: '#2F4D7B' }}>{s.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#2F4D7B', marginTop: '3px' }}>{s.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {searched && results !== null && !error && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#1B3258', fontSize: '1.2rem', marginBottom: '0.75rem' }}>
              {results.length > 0
                ? (<><Icon name="clipboard-list" size={17} className="inline mr-1.5 align-text-bottom text-[#5C8BC8]" /> Ditemukan {results.length} Kelompok — Kelas {selectedClass}</>)
                : (<><Icon name="frown" size={17} className="inline mr-1.5 align-text-bottom" /> Tidak Ada Data</>)}
            </h2>

            {/* Fitur Cari Nama Praktikan / NIM (Tengah & Presisi) */}
            {results.length > 0 && (
              <div className="my-6 flex flex-col items-center justify-center text-center">
                <div className="relative w-full max-w-lg">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#537AB8]">
                    <Icon name="search" size={18} />
                  </div>
                  <input
                    type="text"
                    className="input-field bg-white transition-all text-sm sm:text-base rounded-2xl"
                    placeholder="Cari nama praktikan atau NIM..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    style={{
                      paddingLeft: '2.85rem',
                      paddingRight: '2.85rem',
                      borderColor: memberSearchTerm ? '#537AB8' : '#C6DBF2',
                      boxShadow: memberSearchTerm
                        ? '0 0 0 4px rgba(83, 122, 184, 0.18), 0 4px 16px rgba(92, 139, 200, 0.1)'
                        : '0 2px 10px rgba(92, 139, 200, 0.06)',
                    }}
                  />
                  {memberSearchTerm && (
                    <button
                      onClick={() => setMemberSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#5D789B] hover:text-[#1B3258] transition-colors cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#E2EDF8] hover:bg-[#C6DBF2] text-[#2F4D7B] flex items-center justify-center text-xs font-bold">
                        ✕
                      </span>
                    </button>
                  )}
                </div>
                {memberSearchTerm.trim() && (
                  <div className="mt-2.5 text-xs font-semibold text-[#2F4D7B] flex items-center justify-center gap-2 animate-fadeIn">
                    <span>Hasil pencarian untuk: <strong className="text-[#1B3258]">&ldquo;{memberSearchTerm}&rdquo;</strong></span>
                    <span className="text-slate-400">•</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EEF5FA] text-[#537AB8] border border-[#C6DBF2] font-bold">
                      {filteredResults.length} kelompok ditemukan
                    </span>
                  </div>
                )}
              </div>
            )}

            {results.length === 0 && (
              <div
                className="rounded-3xl p-10 text-center bg-white"
                style={{ border: '1.5px solid #C6DBF2' }}
              >
                <div className="mb-4 flex justify-center"><Icon name="inbox" size={44} color="#94A3B8" strokeWidth={1.5} /></div>
                <p style={{ color: '#2F4D7B' }}>Data jadwal untuk kelas ini belum tersedia. Kelompok & anggota diisi oleh asisten.</p>
              </div>
            )}

            {results.length > 0 && memberSearchTerm.trim() && filteredResults.length === 0 && (
              <div
                className="rounded-3xl p-8 text-center bg-white mb-6"
                style={{ border: '1.5px solid #C6DBF2' }}
              >
                <div className="mb-3 flex justify-center text-[#5C8BC8]"><Icon name="search" size={36} /></div>
                <p className="font-bold text-[#1B3258] mb-1">Praktikan Tidak Ditemukan</p>
                <p style={{ color: '#5D789B', fontSize: '0.85rem' }}>
                  Tidak ada praktikan dengan nama atau NIM &ldquo;{memberSearchTerm}&rdquo; di Kelas {selectedClass}.
                </p>
                <button
                  onClick={() => setMemberSearchTerm('')}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-bold text-[#2F4D7B] bg-[#EEF5FA] hover:bg-[#E2EDF8] transition-colors cursor-pointer"
                >
                  Reset Pencarian
                </button>
              </div>
            )}

            <div className="space-y-3">
              {[1, 2].map((shift) => {
                const shiftGroups = filteredResults.filter((g) => g.shift === shift)
                const unassigned = shift === 1 ? filteredResults.filter((g) => g.shift !== 1 && g.shift !== 2) : []
                const listForShift = shift === 1 ? [...shiftGroups, ...unassigned] : shiftGroups
                if (!listForShift.length) return null
                return (
                  <div key={shift}>
                    <div
                      className="flex items-center gap-3 mb-3"
                      style={{ color: '#1B3258', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}
                    >
                      <span
                        className="px-3.5 py-1 rounded-full text-white text-sm shadow-xs font-semibold"
                        style={{ background: '#537AB8' }}
                      >
                        Shift {shift}
                      </span>
                      <span style={{ color: '#2F4D7B', fontWeight: 400, fontSize: '0.85rem' }}>
                        {shift === 1 ? '08.00 – 11.00 WIB' : '13.00 – 16.00 WIB'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
                      {listForShift.map((group) => {
                        const isExpanded = memberSearchTerm.trim() ? true : openGroup === group.id
                        const queryLower = memberSearchTerm.toLowerCase().trim()

                        return (
                          <div key={group.id}>
                            <div
                              className="rounded-2xl p-4 card-hover cursor-pointer transition-all"
                              style={{
                                background: isExpanded ? '#EEF5FA' : 'white',
                                border: `1.5px solid ${isExpanded ? '#5C8BC8' : '#C6DBF2'}`,
                                boxShadow: '0 4px 16px rgba(92, 139, 200,0.08)',
                              }}
                              onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div
                                  className="min-w-[2.75rem] h-10 px-2.5 rounded-xl flex items-center justify-center text-center text-white font-bold shadow-xs shrink-0"
                                  style={{
                                    background: '#537AB8',
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: group.id.length > 3 ? '0.78rem' : '0.875rem',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {group.id}
                                </div>
                                <span style={{ fontSize: '1.2rem', color: '#5C8BC8' }}>{isExpanded ? '▲' : '▼'}</span>
                              </div>
                              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#1B3258', fontSize: '0.95rem' }}>
                                Kelompok {group.id}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#2F4D7B', marginTop: '4px' }}>
                                <Icon name="user" size={12} className="inline mr-1 align-text-bottom text-[#5C8BC8]" /> Asisten: <strong style={{ color: '#2F4D7B' }}>{group.assistant}</strong>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#5D789B', marginTop: '2px' }}>
                                {group.members.length} praktikan{group.ruangan ? ` · ${group.ruangan}` : ''}
                              </div>
                            </div>

                            {isExpanded && (
                              <div
                                className="rounded-b-2xl -mt-2 pt-4 px-4 pb-4 animate-slideIn bg-white"
                                style={{ border: '1.5px solid #5C8BC8', borderTop: 'none' }}
                              >
                                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#1B3258', fontSize: '0.85rem', marginBottom: '8px' }}>
                                  Daftar Anggota Kelompok {group.id}
                                </div>
                                <div
                                  className="text-xs mb-3 px-3 py-2 rounded-xl"
                                  style={{ background: '#EEF4FB', color: '#2F4D7B', fontWeight: 600, border: '1px solid #C6DBF2' }}
                                >
                                  <Icon name="user" size={12} className="inline mr-1 align-text-bottom" /> Asisten Pendamping: {group.assistant}
                                </div>
                                {group.members.length === 0 ? (
                                  <p style={{ fontSize: '0.8rem', color: '#5D789B' }}>Belum ada anggota untuk kelompok ini.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {group.members.map((m, i) => {
                                      const isMatch = queryLower && (
                                        (m.name || '').toLowerCase().includes(queryLower) ||
                                        (m.nim || '').toLowerCase().includes(queryLower)
                                      )

                                      return (
                                        <div
                                          key={i}
                                          className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                                          style={{
                                            background: isMatch ? '#FEF9C3' : '#F8FAFC',
                                            border: isMatch ? '1.5px solid #FACC15' : '1px solid #E2E8F0',
                                            boxShadow: isMatch ? '0 2px 8px rgba(250, 204, 21, 0.25)' : 'none',
                                          }}
                                        >
                                          <span
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                            style={{
                                              background: isMatch
                                                ? '#D97706'
                                                : 'linear-gradient(135deg, #162D4E 0%, #294D80 45%, #537AB8 85%, #6E94D2 100%)',
                                            }}
                                          >
                                            {i + 1}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isMatch ? '#78350F' : '#1B3258' }}>
                                              {m.name}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: isMatch ? '#B45309' : '#5D789B' }}>
                                              {m.nim}
                                            </div>
                                          </div>
                                          {isMatch && (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 shrink-0">
                                              Cocok
                                            </span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
