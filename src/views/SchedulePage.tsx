import { useEffect, useState } from 'react'
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

  // Daftar tetap 3 jenis praktikum yang selalu tampil di dropdown,
  // terlepas dari jurusan yang dipilih ada datanya atau tidak.
  const JENIS_PRAKTIKUM_TETAP = [
    { kode: 'DSK', nama: 'Dasar Sistem Kontrol' },
    { kode: 'PLC', nama: 'Programmable Logic Controller' },
    { kode: 'SKI', nama: 'Sistem Kontrol Industri' },
  ]

  const currentJurusan = jurusanList.find((j) => j.kode === selectedProgram)
  const availableClasses = currentJurusan?.kelasTersedia || []

  // Cek apakah kombinasi jurusan + jenis praktikum yang dipilih benar-benar
  // ada di database (yaitu ada baris praktikum untuk jurusan ini).
  const practicumUnavailable =
    !!selectedProgram &&
    !!selectedPracticum &&
    !currentJurusan?.praktikum.some((p) => p.kode === selectedPracticum)

  const handleSearch = async () => {
    if (!selectedProgram || !selectedPracticum || !selectedClass) return
    if (practicumUnavailable) return
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
    setError('')
  }

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
            Jadwal Praktikum
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'white' }}>
            Cek Jadwal Praktikummu
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.75rem', fontSize: '1rem' }}>
            Pilih jurusan, jenis praktikum, dan kelas untuk menemukan jadwal dan kelompokmu
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        {/* Search card */}
        <div
          className="rounded-3xl p-6 sm:p-8 mb-8"
          style={{
            background: 'white',
            border: '1.5px solid #e0f7fa',
            boxShadow: '0 8px 40px rgba(1,92,97,0.10)',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#015c61', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
            <Icon name="search" size={18} className="inline mr-1.5 align-text-bottom" /> Filter Pencarian
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
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
              <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
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
              <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#475569', marginBottom: '6px', fontFamily: 'var(--font-body)' }}>
                Kelas
              </label>
              <select
                className="input-field"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={!selectedPracticum || practicumUnavailable}
              >
                <option value="">-- Pilih Kelas --</option>
                {availableClasses.map((c) => <option key={c} value={c}>Kelas {c}</option>)}
              </select>
            </div>
          </div>

          {practicumUnavailable && (
            <div
              className="rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
            >
              <Icon name="warning" size={15} /> Tidak Tersedia — praktikum ini belum dibuka untuk jurusan yang dipilih.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={!selectedProgram || !selectedPracticum || !selectedClass || practicumUnavailable || loading}
              className="btn-primary flex items-center gap-2"
              style={{ opacity: (!selectedProgram || !selectedPracticum || !selectedClass || practicumUnavailable || loading) ? 0.5 : 1 }}
            >
              {loading ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="search" size={16} />}
              {loading ? 'Mencari...' : 'Cari Jadwal'}
            </button>
            {searched && (
              <button onClick={handleReset} className="btn-secondary">
                Reset
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-6" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            <Icon name="warning" size={15} className="inline mr-1 align-text-bottom" /> {error}
          </div>
        )}

        {/* Schedule dates */}
        {searched && scheduleDates.length > 0 && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{ background: 'linear-gradient(135deg, #f0fbfb, #e0f7fa)', border: '1.5px solid #a5eef2' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#015c61', marginBottom: '0.75rem' }}>
              <Icon name="calendar" size={16} className="inline mr-1.5 align-text-bottom" /> Jadwal Pertemuan
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {scheduleDates.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'white', border: '1px solid #e0f7fa' }}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8rem', color: '#015c61' }}>{s.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>{s.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {searched && results !== null && !error && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#015c61', fontSize: '1.2rem', marginBottom: '1rem' }}>
              {results.length > 0
                ? (<><Icon name="clipboard-list" size={17} className="inline mr-1.5 align-text-bottom" /> Ditemukan {results.length} Kelompok — Kelas {selectedClass}</>)
                : (<><Icon name="frown" size={17} className="inline mr-1.5 align-text-bottom" /> Tidak Ada Data</>)}
            </h2>

            {results.length === 0 && (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: 'white', border: '1.5px solid #e0f7fa' }}
              >
                <div className="mb-4 flex justify-center"><Icon name="inbox" size={44} color="#94a3b8" strokeWidth={1.5} /></div>
                <p style={{ color: '#64748b' }}>Data jadwal untuk kelas ini belum tersedia. Kelompok & anggota diisi oleh asisten.</p>
              </div>
            )}

            <div className="space-y-3">
              {[1, 2].map((shift) => {
                const shiftGroups = results.filter((g) => g.shift === shift)
                const unassigned = shift === 1 ? results.filter((g) => g.shift !== 1 && g.shift !== 2) : []
                const listForShift = shift === 1 ? [...shiftGroups, ...unassigned] : shiftGroups
                if (!listForShift.length) return null
                return (
                  <div key={shift}>
                    <div
                      className="flex items-center gap-3 mb-3"
                      style={{ color: shift === 1 ? '#015c61' : '#016e75', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}
                    >
                      <span
                        className="px-3 py-1 rounded-full text-white text-sm"
                        style={{ background: shift === 1 ? 'linear-gradient(135deg,#015c61,#06aeb7)' : 'linear-gradient(135deg,#016e75,#5cd5db)' }}
                      >
                        Shift {shift}
                      </span>
                      <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.85rem' }}>
                        {shift === 1 ? '08.00 – 11.00 WIB' : '13.00 – 16.00 WIB'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {listForShift.map((group) => (
                        <div key={group.id}>
                          <div
                            className="rounded-2xl p-4 card-hover cursor-pointer"
                            style={{
                              background: openGroup === group.id ? 'linear-gradient(135deg,#f0fbfb,#e0f7fa)' : 'white',
                              border: `1.5px solid ${openGroup === group.id ? '#5cd5db' : '#e0f7fa'}`,
                              boxShadow: '0 2px 12px rgba(1,92,97,0.06)',
                            }}
                            onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div
                                className="min-w-[2.75rem] h-10 px-2.5 rounded-xl flex items-center justify-center text-center text-white font-bold shadow-xs shrink-0"
                                style={{
                                  background: shift === 1 ? 'linear-gradient(135deg,#015c61,#06aeb7)' : 'linear-gradient(135deg,#016e75,#5cd5db)',
                                  fontFamily: 'var(--font-heading)',
                                  fontSize: group.id.length > 3 ? '0.78rem' : '0.875rem',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {group.id}
                              </div>
                              <span style={{ fontSize: '1.2rem' }}>{openGroup === group.id ? '▲' : '▼'}</span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#015c61', fontSize: '0.95rem' }}>
                              Kelompok {group.id}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                              <Icon name="user" size={12} className="inline mr-1 align-text-bottom" /> Asisten: <strong style={{ color: '#06aeb7' }}>{group.assistant}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                              {group.members.length} praktikan{group.ruangan ? ` · ${group.ruangan}` : ''}
                            </div>
                          </div>

                          {openGroup === group.id && (
                            <div
                              className="rounded-b-2xl -mt-2 pt-4 px-4 pb-4 animate-slideIn"
                              style={{ background: 'white', border: '1.5px solid #5cd5db', borderTop: 'none' }}
                            >
                              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#015c61', fontSize: '0.85rem', marginBottom: '8px' }}>
                                Daftar Anggota Kelompok {group.id}
                              </div>
                              <div
                                className="text-xs mb-3 px-3 py-2 rounded-lg"
                                style={{ background: '#f0fbfb', color: '#015c61', fontWeight: 600 }}
                              >
                                <Icon name="user" size={12} className="inline mr-1 align-text-bottom" /> Asisten Pendamping: {group.assistant}
                              </div>
                              {group.members.length === 0 ? (
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Belum ada anggota untuk kelompok ini.</p>
                              ) : (
                                <div className="space-y-2">
                                  {group.members.map((m, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-3 px-3 py-2 rounded-xl"
                                      style={{ background: '#f0fbfb', border: '1px solid #e0f7fa' }}
                                    >
                                      <span
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                        style={{ background: 'linear-gradient(135deg,#015c61,#06aeb7)' }}
                                      >
                                        {i + 1}
                                      </span>
                                      <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{m.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.nim}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
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
