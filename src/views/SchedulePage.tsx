import { useEffect, useState, useMemo } from 'react'
import { Icon } from '../components/Icon'

interface PraktikumOption { id: string; kode: string; nama: string }
interface JurusanOption { id: string; kode: string; nama: string; kelasTersedia: string[]; praktikum: PraktikumOption[] }
interface Member { name: string; nim: string; hasAccount?: boolean }
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

  interface AvailableKelasItem {
    id: string
    nama_kelas: string
    totalKelompok: number
    totalMahasiswa: number
  }
  const [availableClasses, setAvailableClasses] = useState<AvailableKelasItem[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)

  useEffect(() => {
    if (!selectedProgram || !selectedPracticum) {
      setAvailableClasses([])
      setSelectedClass('')
      return
    }

    const currentJ = jurusanList.find((j) => j.kode === selectedProgram)
    const isUnavail = !currentJ?.praktikum.some((p) => p.kode === selectedPracticum)
    if (isUnavail) {
      setAvailableClasses([])
      setSelectedClass('')
      return
    }

    setLoadingClasses(true)
    fetch(`/api/kelas-praktikum?praktikum=${encodeURIComponent(selectedPracticum)}&jurusan=${encodeURIComponent(selectedProgram)}&onlyWithData=true`)
      .then((r) => r.json())
      .then((json) => {
        const list = (json.kelas || []) as AvailableKelasItem[]
        setAvailableClasses(list)
        if (selectedClass && !list.some((k) => k.nama_kelas === selectedClass)) {
          setSelectedClass('')
        }
      })
      .catch(() => setAvailableClasses([]))
      .finally(() => setLoadingClasses(false))
  }, [selectedProgram, selectedPracticum, jurusanList])

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
    <div className="min-h-screen" style={{ background: '#F4F8FC' }}>
      {/* Header */}
      <div
        className="relative pt-24 pb-14 overflow-hidden mb-6"
        style={{
          background: 'linear-gradient(135deg, #00142F 0%, #062B57 40%, #0C4E9C 75%, #0284C7 100%)',
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
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
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
              boxShadow: '0 4px 16px rgba(0, 20, 47, 0.2)',
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
              textShadow: '0 4px 20px rgba(0, 20, 47, 0.5)',
            }}
          >
            <span className="text-white block">Jadwal Praktikum</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #D8EBFF 35%, #7DD3FC 70%, #38BDF8 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.6))',
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
              textShadow: '0 2px 8px rgba(0, 20, 47, 0.4)',
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
            border: '1.5px solid #D6E4F0',
            boxShadow: '0 8px 32px rgba(0, 20, 47, 0.06)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#00142F', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
            <Icon name="search" size={18} className="inline mr-1.5 align-text-bottom text-[#0260D4]" /> Filter Pencarian
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#002466', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
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
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#002466', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
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
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#002466', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                Kelas
              </label>
              <select
                className="input-field"
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setResults(null); }}
                disabled={!selectedProgram || !selectedPracticum || loadingJurusan || loadingClasses || practicumUnavailable || availableClasses.length === 0}
              >
                <option value="">
                  {loadingJurusan || loadingClasses
                    ? 'Memuat kelas...'
                    : !selectedProgram
                    ? '-- Pilih Jurusan Dulu --'
                    : !selectedPracticum
                    ? '-- Pilih Praktikum Dulu --'
                    : practicumUnavailable
                    ? '-- Praktikum Belum Dibuka --'
                    : availableClasses.length === 0
                    ? '-- Jadwal Belum Dirilis Asisten --'
                    : '-- Pilih Kelas --'}
                </option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.nama_kelas}>
                    Kelas {cls.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProgram && selectedPracticum && !practicumUnavailable && !loadingClasses && availableClasses.length === 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-center gap-3 text-amber-900 shadow-2xs">
              <Icon name="clock" size={20} className="shrink-0 text-amber-600" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold">Jadwal Belum Dirilis:</span> Data pembagian kelompok dan jadwal untuk {selectedPracticum} di prodi ini sedang dipersiapkan oleh asisten laboratorium. Silakan cek kembali secara berkala.
              </div>
            </div>
          )}

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
            className="rounded-3xl p-6 sm:p-7 mb-7 relative overflow-hidden text-white"
            style={{
              background: 'linear-gradient(135deg, #000B1A 0%, #00183F 45%, #002B66 100%)',
              boxShadow: '0 16px 36px -10px rgba(0, 11, 26, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {/* Ambient Lighting & High-Tech Orbs */}
            <div className="absolute -right-8 -bottom-8 w-60 h-60 rounded-full bg-[#0284C7]/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-60 h-60 rounded-full bg-[#0260D4]/20 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                <span className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#38BDF8] shadow-xs">
                  <Icon name="calendar" size={17} />
                </span>
                Jadwal Pertemuan Praktikum
              </h3>
              <span className="text-xs text-[#BAE6FD] font-medium hidden sm:inline-block">
                Semester Ganjil 2026/2027
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 relative z-10">
              {scheduleDates.map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-3.5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#38BDF8]/50 group relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
                  }}
                >
                  <div
                    className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition-colors"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {s.label}
                  </div>
                  <div className="text-[0.7rem] text-[#BAE6FD]/85 mt-1 font-medium">
                    {s.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {searched && results !== null && !error && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#00142F', fontSize: '1.2rem', marginBottom: '0.75rem' }}>
              {results.length > 0
                ? (<><Icon name="clipboard-list" size={17} className="inline mr-1.5 align-text-bottom text-[#0260D4]" /> Ditemukan {results.length} Kelompok (Kelas {selectedClass})</>)
                : (<><Icon name="frown" size={17} className="inline mr-1.5 align-text-bottom text-[#0260D4]" /> Tidak Ada Data</>)}
            </h2>

            {/* Fitur Cari Nama Praktikan / NIM (Tengah & Presisi) */}
            {results.length > 0 && (
              <div className="my-6 flex flex-col items-center justify-center text-center">
                <div className="relative w-full max-w-lg">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#0260D4]">
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
                      borderColor: memberSearchTerm ? '#0260D4' : '#D6E4F0',
                      boxShadow: memberSearchTerm
                        ? '0 0 0 4px rgba(2, 96, 212, 0.15), 0 4px 16px rgba(2, 96, 212, 0.1)'
                        : '0 2px 10px rgba(0, 20, 47, 0.05)',
                    }}
                  />
                  {memberSearchTerm && (
                    <button
                      onClick={() => setMemberSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#00142F] transition-colors cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#EFF6FF] hover:bg-[#D6E4F0] text-[#002466] flex items-center justify-center text-xs font-bold">
                        ✕
                      </span>
                    </button>
                  )}
                </div>
                {memberSearchTerm.trim() && (
                  <div className="mt-2.5 text-xs font-semibold text-[#002466] flex items-center justify-center gap-2 animate-fadeIn">
                    <span>Hasil pencarian untuk: <strong className="text-[#00142F]">&ldquo;{memberSearchTerm}&rdquo;</strong></span>
                    <span className="text-slate-400">•</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0260D4] border border-sky-200 font-bold">
                      {filteredResults.length} kelompok ditemukan
                    </span>
                  </div>
                )}
              </div>
            )}

            {results.length === 0 && (
              <div
                className="rounded-3xl p-10 text-center bg-white"
                style={{ border: '1.5px solid #D6E4F0', boxShadow: '0 4px 20px rgba(0,20,47,0.05)' }}
              >
                <div className="mb-4 flex justify-center"><Icon name="inbox" size={44} color="#94A3B8" strokeWidth={1.5} /></div>
                <p style={{ color: '#002466' }}>Data jadwal untuk kelas ini belum tersedia. Kelompok & anggota diisi oleh asisten.</p>
              </div>
            )}

            {results.length > 0 && memberSearchTerm.trim() && filteredResults.length === 0 && (
              <div
                className="rounded-3xl p-8 text-center bg-white mb-6"
                style={{ border: '1.5px solid #D6E4F0' }}
              >
                <div className="mb-3 flex justify-center text-[#0260D4]"><Icon name="search" size={36} /></div>
                <p className="font-bold text-[#00142F] mb-1">Praktikan Tidak Ditemukan</p>
                <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
                  Tidak ada praktikan dengan nama atau NIM &ldquo;{memberSearchTerm}&rdquo; di Kelas {selectedClass}.
                </p>
                <button
                  onClick={() => setMemberSearchTerm('')}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-bold text-[#002466] bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer border border-sky-200"
                >
                  Reset Pencarian
                </button>
              </div>
            )}

            <div className="space-y-4">
              {[1, 2].map((shift) => {
                const shiftGroups = filteredResults.filter((g) => g.shift === shift)
                const unassigned = shift === 1 ? filteredResults.filter((g) => g.shift !== 1 && g.shift !== 2) : []
                const listForShift = shift === 1 ? [...shiftGroups, ...unassigned] : shiftGroups
                if (!listForShift.length) return null
                return (
                  <div key={shift}>
                    <div
                      className="flex items-center gap-3 mb-3.5"
                      style={{ color: '#00142F', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}
                    >
                      <span
                        className="px-4 py-1.5 rounded-full text-white text-xs sm:text-sm font-bold shadow-md tracking-wide"
                        style={{
                          background: 'linear-gradient(135deg, #00142F 0%, #002466 45%, #0260D4 100%)',
                          boxShadow: '0 4px 14px rgba(2, 96, 212, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                        }}
                      >
                        Shift {shift}
                      </span>
                      <span style={{ color: '#002466', fontWeight: 600, fontSize: '0.85rem' }}>
                        {shift === 1 ? '08.00 – 11.00 WIB' : '13.00 – 16.00 WIB'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {listForShift.map((group) => {
                        const isExpanded = memberSearchTerm.trim() ? true : openGroup === group.id
                        const queryLower = memberSearchTerm.toLowerCase().trim()

                        return (
                          <div key={group.id}>
                            <div
                              className="rounded-2xl p-4 sm:p-5 card-hover cursor-pointer transition-all duration-300 relative overflow-hidden group"
                              style={{
                                background: isExpanded ? 'linear-gradient(145deg, #FFFFFF 0%, #F0F7FF 100%)' : 'white',
                                border: isExpanded ? '1.8px solid #0260D4' : '1.2px solid #D6E4F0',
                                boxShadow: isExpanded
                                  ? '0 12px 28px -6px rgba(2, 96, 212, 0.2)'
                                  : '0 4px 18px rgba(0, 20, 47, 0.05)',
                              }}
                              onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}
                            >
                              <div className="flex items-center justify-between mb-2.5">
                                <div
                                  className="min-w-[3.25rem] h-10 px-3 rounded-xl flex items-center justify-center text-center text-white font-bold tracking-wider shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-105"
                                  style={{
                                    background: 'linear-gradient(135deg, #00142F 0%, #002466 45%, #0260D4 100%)',
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: group.id.length > 3 ? '0.78rem' : '0.875rem',
                                    boxShadow: '0 4px 12px rgba(2, 96, 212, 0.25)',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {group.id}
                                </div>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-[#0260D4] text-white shadow-xs rotate-180' : 'bg-sky-50 text-[#0260D4] group-hover:bg-[#0260D4] group-hover:text-white'}`}>
                                  <Icon name="chevron-down" size={14} strokeWidth={2.5} />
                                </div>
                              </div>
                              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#00142F', fontSize: '1rem' }} className="group-hover:text-[#0260D4] transition-colors">
                                Kelompok {group.id}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#002466', marginTop: '4px' }} className="flex items-center gap-1.5">
                                <Icon name="user" size={13} color="#0284C7" /> Asisten: <strong style={{ color: '#00142F' }}>{group.assistant}</strong>
                              </div>
                              <div className="mt-2.5 flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold bg-sky-50 text-[#0260D4] border border-sky-100">
                                  {group.members.length} praktikan{group.ruangan ? ` · ${group.ruangan}` : ''}
                                </span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div
                                className="rounded-b-2xl -mt-2 pt-4 px-4 pb-4 animate-slideIn bg-white"
                                style={{ border: '1.8px solid #0260D4', borderTop: 'none', boxShadow: '0 12px 28px -6px rgba(2, 96, 212, 0.15)' }}
                              >
                                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#00142F', fontSize: '0.85rem', marginBottom: '8px' }} className="flex items-center justify-between">
                                  <span>Daftar Anggota Kelompok {group.id}</span>
                                  <span className="text-xs font-normal text-[#64748B]">{group.members.length} Mahasiswa</span>
                                </div>
                                <div
                                  className="text-xs mb-3 px-3.5 py-2.5 rounded-xl flex items-center gap-2"
                                  style={{ background: 'linear-gradient(135deg, #F0F7FF 0%, #E0F2FE 100%)', color: '#002466', fontWeight: 600, border: '1px solid #BAE6FD' }}
                                >
                                  <Icon name="user" size={13} color="#0260D4" /> Asisten Pendamping: <strong className="text-[#00142F]">{group.assistant}</strong>
                                </div>
                                {group.members.length === 0 ? (
                                  <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Belum ada anggota untuk kelompok ini.</p>
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
                                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all"
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
                                                : 'linear-gradient(135deg, #00142F 0%, #002466 45%, #0260D4 100%)',
                                            }}
                                          >
                                            {i + 1}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isMatch ? '#78350F' : '#00142F' }}>
                                              {m.name}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: isMatch ? '#B45309' : '#64748B' }}>
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
