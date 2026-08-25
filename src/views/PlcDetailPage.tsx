'use client'

import { useState } from 'react'
import { Icon } from '../components/Icon'

interface PlcDetailPageProps {
  setCurrentPage: (page: string) => void
}

// Simulasi Ladder Logic Diagram Interaktif PLC — Replika CX-Programmer
function PLCLadderSimulatorWidget() {
  const [start, setStart] = useState(false)
  const [off, setOff] = useState(false)
  const [sensor, setSensor] = useState(false) // sensor=false -> guard tidak terpicu (NC menghantar)
  const [latch, setLatch] = useState(false)

  // Logic calculation:
  // NC I:0.01: menghantar saat PB OFF TIDAK ditekan (!off)
  // NC I:0.02: menghantar saat SENSOR TIDAK terpicu (!sensor)
  const startPath = start
  const latchPath = latch
  const beforeContact = startPath || latchPath
  const nc_off_conducting = !off
  const nc_sensor_conducting = !sensor
  const afterOff = beforeContact && nc_off_conducting
  const energized = afterOff && nc_sensor_conducting

  const handleToggleStart = () => {
    setStart((prev) => {
      const next = !prev
      if (next && !off && !sensor) {
        setLatch(true)
      } else if (!next && !latch) {
        setLatch(false)
      }
      return next
    })
  }

  const handleOffDown = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setOff(true)
    setLatch(false)
  }

  const handleOffUp = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setOff(false)
  }

  const handleToggleSensor = () => {
    setSensor((prev) => {
      const next = !prev
      if (next) {
        setLatch(false)
      } else if (start && !off) {
        setLatch(true)
      }
      return next
    })
  }

  const handleReset = () => {
    setStart(false)
    setOff(false)
    setSensor(false)
    setLatch(false)
  }

  return (
    <div
      className="rounded-3xl p-6 sm:p-8 bg-white relative overflow-hidden"
      style={{
        border: '1.5px solid #BAD6EB',
        boxShadow: '0 12px 36px rgba(83, 122, 184, 0.12)',
      }}
    >
      {/* Top Header info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-[#E1EDF8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#102544', fontSize: '1.25rem' }}>
              Rangkaian Latch
            </h3>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="self-start md:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-[#EEF5FA] hover:bg-[#E2EDF8] text-[#102544] border border-[#BAD6EB] transition-all cursor-pointer shadow-2xs shrink-0"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <Icon name="refresh" size={14} className="inline mr-1.5" /> ↺ Reset Simulasi
        </button>
      </div>

      {/* Ladder Frame */}
      <div className="rounded-xl overflow-hidden border border-[#b8b8b8] shadow-xs mb-6 bg-[#f0f0f0]">
        <svg viewBox="0 0 940 150" className="w-full h-auto block select-none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="940" height="150" fill="#f0f0f0" />
          <defs>
            <pattern id="cx-dots-940" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#d6d6d6" />
            </pattern>
          </defs>
          <rect x="0" y="4" width="940" height="146" fill="url(#cx-dots-940)" />

          {/* yellow rung selection strip */}
          <rect x="0" y="0" width="940" height="4" fill="#ffff00" />

          {/* left rail */}
          <line x1="20" y1="10" x2="20" y2="140" stroke="#40ff40" strokeWidth="4" />
          {/* right rail */}
          <line x1="820" y1="10" x2="820" y2="140" stroke="#208020" strokeWidth="2.5" />

          {/* row1: rail -> I:0.00 contact */}
          <line x1="20" y1="45" x2="55" y2="45" stroke="#40ff40" strokeWidth="1.6" />
          {/* I:0.00 contact (NO) */}
          <line x1="65" y1="35" x2="65" y2="55" stroke={start ? '#40ff40' : '#000000'} strokeWidth="2" style={{ transition: 'stroke 0.12s' }} />
          <line x1="75" y1="35" x2="75" y2="55" stroke={start ? '#40ff40' : '#000000'} strokeWidth="2" style={{ transition: 'stroke 0.12s' }} />
          <text x="47" y="26" textAnchor="start" fill="#0078d7" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">I: 0.00</text>
          <text x="47" y="67" textAnchor="start" fill="#2e78d8" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">PB START</text>

          {/* row1: I:0.00 -> vertical merge */}
          <line x1="85" y1="45" x2="140" y2="45" stroke={startPath ? '#40ff40' : '#000000'} strokeWidth="1.6" style={{ transition: 'stroke 0.12s' }} />

          {/* vertical connector between row1 and row2 */}
          <line x1="140" y1="45" x2="140" y2="105" stroke={beforeContact ? '#40ff40' : '#000000'} strokeWidth="1.6" style={{ transition: 'stroke 0.12s' }} />

          {/* row2: rail -> Q:100.00 latch contact */}
          <line x1="20" y1="105" x2="55" y2="105" stroke="#40ff40" strokeWidth="1.6" />
          {/* Q:100.00 contact (NO, latch) */}
          <line x1="65" y1="95" x2="65" y2="115" stroke={latch ? '#40ff40' : '#000000'} strokeWidth="2" style={{ transition: 'stroke 0.12s' }} />
          <line x1="75" y1="95" x2="75" y2="115" stroke={latch ? '#40ff40' : '#000000'} strokeWidth="2" style={{ transition: 'stroke 0.12s' }} />
          <text x="47" y="87" textAnchor="start" fill="#0078d7" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">Q: 100.00</text>
          <text x="47" y="127" textAnchor="start" fill="#2e78d8" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">MOTOR ON</text>

          {/* row2: Q:100.00 contact -> vertical connector */}
          <line x1="85" y1="105" x2="140" y2="105" stroke={latchPath ? '#40ff40' : '#000000'} strokeWidth="1.6" style={{ transition: 'stroke 0.12s' }} />

          {/* merge -> I:0.01 NC contact */}
          <line x1="140" y1="45" x2="300" y2="45" stroke={beforeContact ? '#40ff40' : '#000000'} strokeWidth="1.6" style={{ transition: 'stroke 0.12s' }} />

          {/* I:0.01 contact (NC) */}
          <line x1="310" y1="35" x2="310" y2="55" stroke={nc_off_conducting ? '#40ff40' : '#000000'} strokeWidth="2" style={{ transition: 'stroke 0.12s' }} />
          <line x1="320" y1="35" x2="320" y2="55" stroke={nc_off_conducting ? '#40ff40' : '#000000'} strokeWidth="2" style={{ transition: 'stroke 0.12s' }} />
          <line x1="305" y1="58" x2="325" y2="32" stroke={nc_off_conducting ? '#40ff40' : '#000000'} strokeWidth="1.8" style={{ transition: 'stroke 0.12s' }} />
          <text x="298" y="26" textAnchor="start" fill="#0078d7" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">I: 0.01</text>
          <text x="298" y="67" textAnchor="start" fill="#2e78d8" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">PB OFF</text>

          {/* I:0.01 -> I:0.02 sensor contact */}
          <line x1="330" y1="45" x2="460" y2="45" stroke={afterOff ? '#40ff40' : '#000000'} strokeWidth="1.6" style={{ transition: 'stroke 0.12s' }} />

          {/* I:0.02 contact (NC) - SENSOR GUARD */}
          <line x1="470" y1="35" x2="470" y2="55" stroke={nc_sensor_conducting ? '#40ff40' : '#000000'} strokeWidth="2" style={{ transition: 'stroke 0.12s' }} />
          <line x1="480" y1="35" x2="480" y2="55" stroke={nc_sensor_conducting ? '#40ff40' : '#000000'} strokeWidth="2" style={{ transition: 'stroke 0.12s' }} />
          <line x1="465" y1="58" x2="485" y2="32" stroke={nc_sensor_conducting ? '#40ff40' : '#000000'} strokeWidth="1.8" style={{ transition: 'stroke 0.12s' }} />
          <text x="458" y="26" textAnchor="start" fill="#0078d7" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">I: 0.02</text>
          <text x="446" y="67" textAnchor="start" fill="#2e78d8" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">SENSOR GUARD</text>

          {/* I:0.02 -> coil */}
          <line x1="490" y1="45" x2="793" y2="45" stroke={energized ? '#40ff40' : '#000000'} strokeWidth="1.6" style={{ transition: 'stroke 0.12s' }} />

          {/* coil */}
          <circle cx="805" cy="45" r="12" fill="none" stroke={energized ? '#40ff40' : '#000000'} strokeWidth="1.8" style={{ transition: 'stroke 0.12s' }} />
          <text x="760" y="26" textAnchor="start" fill="#0078d7" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">Q: 100.00</text>

          {/* coil -> right rail */}
          <line x1="817" y1="45" x2="820" y2="45" stroke={energized ? '#40ff40' : '#000000'} strokeWidth="1.6" style={{ transition: 'stroke 0.12s' }} />

          {/* output comment, right of right rail */}
          <text x="835" y="49" textAnchor="start" fill="#2e78d8" fontSize="11" fontWeight="600" fontFamily="Consolas, Courier New, monospace">MOTOR ON</text>

          {/* bottom-left end-of-network hatch */}
          <g stroke="#a8a8a8" strokeWidth="1">
            <line x1="20" y1="140" x2="30" y2="150" />
            <line x1="25" y1="140" x2="35" y2="150" />
            <line x1="30" y1="140" x2="40" y2="150" />
            <line x1="35" y1="140" x2="45" y2="150" />
            <line x1="40" y1="140" x2="50" y2="150" />
            <line x1="45" y1="140" x2="55" y2="150" />
          </g>
        </svg>
      </div>

      {/* Control Buttons & Toolbar */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleToggleStart}
            className={`flex-1 font-mono text-xs sm:text-sm py-2.5 px-3 rounded-md border transition-all cursor-pointer select-none active:scale-[0.98] ${
              start
                ? 'border-[#40ff40] text-[#40ff40] bg-[#0f2210]'
                : 'border-[#3a3a3a] bg-[#232323] text-[#e6e6e6] hover:border-[#40ff40] hover:text-[#40ff40]'
            }`}
          >
            Tekan PB START (I:0.00)
          </button>

          <button
            onMouseDown={handleOffDown}
            onMouseUp={handleOffUp}
            onMouseLeave={handleOffUp}
            onTouchStart={handleOffDown}
            onTouchEnd={handleOffUp}
            className={`flex-1 font-mono text-xs sm:text-sm py-2.5 px-3 rounded-md border transition-all cursor-pointer select-none active:scale-[0.98] ${
              off
                ? 'border-[#ff5c5c] text-[#ff5c5c] bg-[#281010]'
                : 'border-[#3a3a3a] bg-[#232323] text-[#e6e6e6] hover:border-[#ff5c5c] hover:text-[#ff5c5c]'
            }`}
          >
            Tekan PB OFF (I:0.01)
          </button>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleToggleSensor}
            className={`flex-1 font-mono text-xs sm:text-sm py-2.5 px-3 rounded-md border transition-all cursor-pointer select-none active:scale-[0.98] ${
              sensor
                ? 'border-[#ffd23f] text-[#ffd23f] bg-[#2a2410]'
                : 'border-[#3a3a3a] bg-[#232323] text-[#e6e6e6] hover:border-[#ffd23f] hover:text-[#ffd23f]'
            }`}
          >
            Toggle SENSOR GUARD (I:0.02)
          </button>
        </div>

        <button
          onClick={handleReset}
          className="w-full font-mono text-[11px] py-2 rounded-md border border-dashed border-[#3a3a3a] bg-transparent text-[#8a8a8a] hover:text-[#e6e6e6] hover:border-[#8a8a8a] transition-all cursor-pointer"
        >
          ↺ Reset Simulasi
        </button>

        {/* Status Bar */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#9a9a9a] pt-2">
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              energized ? 'bg-[#40ff40] shadow-[0_0_6px_#40ff40]' : 'bg-[#3a3a3a]'
            }`}
          />
          <span>
            Q:100.00 = <strong className={energized ? 'text-[#40ff40]' : 'text-slate-400'}>{energized ? 'ON' : 'OFF'}</strong>
            {sensor ? '  |  SENSOR: TERPICU' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PlcDetailPage({ setCurrentPage }: PlcDetailPageProps) {
  const [activeTab, setActiveTab] = useState<string>('all')

  const bobotPenilaian = [
    { label: 'Tugas Rumah + Tes Awal', bobot: '10%', desc: 'Persiapan modul & pretest Kahoot minimal nilai 65', color: '#102544', bg: '#EEF5FA', icon: 'file-text' },
    { label: 'Video Kreasi + Laporan Mingguan', bobot: '15%', desc: 'Video presentasi YouTube & laporan mingguan Cover-Bab 5', color: '#0A58BE', bg: '#EBF4FE', icon: 'video' },
    { label: 'Keaktifan', bobot: '10%', desc: 'Partisipasi aktif tanya jawab saat praktikum', color: '#0D9488', bg: '#F0FDFA', icon: 'zap' },
    { label: 'UAP (Ujian Akhir Praktikum)', bobot: '20%', desc: 'Ujian komprehensif implementasi ladder & HMI', color: '#E11D48', bg: '#FFF1F2', icon: 'award' },
    { label: 'Tugas Besar', bobot: '35%', desc: 'Proyek kelompok implementasi PLC, HMI, & Jurnal ilmiah', color: '#7C3AED', bg: '#F5F3FF', icon: 'layers' },
    { label: 'Kehadiran', bobot: '10%', desc: 'Presensi, kedisiplinan waktu, & kepatuhan dresscode', color: '#059669', bg: '#ECFDF5', icon: 'check-circle' },
  ]

  const tataTertibItems = [
    {
      sub: 'A. Modul Praktikum',
      icon: 'book-open',
      color: '#0A58BE',
      items: [
        'Praktikan diwajibkan mengunduh modul praktikum sebelum pelaksanaan pengarahan.',
        'Praktikan tidak diwajibkan untuk mencetak (print) modul tersebut.',
      ],
    },
    {
      sub: 'B. Tes Awal (Pre-test)',
      icon: 'clipboard-list',
      color: '#7C3AED',
      items: [
        'Tes awal dilakukan melalui platform Kahoot dengan menjunjung tinggi nilai kejujuran dan disiplin waktu.',
        'Praktikan dinyatakan lolos apabila mendapatkan nilai minimal 65.',
        'Praktikan wajib lulus minimal 2 kali pretest untuk dapat mengikuti Ujian Akhir Praktikum (UAP).',
      ],
    },
    {
      sub: 'C. Dresscode & Kerapian',
      icon: 'shield',
      color: '#0D9488',
      items: [
        'Praktikan wajib mengenakan kemeja berkerah serta jas almamater kampus resmi.',
        'Tidak diperbolehkan menggunakan kaos polo, pakaian tanpa kerah, atau pakaian yang memperlihatkan bagian dada.',
        'Praktikan diwajibkan menggunakan sepatu bertali dan kaus kaki yang menutupi mata kaki.',
        'Bagi praktikan yang berambut panjang, harap mengikat rambut dengan rapi selama praktikum berlangsung.',
      ],
    },
    {
      sub: 'D. Ketentuan Perizinan',
      icon: 'clock',
      color: '#E11D48',
      items: [
        'Izin sakit disampaikan maksimal H+1 dengan melampirkan surat keterangan dokter.',
        'Izin karena acara/kegiatan lain disampaikan minimal H-3 sebelum hari praktikum serta mencari kelompok pengganti.',
        'Seluruh izin wajib disampaikan langsung kepada asisten masing-masing disertai alasan dan bukti pendukung yang jelas.',
      ],
    },
  ]

  const sistemList = [
    'Praktikum menerapkan sistem rotasi shift mingguan (Contoh: Minggu 1 untuk Shift 1, Minggu 2 untuk Shift 2, dan seterusnya).',
    'Tugas rumah wajib dikumpulkan melalui Assignment di Teams sebagai syarat mutlak mengikuti praktikum.',
    'Praktikan yang tidak mengumpulkan tugas rumah tidak diperkenankan mengikuti praktikum.',
    'Asisten menyampaikan materi sesuai jadwal yang telah ditentukan.',
    'Praktikan wajib mengenakan kemeja berkerah dan jas almamater.',
    'Format laporan mengikuti pedoman resmi yang dapat diakses melalui link pada bio Instagram Laboratorium (@labical_fket.itpln).',
  ]

  const tugasDanLaporan = [
    {
      title: 'Tugas Rumah',
      tag: 'Sebelum Praktikum',
      color: '#102544',
      items: ['Dikumpulkan sebelum praktikum selanjutnya dilaksanakan.', 'Pengumpulan dilakukan secara daring melalui Assignment Teams.'],
    },
    {
      title: 'Laporan Mingguan',
      tag: 'Maks. H+7',
      color: '#0A58BE',
      items: ['Laporan perminggu dikumpulkan maksimal H+7 setelah praktikum dilaksanakan.', 'Format laporan perminggu mencakup Cover sampai Bab 5.'],
    },
    {
      title: 'Projek Mandiri',
      tag: 'Maks. H+14',
      color: '#7C3AED',
      items: [
        'Projek mandiri dikumpulkan maksimal H+14 setelah praktikum sebelumnya.',
        'Mencakup: 1. Ladder Diagram, 2. HMI, 3. PPT (opsional), 4. Link video presentasi YouTube.',
        'Ketentuan durasi video presentasi: Minimal 3 menit, maksimal 5 menit.',
      ],
    },
    {
      title: 'Media Pengumpulan',
      tag: 'Microsoft Teams',
      color: '#059669',
      items: ['Seluruh tugas rumah, laporan mingguan, projek mandiri, tugas besar, dan jurnal dikumpulkan terpusat di Microsoft Teams.'],
    },
  ]

  const tugasBesarInfo = [
    {
      title: 'Studi Kasus & Rancang Bangun',
      icon: 'cpu',
      items: [
        'Implementasi sistem otomasi industri riil menggunakan PLC Omron & NB Designer.',
        'Mencakup minimum 4 input sensor, 3 aktuator, sistem interlock, timer, counter, dan HMI terintegrasi.',
      ],
    },
    {
      title: 'Jadwal Pengumpulan Tugas Besar',
      icon: 'calendar-days',
      items: [
        'Tugas besar dikumpulkan maksimal H+10 setelah praktikum terakhir dilaksanakan.',
        'Pada H+3 pertemuan terakhir, wajib konfirmasi judul tugas besar kepada asisten masing-masing.',
      ],
    },
    {
      title: 'Infografis & Poster (Format PDF)',
      icon: 'file-text',
      items: [
        'Infografis membahas intisari tugas besar secara visual, padat, dan menarik.',
        'Infografis dibuat dalam format PDF berkualitas tinggi.',
        'Infografis dikumpulkan maksimal H+14 praktikum terakhir, yaitu pada saat pelaksanaan Ujian Akhir Praktikum (UAP).',
      ],
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#F4F8FC' }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="plcNodePattern" width="280" height="280" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="3" fill="#BAD6EB" />
            <circle cx="140" cy="80" r="2.5" fill="#537AB8" />
            <circle cx="220" cy="50" r="3" fill="#BAD6EB" />
            <circle cx="90" cy="180" r="2.5" fill="#BAD6EB" />
            <circle cx="200" cy="200" r="3" fill="#537AB8" />
            <line x1="40" y1="40" x2="140" y2="80" stroke="#BAD6EB" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="140" y1="80" x2="220" y2="50" stroke="#BAD6EB" strokeWidth="0.8" />
            <line x1="140" y1="80" x2="90" y2="180" stroke="#BAD6EB" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="90" y1="180" x2="200" y2="200" stroke="#BAD6EB" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#plcNodePattern)" />
      </svg>

      <div
        className="relative pt-24 pb-14 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #162D4E 0%, #234575 45%, #537AB8 100%)',
        }}
      >
        <div className="absolute inset-0 dots-header pointer-events-none opacity-40" style={{ zIndex: 1 }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8" style={{ zIndex: 10 }}>
          <button
            onClick={() => setCurrentPage('home')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 transition-all cursor-pointer mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ← Kembali ke Beranda
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="section-badge mb-3" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
                Panduan Lengkap Modul
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                Programmable Logic Controller (PLC)
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.92)', marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '640px', lineHeight: 1.6 }}>
                Tata tertib, bobot penilaian, pedoman laporan, ketentuan tugas besar & infografis, serta simulasi ladder logic diagram interaktif.
              </p>
            </div>

            <div className="hidden lg:flex flex-col items-center justify-center p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/25 shadow-xl text-center min-w-[170px]">
              <span className="text-4xl font-extrabold text-white tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
                PLC
              </span>
              <span className="text-xs text-blue-100 mt-1 font-semibold">Omron & NB Designer</span>
              <div className="mt-3 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[0.72rem] font-bold">
                ✓ Modul Aktif
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-14 space-y-12" style={{ zIndex: 10 }}>

        {/* 1. BOBOT PENILAIAN */}
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#D6E4F0] pb-4">
            <div>
              <div className="section-badge mb-2"><Icon name="bar-chart" size={13} /> Evaluasi Akademik</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
                1. Bobot Penilaian Praktikum PLC
              </h2>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white border border-[#BAD6EB] shadow-xs flex items-center gap-2">
              <Icon name="check-circle" size={16} color="#059669" />
              <span className="text-xs font-bold text-[#102544]">Total Akumulasi: <strong className="text-emerald-600 text-sm">100%</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bobotPenilaian.map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl p-6 relative overflow-hidden bg-white border border-[#BAD6EB] shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: item.bg, border: `1px solid ${item.color}30` }}
                    >
                      <Icon name={item.icon} size={22} color={item.color} strokeWidth={1.85} />
                    </div>
                    <span
                      className="px-3.5 py-1 rounded-full text-base font-extrabold text-white shadow-xs"
                      style={{ background: item.color, fontFamily: 'var(--font-heading)' }}
                    >
                      {item.bobot}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.12rem', color: '#102544', marginBottom: '0.35rem' }}>
                    {item.label}
                  </h3>
                  <p style={{ color: '#4B6B94', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-100 mt-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: item.bobot, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. TATA TERTIB PRAKTIKUM */}
        <section className="space-y-6">
          <div className="border-b border-[#D6E4F0] pb-4">
            <div className="section-badge mb-2"><Icon name="scroll" size={13} /> Standar Operasional</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              2. Tata Tertib Praktikum PLC
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tataTertibItems.map((sec, idx) => (
              <div
                key={idx}
                className="rounded-3xl p-6 bg-white border border-[#BAD6EB] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ background: sec.color }}
                    >
                      <Icon name={sec.icon} size={20} color="white" />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.18rem', color: '#102544' }}>
                      {sec.sub}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {sec.items.map((it, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-[#2C4D78] leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A58BE] mt-2 shrink-0" />
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. SISTEM PRAKTIKUM */}
        <section className="rounded-3xl p-7 sm:p-9 bg-white border border-[#BAD6EB] shadow-sm">
          <div className="section-badge mb-3"><Icon name="refresh" size={13} /> Pelaksanaan Mingguan</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.65rem', color: '#102544', marginBottom: '1.25rem' }}>
            3. Sistem Praktikum PLC
          </h2>

          <div className="space-y-3.5">
            {sistemList.map((sis, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FBFE] border border-[#BAD6EB]/80"
              >
                <div className="w-6 h-6 rounded-full bg-[#0A58BE] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 shadow-2xs">
                  ✓
                </div>
                <p className="text-sm text-[#2C4D78] leading-relaxed font-medium">
                  {sis}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. PENGUMPULAN TUGAS DAN LAPORAN */}
        <section className="space-y-6">
          <div className="border-b border-[#D6E4F0] pb-4">
            <div className="section-badge mb-2"><Icon name="clipboard-list" size={13} /> Pengumpulan Dokumen</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              4. Pengumpulan Tugas dan Laporan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tugasDanLaporan.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-[#BAD6EB] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: '#102544' }}>
                      {item.title}
                    </h3>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                      style={{ background: item.color, fontFamily: 'var(--font-heading)' }}
                    >
                      {item.tag}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {item.items.map((it, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-[#2C4D78] leading-relaxed">
                        <span className="text-[#0A58BE] font-bold mt-0.5">•</span>
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. TUGAS BESAR DAN INFOGRAFIS */}
        <section className="space-y-6">
          <div className="border-b border-[#D6E4F0] pb-4">
            <div className="section-badge mb-2"><Icon name="trophy" size={13} /> Proyek Akhir & Presentasi</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              5. Tugas Besar dan Infografis
            </h2>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0A58BE] via-[#1E4B85] to-[#102544] text-white shadow-lg flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
              <Icon name="trophy" size={28} color="#FBBF24" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                Penghargaan Tugas Besar Terbaik 🏆
              </h3>
              <p className="text-blue-100 text-sm mt-0.5">
                Kelompok praktikan dengan <strong>Tugas Besar terbaik</strong> akan mendapatkan piagam penghargaan khusus dari Laboratorium ICAL!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tugasBesarInfo.map((info, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-[#BAD6EB] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#EEF5FA] border border-[#BAD6EB] flex items-center justify-center mb-4 text-[#0A58BE]">
                    <Icon name={info.icon} size={20} />
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: '#102544', marginBottom: '0.75rem' }}>
                    {info.title}
                  </h4>
                  <div className="space-y-2">
                    {info.items.map((it, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#2C4D78] leading-relaxed">
                        <span className="text-[#0A58BE] font-bold">•</span>
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. SILABUS & MATERI MODUL PLC */}
        <section className="space-y-6">
          <div className="border-b border-[#D6E4F0] pb-4">
            <div className="section-badge mb-2"><Icon name="layers" size={13} /> Kurikulum Laboratorium</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              6. Silabus & Materi Modul Praktikum PLC
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              {
                no: 'Pendahuluan',
                title: 'Dasar PLC Omron CP2E & Software Suite',
                desc: 'Pengenalan arsitektur hardware PLC Omron CP2E-N, paket CX-One, struktur memori & pengalamatan (CIO, Timer T, Counter C, Work Area W), prinsip kerja PLC, gerbang logika dasar, dan pengkabelan trainer.',
                topics: ['PLC Omron CP2E-N', 'Pengalamatan I/O & Word.Bit', 'Gerbang Logika', 'Wiring Trainer Lab'],
              },
              {
                no: 'Modul I',
                title: 'Rangkaian Latch (Pengunci)',
                desc: 'Penerapan rangkaian pengunci logika (Self-Holding Circuit), instruksi berpasangan SET-RESET, instruksi pengunci KEEP, serta instruksi pulsa tepi naik DIFU (Different Up) dan tepi turun DIFD (Different Down).',
                topics: ['Rangkaian Latch', 'Instruksi SET-RESET', 'Instruksi KEEP', 'Instruksi DIFU & DIFD'],
              },
              {
                no: 'Modul II',
                title: 'Instruksi Pencacah Nilai (Timer & Counter)',
                desc: 'Implementasi pewaktu presisi heksadesimal (TIM) dan desimal (TIMX), pencacah maju (CNT) dan pencacah bolak-balik (CNTR), integrasi kontrol tampilan angka di CX-Designer, dan aplikasi Running LED.',
                topics: ['Timer TIM & TIMX', 'Counter CNT & CNTR', 'Display Angka CX-Designer', 'Aplikasi Running LED'],
              },
              {
                no: 'Modul III',
                title: 'Instruksi Operasi Aritmatika & Komparasi',
                desc: 'Operasi matematika biner (+, -, *, /), pembandingan nilai (CMP, samadengan =), penambahan (INC ++) dan pengurangan (DEC --) pada register memori Work Area (W), serta pembuatan HMI kalkulator otomatis.',
                topics: ['Aritmatika (+, -, *, /)', 'Komparasi CMP & =', 'Increment / Decrement', 'HMI Kalkulator'],
              },
              {
                no: 'Modul IV',
                title: 'Instruksi Percabangan & Pemindahan Data',
                desc: 'Pengamanan logika menggunakan instruksi Interlock (IL) dan Interlock Clear (ILC), transfer data register dengan Move (MOV), implementasi konveyor sortir minuman dan sistem kartu akses pintu otomatis.',
                topics: ['Interlock IL & ILC', 'Instruksi Move (MOV)', 'Konveyor Otomatis', 'Sistem Akses Pintu'],
              },
              {
                no: 'Bab V',
                title: 'HMI dengan NB-Designer & Trainer Integrasi',
                desc: 'Desain antarmuka grafis operator industri modern menggunakan software OMRON NB-Designer, konfigurasi layar sentuh NB7W-TW00B, komunikasi serial RS232 / Ethernet / HDMI, dan pengujian simulasi terpadu.',
                topics: ['HMI NB7W-TW00B', 'Software NB-Designer', 'Komunikasi RS232/Ethernet', 'Simulasi Terintegrasi'],
              },
            ].map((m, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-[#BAD6EB] shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-bold text-white shadow-2xs"
                      style={{ background: 'linear-gradient(135deg, #102544 0%, #1E4B85 100%)', fontFamily: 'var(--font-heading)' }}
                    >
                      {m.no}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: '#102544' }}>
                      {m.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[#2C4D78] leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                <div className="flex flex-wrap md:flex-col gap-2 shrink-0 md:min-w-[180px]">
                  {m.topics.map((t, ti) => (
                    <span
                      key={ti}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#EEF5FA] border border-[#BAD6EB] text-[#1E4B85] flex items-center gap-1.5"
                    >
                      <Icon name="check-circle" size={12} color="#0A58BE" /> {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. SIMULASI LADDER DIAGRAM INTERAKTIF */}
        <section className="space-y-4">
          <div className="border-b border-[#D6E4F0] pb-4">
            <div className="section-badge mb-2"><Icon name="cpu" size={13} /> Laboratorium Virtual PLC</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              7. Simulasi Logika Ladder Diagram PLC (Interaktif)
            </h2>
          </div>

          <PLCLadderSimulatorWidget />
        </section>

        <div
          className="rounded-3xl p-8 text-center bg-gradient-to-r from-[#0A58BE] via-[#164E8E] to-[#102544] text-white shadow-xl flex flex-col items-center justify-center gap-4"
        >
          <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Siap Melaksanakan Praktikum PLC?
          </h3>
          <p className="text-blue-100 text-sm max-w-xl">
            Unduh modul resmi dan software pendukung CX-One & NB Designer untuk mempersiapkan praktikum PLC semester ini.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <button
              onClick={() => setCurrentPage('module')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-[#0A58BE] hover:bg-blue-50 transition-all shadow-md cursor-pointer"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Icon name="download" size={16} className="inline mr-2" /> Buka Modul PLC
            </button>
            <button
              onClick={() => setCurrentPage('software')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/40 transition-all cursor-pointer"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Icon name="laptop" size={16} className="inline mr-2" /> Unduh CX-One & NB Designer
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
