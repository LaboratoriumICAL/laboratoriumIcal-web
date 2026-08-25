'use client'

import { useState, useMemo } from 'react'
import { Icon } from '../components/Icon'

interface DskDetailPageProps {
  setCurrentPage: (page: string) => void
}

// Simulasi PID Interaktif
function PIDSimulatorWidget() {
  const [kp, setKp] = useState(2.2)
  const [ki, setKi] = useState(0.6)
  const [kd, setKd] = useState(0.4)
  const [activePreset, setActivePreset] = useState<string>('pid')

  const presets = [
    { id: 'p', label: 'Kontrol P Murni', kp: 2.0, ki: 0.0, kd: 0.0, desc: 'Cepat tapi memiliki steady-state error' },
    { id: 'pi', label: 'Kontrol PI', kp: 1.8, ki: 0.8, kd: 0.0, desc: 'Menghilangkan steady-state error tapi sedikit berosilasi' },
    { id: 'pd', label: 'Kontrol PD', kp: 2.5, ki: 0.0, kd: 0.6, desc: 'Meredam osilasi & mempercepat waktu stabil' },
    { id: 'pid', label: 'PID Optimal', kp: 2.4, ki: 0.65, kd: 0.45, desc: 'Kombinasi ideal respons cepat tanpa error' },
  ]

  const applyPreset = (p: typeof presets[0]) => {
    setActivePreset(p.id)
    setKp(p.kp)
    setKi(p.ki)
    setKd(p.kd)
  }

  // Model Simulasi Sistem Orde-2 dengan PID
  const data = useMemo(() => {
    const dt = 0.05
    const T = 1.8
    const setpoint = 1.0
    const n = 140
    const output: number[] = [0]
    let integral = 0
    let prevError = setpoint

    for (let i = 1; i < n; i++) {
      const error = setpoint - output[i - 1]
      integral += error * dt
      // Anti-windup
      integral = Math.max(-2, Math.min(2, integral))
      const derivative = (error - prevError) / dt
      const u = kp * error + ki * integral + kd * derivative
      const next = output[i - 1] + (dt / T) * (u - output[i - 1])
      output.push(Math.max(-0.2, Math.min(2.4, next)))
      prevError = error
    }
    return output
  }, [kp, ki, kd])

  const W = 620
  const H = 240
  const padX = 45
  const padY = 25
  const innerW = W - padX * 2
  const innerH = H - padY * 2

  const toX = (i: number) => padX + (i / (data.length - 1)) * innerW
  const toY = (v: number) => padY + innerH - ((v - -0.2) / 2.6) * innerH

  const points = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const setpointY = toY(1.0)

  const finalVal = data[data.length - 1]
  const maxVal = Math.max(...data)
  const overshoot = Math.max(0, maxVal - 1.0)
  const steadyErr = Math.abs(1.0 - finalVal)

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
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#162D4E', fontSize: '1.25rem' }}>
              Simulasi Respons Loop Tertutup PID
            </h3>
          </div>
          <p style={{ color: '#3B577D', fontSize: '0.88rem' }}>
            Geser parameter <span className="font-bold text-[#162D4E]">P</span> (Proportional), <span className="font-bold text-emerald-600">I</span> (Integral), dan <span className="font-bold text-amber-600">D</span> (Derivative) untuk melihat perubahan respons grafik waktu nyata (*real-time*).
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex flex-wrap gap-2">
          {presets.map((pr) => (
            <button
              key={pr.id}
              onClick={() => applyPreset(pr)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              style={{
                background: activePreset === pr.id ? 'linear-gradient(135deg, #102544 0%, #1E4B85 50%, #537AB8 100%)' : '#EEF5FA',
                color: activePreset === pr.id ? '#FFFFFF' : '#162D4E',
                border: activePreset === pr.id ? '1px solid #162D4E' : '1px solid #BAD6EB',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Graphic Display */}
      <div className="relative mb-6 rounded-2xl p-4 bg-[#F8FBFE] border border-[#BAD6EB]/70 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block mx-auto drop-shadow-xs">
          {/* Grid lines */}
          {[0, 0.5, 1.0, 1.5, 2.0].map((v) => (
            <g key={v}>
              <line
                x1={padX}
                y1={toY(v)}
                x2={W - padX}
                y2={toY(v)}
                stroke="#DBEAFE"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={padX - 8} y={toY(v) + 4} textAnchor="end" fontSize="10" fill="#6B87A8" fontWeight="600">
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Reference Setpoint Target (SP = 1.0) */}
          <line
            x1={padX}
            y1={setpointY}
            x2={W - padX}
            y2={setpointY}
            stroke="#EF4444"
            strokeWidth="1.8"
            strokeDasharray="6 4"
          />
          <text x={W - padX + 6} y={setpointY + 4} fontSize="10" fill="#EF4444" fontWeight="800">
            SP (1.0)
          </text>

          {/* Area gradient under response curve */}
          <polygon
            points={`${padX},${toY(-0.2)} ${points} ${toX(data.length - 1)},${toY(-0.2)}`}
            fill="url(#pidAreaGrad)"
            opacity="0.55"
          />

          {/* Main PID Output Response Curve */}
          <polyline
            points={points}
            fill="none"
            stroke="url(#pidStrokeGrad)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="pidStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#162D4E" />
              <stop offset="40%" stopColor="#1E4B85" />
              <stop offset="80%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
            <linearGradient id="pidAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.02" />
            </linearGradient>
          </defs>
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-xs font-semibold text-[#162D4E]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 rounded-full bg-[#2563EB]" /> Respons Sistem (Output)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-red-500" /> Target Setpoint (SP = 1.0)
          </div>
        </div>
      </div>

      {/* 3 Parameter Sliders (P, I, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {/* Slider P */}
        <div className="p-4 rounded-2xl bg-[#EEF5FA] border border-[#BAD6EB]">
          <div className="flex items-center justify-between text-xs font-bold text-[#162D4E] mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#162D4E]" />
              <span>Gain Proporsional (Kp)</span>
            </div>
            <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-white text-[#162D4E] border border-[#BAD6EB]">
              {kp.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="6.0"
            step="0.05"
            value={kp}
            onChange={(e) => {
              setKp(parseFloat(e.target.value))
              setActivePreset('')
            }}
            className="w-full accent-[#162D4E] cursor-pointer"
          />
          <p className="text-[0.72rem] text-[#486588] mt-2">
            Mempercepat respons sistem menuju setpoint. Terlalu tinggi menyebabkan osilasi.
          </p>
        </div>

        {/* Slider I */}
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0]">
          <div className="flex items-center justify-between text-xs font-bold text-[#065F46] mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Gain Integral (Ki)</span>
            </div>
            <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-[#A7F3D0]">
              {ki.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.5"
            step="0.05"
            value={ki}
            onChange={(e) => {
              setKi(parseFloat(e.target.value))
              setActivePreset('')
            }}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <p className="text-[0.72rem] text-[#047857] mt-2">
            Menghapus *steady-state error* (selisih akhir target).
          </p>
        </div>

        {/* Slider D */}
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
          <div className="flex items-center justify-between text-xs font-bold text-[#92400E] mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
              <span>Gain Derivatif (Kd)</span>
            </div>
            <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-white text-amber-700 border border-[#FDE68A]">
              {kd.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={kd}
            onChange={(e) => {
              setKd(parseFloat(e.target.value))
              setActivePreset('')
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[0.72rem] text-[#B45309] mt-2">
            Meredam lonjakan (*overshoot*) dan menstabilkan osilasi grafik.
          </p>
        </div>
      </div>

      {/* Realtime Metrics Output Display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
        <div className="text-center p-3 rounded-2xl bg-[#F0F6FD] border border-[#BAD6EB]">
          <div className="text-xs text-[#3B577D] font-medium">Nilai Akhir (Output)</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#162D4E' }}>
            {finalVal.toFixed(3)}
          </div>
        </div>
        <div className="text-center p-3 rounded-2xl bg-[#F0F6FD] border border-[#BAD6EB]">
          <div className="text-xs text-[#3B577D] font-medium">Overshoot (Lonjakan)</div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: overshoot > 0.35 ? '#DC2626' : '#059669',
            }}
          >
            {(overshoot * 100).toFixed(1)}%
          </div>
        </div>
        <div className="text-center p-3 rounded-2xl bg-[#F0F6FD] border border-[#BAD6EB]">
          <div className="text-xs text-[#3B577D] font-medium">Steady-State Error</div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: steadyErr < 0.04 ? '#059669' : '#D97706',
            }}
          >
            {steadyErr.toFixed(3)}
          </div>
        </div>
        <div className="text-center p-3 rounded-2xl bg-[#F0F6FD] border border-[#BAD6EB]">
          <div className="text-xs text-[#3B577D] font-medium">Status Kestabilan</div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.15rem',
              color: overshoot < 0.25 && steadyErr < 0.05 ? '#059669' : '#2563EB',
            }}
          >
            {overshoot < 0.25 && steadyErr < 0.05 ? 'Stabil Optimal' : 'Merespons'}
          </div>
        </div>
      </div>
    </div>
  )
}

// Data Lengkap 5 Modul Praktikum DSK
const DSK_MODULES = [
  {
    id: 'modul-1',
    no: 'Modul I',
    title: 'Pengenalan Dasar Aplikasi MATLAB',
    pages: 'Halaman 9 - 23',
    tujuan: [
      'Praktikan dapat menguasai dasar-dasar pembelajaran software MATLAB.',
      'Praktikan dapat mengoperasikan software MATLAB dengan baik dan benar.',
      'Praktikan dapat memahami konsep dasar komputasi numerik serta mampu menerapkannya dalam visualisasi data menggunakan MATLAB.',
    ],
    teori: [
      {
        sub: '2.1 Software MATLAB',
        isi: 'MATLAB adalah program interaktif untuk komputasi numerik dan visualisasi data. Digunakan secara luas oleh para ahli di bidang kontrol untuk analisa dan perancangan sistem kontrol.',
        poin: [
          'Vektor: Larik satu dimensi bilangan yang tersusun dalam baris atau kolom.',
          'Fungsi: Dilengkapi fungsi standar seperti sin, cos, exp, log, konstanta pi, dan i/j untuk bilangan kompleks.',
          'Plot: Fungsi untuk menampilkan data vektor x dan y dalam grafik gelombang.',
          'Matriks: Larik multidimensi dengan pemisah titik koma (;) atau enter antar baris.',
        ],
      },
      {
        sub: '2.2 Area Kerja MATLAB',
        isi: 'Komponen utama dalam antarmuka MATLAB terdiri dari Command Window (eksekusi langsung), Editor (menulis dan mengedit skrip file .m), dan Workspace (area penyimpanan variabel aktif).',
        poin: [
          'Command Window: Tampilan utama untuk mengeksekusi baris perintah langsung.',
          'Editor: Membuat file skrip program (.m) dengan sintaks warna dan fungsi debugging.',
          'Workspace: Menyimpan seluruh variabel yang aktif selama sesi MATLAB berlangsung.',
          'Tombol RUN: Mengeksekusi keseluruhan kode yang telah ditulis di editor.',
          'Help Plot: Perintah help plot di command window untuk memperoleh dokumentasi fungsi plot.',
        ],
      },
    ],
    langkah: [
      {
        judul: 'Percobaan 1: Operasi Vektor & Matriks di Command Window',
        code: `% Membuat Matriks A, B, C
A = [1 2 3; 0 0 0; 3 4 5]
B = [5 6 7; 8 9 0; 5 0 5]
C = [6 7; 8 9]

% Transpose & Invers Matriks
trans_A = A'
inv_A = inv(A)
inv_B = inv(B)

% Operasi Penjumlahan & Perkalian
Z = A + B
Y_kali = A * B

% Pengambilan Elemen Matriks (Baris, Kolom)
elem1 = A(1, 2)
kolom1 = A(:, 1)
baris1 = B(1, :)

% Membersihkan Command Window & Workspace
clc
clear all`,
      },
      {
        judul: 'Percobaan 2: Pembuatan Skrip Plot Gelombang Sinusoida di Editor',
        code: `% PROGRAM 1: Plot Dasar Gelombang Sinus
t = -pi:pi/10:pi; % Variabel t dari -pi hingga pi dengan interval pi/10
y = sin(t);        % Fungsi sinus
plot(t, y);
title('Grafik sinus');
xlabel('t');
ylabel('y');
legend('y=sin(t)');
grid on;

% PROGRAM 2: Kustomisasi Warna, Garis, dan Marker
plot(t, y, '--rp', 'LineWidth', 1);
title('Grafik sinus Kustom');
xlabel('t');
ylabel('y');
legend('y=sin(t)');
grid on;`,
      },
    ],
    tugasAkhir: {
      shift1: [
        'Apa maksud "pi/10" pada script MATLAB?',
        'Apa yang terjadi jika matriks tidak memiliki invers? Jelaskan penyebabnya!',
        'Apa fungsi "y=sin(t)" pada script MATLAB?',
        'Apa yang terjadi jika ukuran matriks yang dijumlahkan tidak sama? Berikan contoh script dan jelaskan error-nya!',
        'Jelaskan perbedaan dari instruksi berikut pada MATLAB: clc, clear, clear all!',
        'Buatkan sebuah matriks dengan hasil pertambahan antara variabel c dengan variabel d yang hasilnya adalah:\n[150 100 107; 103 99 105; 96 102 95]\nTampilkan script variabel yang telah dibuat!',
        'Tampilkan sebuah kurva dengan kondisi kurva menggunakan fungsi Tan(t) dengan warna line cyan, ketebalan line 3, bentuk line dotted, point bentuk kotak (square), dengan title format "Nama panggilan_NIM"!',
      ],
      shift2: [
        'Sebutkan perbedaan operator titik dua (:) dengan sama dengan (=) pada script di MATLAB!',
        'Apa fungsi title(\'Grafik sinus\') pada MATLAB?',
        'Apa fungsi xlabel(\'t\') dan ylabel(\'y\') pada script MATLAB?',
        'Apa yang terjadi apabila bagian t=-pi:pi/10:pi; pada program 1 dipindahkan ke akhir source code? Tampilkan perbandingannya dan jelaskan penyebabnya!',
        'Buatkan sebuah matriks dengan hasil pengurangan antara variabel k dengan variabel l yang hasilnya adalah:\n[112 108 98; 90 156 110; 111 88 180]\nTampilkan script variabel yang telah dibuat!',
        'Tampilkan sebuah kurva dengan kondisi kurva menggunakan fungsi cos(t) dengan warna line kuning, ketebalan line 4, bentuk line dotted, point bentuk hexagram, dengan title format "Nama panggilan_NIM"!',
      ],
    },
    tugasRumah: {
      shift1: [
        'Apa fungsi dari command window?',
        'Apa fungsi dari editor?',
        'Apa fungsi workspace?',
        'Jelaskan apa yang dimaksud dengan komputasi numerik!',
        'Apa itu MATLAB? Jelaskan!',
        'Jelaskan fungsi dari "%" pada MATLAB!',
        'Jelaskan apa yang dimaksud dengan vektor dan matriks!',
        'Apa saja perbedaan command window dan editor pada MATLAB?',
        'Jelaskan apa itu fungsi dan plot pada MATLAB!',
        'Apa saja perbedaan dari "Run" dan "Run and Advance" pada MATLAB?',
        'Buatlah bentuk matrix ordo 3x3, 2x2, dan 4x4 dengan menggunakan angka-angka yang terdapat pada NIM Anda (Tinta biru untuk NIM ganjil, tinta merah untuk NIM genap, serta sertakan watermark Nama_NIM).',
      ],
      shift2: [
        'Apa fungsi dari workspace?',
        'Apa fungsi dari editor?',
        'Apa fungsi dari command window?',
        'Jelaskan apa yang dimaksud dengan visualisasi data!',
        'Apa itu MATLAB? Jelaskan!',
        'Jelaskan fungsi dari operator ":" (titik dua) pada MATLAB!',
        'Jelaskan apa yang dimaksud dengan vektor dan matriks!',
        'Apa saja perbedaan command window dan editor pada MATLAB?',
        'Jelaskan apa itu fungsi dan plot pada MATLAB!',
        'Jelaskan apa yang Anda ketahui mengenai help plot!',
        'Buatlah bentuk matrix ordo 3x3, 2x2, dan 4x4 dengan menggunakan angka-angka yang terdapat pada NIM Anda (Tinta biru untuk NIM ganjil, tinta merah untuk NIM genap, serta sertakan watermark Nama_NIM).',
      ],
    },
    referensi: 'MathWorks. (2025). MATLAB Documentation – Desktop Basics: Command Window, Editor, and Workspace.',
  },
  {
    id: 'modul-2',
    no: 'Modul II',
    title: 'Respon Transien Plant Orde 1 dengan Menggunakan MATLAB',
    pages: 'Halaman 24 - 35',
    tujuan: [
      'Mengetahui fungsi alih model sistem orde 1.',
      'Mampu menggunakan MATLAB untuk menghasilkan grafik respon transien sistem orde 1 dengan berbagai jenis input.',
      'Mengamati performansi sistem berdasarkan grafik respon transien dengan input unit step.',
    ],
    teori: [
      {
        sub: '2.1 Fungsi Alih & Orde Sistem',
        isi: 'Fungsi alih G(s) = Y(s)/X(s) mencirikan hubungan keluaran dan masukan sistem dalam Transformasi Laplace pada kondisi awal nol. Bentuk umum sistem orde 1 adalah G(s) = K / (T*s + 1).',
        poin: [
          'T (Konstanta Waktu / Time Constant): Waktu yang diperlukan respon untuk mencapai 63.2% dari nilai akhir steady-state.',
          'ts (Settling Time / Waktu Penetapan): Waktu yang diperlukan sistem untuk menetap dalam toleransi 2% (ts = 4T).',
          'K (Penguatan / Gain): Perbandingan respon keadaan mantap dengan amplitudo sinyal masukan.',
          'Pada t = 2T respon mencapai 86.47%, dan pada t = 3T respon mencapai 95.02%.',
        ],
      },
      {
        sub: '2.2 Rangkaian RC Seri & Simulink',
        isi: 'Rangkaian RC seri merupakan contoh fisik plant orde 1: V3(s)/V1(s) = 1 / (R*C*s + 1). Pemodelan dilakukan menggunakan m-file MATLAB (tf, step, impulse) dan blok diagram Simulink (Step, Transfer Fcn, Scope).',
        poin: [
          'Input Step: Sinyal naik dari 0 ke nilai konstan 1 untuk t > 0.',
          'Input Impulse: Sinyal lonjakan sesaat bernilai tak terhingga pada t = 0.',
          'Blok Simulink: Sumber sinyal Step (step time = 0), Transfer Fcn [1] / [R*C 1], dan penampil grafik Scope.',
        ],
      },
    ],
    langkah: [
      {
        judul: 'Percobaan 1: Respon Impuls Orde 1 (Plot 1.1 & 1.2)',
        code: `% ORDE 1 INPUT IMPULSE
% Parameter Rangkaian RC
R = 500;   % Ohm (Plot 1.1: R=500, C=0.05 | Plot 1.2: R=350, C=0.02)
C = 0.05;  % Farad

% Membuat Fungsi Alih Transfer Function
num = [1];
denum = [R*C 1];
V = tf(num, denum);

% Menampilkan Respon Impuls
impulse(V);
title('Respon Impuls Sistem Orde 1 (RC Seri)');
ylabel('V3 (Volt)');
xlabel('Time (seconds)');
grid on;`,
      },
      {
        judul: 'Percobaan 2: Respon Step Orde 1 & Analisis Parameter (Plot 1.3 & 1.4)',
        code: `% ORDE 1 INPUT STEP
R = 500;   % Ohm (Plot 1.3: R=500, C=0.05 | Plot 1.4: R=300, C=0.02)
C = 0.05;  % Farad

num = [1];
denum = [R*C 1];
V = tf(num, denum);

% Plot Respon Step
step(V);
title('Respon Step Sistem Orde 1');
ylabel('V3 (Volt)');
xlabel('Time (seconds)');
grid on;

% Parameter Performansi yang diamati:
% T = R*C (Time Constant)
% Ts = 4*T (Settling Time 2%)
% Nilai Akhir Steady State = 1.0 Volt`,
      },
    ],
    tugasAkhir: {
      shift1: [
        'Pada plot 1.3 diketahui rangkaian RC seri dengan R merupakan 4 angka terakhir NIM dibagi 10 (contoh: NIM 202411114, maka R=1114/10=111.4 ohm) dan C=0.05 F. Tentukan fungsi alihnya, sertakan source code dan grafik!',
        'Dari hasil plot nomor 1, tentukan nilai time constant (T), settling time (ts), dan nilai akhirnya ke dalam tabel!',
        'Buatkan fungsi alihnya menggunakan Equation secara rinci!',
        'Apa yang terjadi terhadap bentuk kurva respon apabila nilai R diperbesar 2 kali lipat sementara nilai C tetap? Buktikan dengan menampilkan kurva perbandingannya!',
        'Pada soal nomor 4 buatkan analisa minimal 100 kata!',
      ],
      shift2: [
        'Pada plot 1.3 diketahui rangkaian RC seri dengan R = 300 ohm dan C merupakan 4 angka terakhir NIM dibagi 1000 (misal: NIM 202415001, maka C=5001/1000=5.001 F). Tentukan fungsi alihnya, sertakan source code dan grafik!',
        'Dari hasil plot nomor 1, tentukan nilai time constant, settling time, dan nilai akhirnya ke dalam tabel!',
        'Buatkan fungsi alihnya menggunakan Equation secara rinci!',
        'Apa yang terjadi terhadap bentuk kurva respon apabila nilai C diperkecil menjadi setengahnya sementara nilai R tetap? Buktikan dengan menampilkan kurva perbandingannya!',
        'Pada soal nomor 4 buatkan analisa minimal 100 kata!',
      ],
    },
    tugasRumah: {
      shift1: [
        'Jelaskan apa itu orde dan jelaskan apa yang Anda ketahui mengenai sistem orde 1!',
        'Sebutkan dan jelaskan parameter-parameter pada orde 1!',
        'Jelaskan apa yang dimaksud dengan respon transien!',
        'Mengapa pada sistem orde 1 digunakan perumpamaan rangkaian RC seri? Serta jelaskan bagaimana cara kerja rangkaian RC seri ini pada sistem orde 1!',
        'Apa yang Anda ketahui mengenai fungsi alih?',
        'Jelaskan apa itu Simulink, dan gambarkan diagram blok sistem orde 1! (Gunakan pulpen biru untuk NIM ganjil, merah untuk NIM genap + watermark Nama_NIM).',
      ],
      shift2: [
        'Jelaskan apa itu orde dan jelaskan apa yang Anda ketahui mengenai sistem orde 1!',
        'Sebutkan dan jelaskan parameter-parameter pada orde 1!',
        'Jelaskan apa yang dimaksud dengan fungsi alih!',
        'Mengapa pada sistem orde 1 digunakan perumpamaan rangkaian RC seri? Serta jelaskan bagaimana cara kerja rangkaian RC seri ini pada sistem orde 1!',
        'Apa yang Anda ketahui mengenai redaman dan juga slope?',
        'Jelaskan apa itu Simulink, dan gambarkan diagram blok sistem orde 1! (Gunakan pulpen biru untuk NIM ganjil, merah untuk NIM genap + watermark Nama_NIM).',
      ],
    },
    referensi: 'Ogata, K. & Leksono, E. (1991). Teknik Kontrol Automatik. Erlangga; Yudaningtyas, E. Diktat Pengenalan Sistem Pengaturan UB.',
  },
  {
    id: 'modul-3',
    no: 'Modul III',
    title: 'Respon Transien Plant Orde 2 dengan Menggunakan MATLAB',
    pages: 'Halaman 36 - 51',
    tujuan: [
      'Mengetahui fungsi alih model sistem orde 2.',
      'Mampu menggunakan MATLAB untuk menghasilkan grafik respon transien sistem orde 2 dengan berbagai jenis input.',
      'Mengamati performansi sistem berdasarkan grafik respon transien dengan input unit step.',
    ],
    teori: [
      {
        sub: '2.1 Bentuk Umum & Karakteristik Orde Dua',
        isi: 'Fungsi alih standar orde dua: C(s)/R(s) = wn^2 / (s^2 + 2*zeta*wn*s + wn^2). Dinamika sistem ditentukan oleh parameter rasio redaman (zeta / ξ) dan frekuensi alamiah tidak teredam (wn).',
        poin: [
          'Teredam Kurang (Underdamped, 0 < ξ < 1): Kutub sekawan kompleks, memiliki overshoot dan berosilasi menuju steady state.',
          'Teredam Kritis (Critically Damped, ξ = 1): Kutub real kembar, respon paling cepat tanpa osilasi/overshoot.',
          'Teredam Lebih (Overdamped, ξ > 1): Kutub real berbeda, respon lambat tanpa overshoot.',
          'Tanpa Redaman (Undamped, ξ = 0): Sistem berosilasi terus menerus dengan frekuensi wn.',
        ],
      },
      {
        sub: '2.2 Parameter Respon Transien & Model Pegas-Massa',
        isi: 'Karakteristik respon step dinilai dari 6 parameter utama: Settling Time (ts), Delay Time (td), Rise Time (tr), Peak Time (tp), Maximum Overshoot (%Mp), dan Steady-State Error (ess). Model fisik yang diuji adalah sistem pegas-massa-peredam cairan: Y(s)/U(s) = 1 / (m*s^2 + b*s + k).',
        poin: [
          'Settling Time (ts): Waktu mencapai daerah toleransi ±2% atau ±5% dari nilai akhir.',
          'Rise Time (tr): Waktu naik 10-90% (overdamped) atau 0-100% (underdamped).',
          'Maximum Overshoot (Mp): Persentase lonjakan nilai puncak di atas nilai akhir.',
          'Konstanta Pegas-Massa: m = massa (kg), b = redaman (Ns/m), k = konstanta pegas (N/m).',
        ],
      },
    ],
    langkah: [
      {
        judul: 'Percobaan 1: Respon Impuls Pegas Massa (Plot 1.1 & 1.2)',
        code: `% ORDE 2 INPUT IMPULSE
% Parameter Sistem Pegas Massa
m = 6;    % Massa balok (kg)
b = 2;    % Konstanta redaman (Ns/m) (Plot 1.1: b=2 | Plot 1.2: b=4)
k = 3.5;  % Konstanta pegas (N/m)

% Fungsi Alih Sistem Orde 2
num = [0 0 1];
denum = [m b k];
sys = tf(num, denum);

% Plot Respon Impuls hingga t = 25s
impulse(sys, 25);
title('Respon Impuls Sistem Orde Dua (Pegas-Massa)');
ylabel('simpangan y (meter)');
grid on;`,
      },
      {
        judul: 'Percobaan 2: Respon Step Orde 2 & Analisis Parameter (Plot 1.3 & 1.4)',
        code: `% ORDE 2 INPUT STEP
m = 6;    % Massa (kg)
b = 3;    % Redaman (Plot 1.3: b=3 | Plot 1.4: b=4)
k = 2;    % Pegas (N/m)

num = [0 0 1];
denum = [m b k];
sys = tf(num, denum);

% Plot Respon Step hingga t = 35s
step(sys, 35);
title('Respon Step Sistem Pegas-Massa-Damper');
ylabel('simpangan y (meter)');
grid on;

% Lakukan pembacaan grafik untuk menentukan:
% ts (settling time), td (delay time), tr (rise time), tp (peak time)
% %Mp (maximum overshoot), ess (error steady state), dan jenis redaman`,
      },
    ],
    tugasAkhir: {
      shift1: [
        'Diketahui sistem orde 2 dengan m = 3 kg, b = 1 angka terakhir NIM (jika 0 diganti 2), dan k = 2. Buatlah plot respon step menggunakan MATLAB!',
        'Sertakan source code dan grafik, carilah nilai settling time, delay time, rise time, peak time, max overshoot, error steady state, serta tentukan jenis redamannya ke dalam tabel!',
        'Buatkan fungsi alihnya menggunakan Equation secara rinci!',
        'Apabila nilai b pada soal nomor 1 diperkecil menjadi setengahnya, apa yang terjadi terhadap nilai overshoot dan settling time? Buktikan dengan grafik perbandingan!',
        'Buatkan kesimpulan minimal 3 poin mengenai hasil pengamatan!',
        'Bentuklah plot respon transien sistem orde 2 dengan Simulink MATLAB dengan nilai m=5, b=2 angka terakhir NIM, k=3.',
      ],
      shift2: [
        'Diketahui sistem pegas-massa dengan m = 2 angka terakhir NIM, b = 4, dan k = 1. Buatlah plot respon impulse menggunakan MATLAB!',
        'Sertakan source code dan grafik, carilah nilai settling time, delay time, rise time, peak time, max overshoot, error steady state, serta tentukan jenis redamannya ke dalam tabel!',
        'Buatkan fungsi alihnya menggunakan Equation secara rinci!',
        'Apabila nilai k diperbesar 2 kali lipat, apa yang terjadi terhadap sistem? Buktikan dengan grafik perbandingan!',
        'Buatkan kesimpulan minimal 3 poin mengenai hasil pengamatan!',
        'Bentuklah plot respon transien sistem orde 2 dengan Simulink MATLAB dengan nilai m=4, b=3 angka terakhir NIM, k=5.',
      ],
    },
    tugasRumah: {
      shift1: [
        'Apa yang Anda ketahui mengenai sistem orde 2, dan jelaskan perbedaannya dengan sistem orde 1!',
        'Sebutkan dan jelaskan parameter-parameter pada orde 2!',
        'Jelaskan apa yang Anda ketahui mengenai error steady state dan overshoot!',
        'Mengapa pada sistem orde 2 digunakan perumpamaan sistem pegas massa? Jelaskan cara kerjanya!',
        'Apa yang Anda ketahui mengenai fungsi alih, dan buatkan fungsi alih orde 2!',
        'Jelaskan apa itu Simulink, dan gambarkan diagram blok sistem orde 2! (Tinta biru untuk NIM ganjil, merah untuk NIM genap + watermark Nama_NIM).',
      ],
      shift2: [
        'Apa yang Anda ketahui mengenai sistem orde 2, dan jelaskan perbedaannya dengan sistem orde 1!',
        'Sebutkan dan jelaskan parameter-parameter pada orde 2!',
        'Jelaskan apa yang Anda ketahui mengenai error steady state dan overshoot!',
        'Mengapa pada sistem orde 2 digunakan perumpamaan sistem pegas massa? Jelaskan cara kerjanya!',
        'Sebutkan dan jelaskan jenis-jenis redaman serta gambarkan kurvanya!',
        'Jelaskan apa itu Simulink, dan gambarkan diagram blok sistem orde 2! (Tinta biru untuk NIM ganjil, merah untuk NIM genap + watermark Nama_NIM).',
      ],
    },
    referensi: 'Ogata, K. (1991). Teknik Kontrol Automatik Jilid 1 & 2. Erlangga; Lab Sistem Kontrol UB.',
  },
  {
    id: 'modul-4',
    no: 'Modul IV',
    title: 'Metode Analisis Sistem Orde 2 dengan Menggunakan MATLAB',
    pages: 'Halaman 52 - 68',
    tujuan: [
      'Mampu menggunakan MATLAB untuk metode root locus pada sistem orde 2.',
      'Mampu menggunakan MATLAB untuk analisis sistem frekuensi dengan metode diagram bode pada sistem orde 2.',
    ],
    teori: [
      {
        sub: '2.1 Metode Root Locus (Letak Kedudukan Akar)',
        isi: 'Root Locus memetakan lintasan pole loop tertutup saat penguatan K diubah dari 0 hingga tak terhingga. Memberikan panduan kestabilan dan respon transient loop tertutup.',
        poin: [
          'Pole (Akar Denominator / Penyebut): Dilambangkan tanda silang (x). Titik awal lintasan (K=0).',
          'Zero (Akar Numerator / Pembilang): Dilambangkan lingkaran (o). Titik akhir lintasan (K->∞).',
          'Kondisi Stabil: Seluruh pole berada di sebelah kiri sumbu imajiner (Re(s) < 0).',
          'Kondisi Stabil Marginal: Pole berada tepat pada sumbu imajiner / titik asal.',
          'Kondisi Tidak Stabil: Salah satu atau kedua pole berada di sebelah kanan sumbu imajiner.',
          'Sifat Root Locus: Simetris terhadap sumbu real dan pole-zero selalu berpasangan.',
        ],
      },
      {
        sub: '2.2 Analisis Respon Frekuensi & Diagram Bode',
        isi: 'Diagram Bode menggambarkan respon frekuensi sistem sinusoida dalam dua grafik terpisah: Magnitude (dB vs log w) dan Sudut Fasa (derajat vs log w).',
        poin: [
          'Gain Margin (GM): Beda gain terhadap 0 dB pada saat fase mencapai -180° (Phase Crossover Frequency, Wpc).',
          'Phase Margin (PM): Beda fase terhadap -180° pada saat gain bernilai 0 dB (Gain Crossover Frequency, Wgc).',
          'Kriteria Stabil: GM dan PM bernilai positif, serta PM > GM.',
          'Kriteria Stabil Marginal: GM = 0 dB dan PM = 0° (atau PM = GM).',
          'Kriteria Tidak Stabil: Salah satu bernilai negatif atau GM > PM.',
        ],
      },
    ],
    langkah: [
      {
        judul: 'Percobaan 1: Metode Root Locus (rlocus & rlocfind)',
        code: `% ORDE 2 ROOT LOCUS
m = 6;
b = 5;
k = 2;

num = [0 0 1];
denum = [m b k];
sys = tf(num, denum);

% Figure 1: Respon Open Loop Step
figure(1)
step(sys, 40);
title('Respon Open Loop Sistem');
ylabel('simpangan y (meter)');
grid on;

% Figure 2: Plot Root Locus
figure(2)
rlocus(sys);
title('Root Locus Sistem Pegas-Massa');
grid on;

% Figure 3: Pemilihan Pole Interaktif & Feedback Loop Tertutup
figure(3)
rlocus(sys);
grid on;
[K, poles] = rlocfind(sys) % Klik pada grafik root locus untuk memilih titik pole
newsys = feedback(sys*K, 1);
step(newsys, 40);
title('Respon Sistem dengan Penguatan K');
ylabel('simpangan y (meter)');
grid on;`,
      },
      {
        judul: 'Percobaan 2: Analisis Diagram Bode & Margin Kestabilan',
        code: `% ORDE 2 BODE PLOT
m = 10;
b = 6;
k = -4;

num = [0 0 1];
denum = [m b k];
sys = tf(num, denum);

% Figure 1: Diagram Bode Standar
figure(1)
bode(sys);
grid on;

% Figure 2: Plot Gain & Phase Margin dengan Penguatan K
figure(2)
K = 100;
margin(K*sys); % Menampilkan nilai GM (dB) dan PM (deg)
grid on;`,
      },
    ],
    tugasAkhir: {
      shift1: [
        'Pada metode root locus arahkan aim rlocfind sehingga didapat selected point (NIM ganjil: -0.3xxx + 0.2xxxi, NIM genap: -0.2xxx + 0.1xxi). Tentukan nilai K dan poles baru!',
        'Buat dan jabarkan penurunan fungsi alih newsys yang didapat secara rinci menggunakan Equation!',
        'Lampirkan source code dan grafik, carilah parameter settling time, delay time, rise time, peak time, max overshoot, error steady state, dan jenis redamannya ke dalam tabel!',
        'Berikan 3 poin kesimpulan mengenai root locus yang Anda buat!',
        'Pada metode bode plot ubahlah parameter M, B, K menggunakan 3 angka belakang NIM Anda (contoh 202411124 maka M=1, B=2, K=4). Lampirkan figure 1 dan figure 2!',
        'Buatkan fungsi alihnya dan tentukan kondisi kestabilan bode plot dengan penjelasan minimal 250 kata!',
      ],
      shift2: [
        'Pada metode root locus arahkan aim rlocfind sehingga didapat selected point (NIM ganjil: -0.4xxx - 0.5xxxi, NIM genap: -0.6xxx + 0.7xxxi). Tentukan nilai K dan poles baru!',
        'Buat dan jabarkan penurunan fungsi alih newsys yang didapat secara rinci menggunakan Equation!',
        'Lampirkan source code dan grafik, carilah parameter performansi dan jenis redamannya ke dalam tabel!',
        'Berikan 3 poin kesimpulan mengenai root locus yang Anda buat!',
        'Pada metode bode plot ubahlah parameter K, B, M menggunakan 3 angka belakang NIM Anda. Lampirkan figure 1 dan figure 2!',
        'Buatkan fungsi alihnya dan tentukan kondisi kestabilan bode plot dengan penjelasan minimal 250 kata!',
      ],
    },
    tugasRumah: {
      shift1: [
        'Jelaskan apa yang Anda ketahui mengenai metode root locus dan metode bode plot!',
        'Apa itu Pole dan Zero? Jelaskan mengapa pole dan zero harus berada di sebelah kiri sumbu real agar sistem stabil!',
        'Jelaskan apa yang dimaksud dengan kondisi stabil dan stabil marginal!',
        'Apa yang dimaksud dengan sistem loop tertutup dan jelaskan perbedaannya dengan sistem loop terbuka!',
        'Sebutkan sifat-sifat root locus! (Minimal 4)',
        'Apa itu fase margin dan gain margin? Mengapa kurva phase di bawah dan magnitude di atas?',
        'Pada program root locus, apa yang membedakan figure (1) dan figure (2)?',
        'Gambarkan contoh desain sederhana sistem kontrol loop tertutup! (Tinta biru untuk NIM ganjil, merah untuk NIM genap + watermark Nama_NIM).',
      ],
      shift2: [
        'Jelaskan apa yang Anda ketahui mengenai metode root locus dan metode bode plot!',
        'Apa itu Pole dan Zero? Mengapa harus di sebelah kiri bidang s?',
        'Jelaskan apa yang dimaksud dengan kondisi stabil dan stabil marginal!',
        'Jelaskan perbedaan sistem loop tertutup dengan loop terbuka!',
        'Buatkanlah contoh kurva root locus untuk kondisi Stabil, Tidak Stabil, dan Stabil Marginal!',
        'Apa itu fase margin dan gain margin? Apakah kurva boleh terbalik?',
        'Apa yang membedakan figure (1) dan figure (2) pada program root locus?',
        'Gambarkan contoh desain sederhana sistem kontrol loop tertutup! (Tinta biru untuk NIM ganjil, merah untuk NIM genap + watermark Nama_NIM).',
      ],
    },
    referensi: 'Ogata, K. (1991). Teknik Kontrol Automatik Jilid 1 & 2. Erlangga; Diktat Pengenalan Sistem Pengaturan UB.',
  },
  {
    id: 'modul-5',
    no: 'Modul V',
    title: 'Desain Kontroler PID dengan MATLAB',
    pages: 'Halaman 69 - 80',
    tujuan: [
      'Mampu menggunakan MATLAB untuk merancang sistem kontrol dengan kontroler PID.',
      'Memahami pengaruh parameter PID terhadap respon sistem.',
    ],
    teori: [
      {
        sub: '2.1 Arsitektur Sistem Kendali Loop Tertutup & Motor DC',
        isi: 'Sistem kendali loop tertutup memanfaatkan umpan balik (feedback) untuk menghitung selisih error e(t) = Setpoint - Feedback. Komponen utamanya adalah Controller, Aktuator (Driver), Plant (Motor DC), dan Feedback Sensor (Tachogenerator).',
        poin: [
          'Fungsi Alih Motor DC: G(s) = Y(s)/U(s) = 6 / (s^2 + 16s + 12).',
          'Setpoint: Target keluaran yang diinginkan (misal kecepatan putar 160 RPM).',
          'Error: Selisih antara kecepatan setpoint dengan nilai aktual pembacaan tachogenerator.',
          'Aktuator / Driver: Mengatur besar tegangan / duty cycle PWM ke motor DC.',
        ],
      },
      {
        sub: '2.2 Aksi Kontroler P, PI, PD, dan PID',
        isi: 'Transfer function kontroler PID: C(s) = Kp + Ki/s + Kd*s = (Kd*s^2 + Kp*s + Ki) / s. Setiap parameter memiliki peran spesifik dalam memperbaiki unjuk kerja sistem.',
        poin: [
          'Proporsional (Kp): Mempercepat rise time dan mengurangi error, namun menambah overshoot jika terlalu tinggi.',
          'Integral (Ki): Mengeliminasi steady-state error hingga nol (ess = 0), namun meningkatkan waktu osilasi dan waktu turun.',
          'Derivative (Kd): Meredam lonjakan overshoot dan mempercepat redaman transien berdasarkan laju perubahan error.',
          'Kaidah Tuning: Tambahkan P untuk rise time, tambahkan I untuk eliminasi error tunak, tambahkan D untuk redaman overshoot.',
        ],
      },
    ],
    langkah: [
      {
        judul: 'Percobaan 1: Kontroler Proporsional (P) di Simulink (Sub Bab 4.1)',
        code: `% Pengujian Kontroler P pada Sudut/Kecepatan Motor DC
% Blok Simulink: Step (Final Value = 160 rpm, Step Time = 0) -> Summing (+ -) -> PID Controller -> Transfer Fcn [6]/[1 16 12] -> Scope
%
% Pengaturan Parameter PID:
% I = 0, D = 0, N = 0
% Variasi Nilai P:
% 1. P = 0   (Sistem tanpa kendali proporsional)
% 2. P = 15  (Respon mulai cepat, terdapat steady state error)
% 3. P = 20  (Respon lebih cepat, overshoot sedikit meningkat)`,
      },
      {
        judul: 'Percobaan 2: Kontroler Proportional-Integral (PI) (Sub Bab 4.2)',
        code: `% Pengujian Kontroler PI
% Pengaturan Parameter PID:
% D = 0, N = 0, P = 15
% Variasi Nilai I:
% 1. I = 4  (Steady state error mulai tereliminasi menuju 160 rpm)
% 2. I = 8  (Steady state error hilang total, osilasi transien sedikit bertambah)`,
      },
      {
        judul: 'Percobaan 3: Kontroler PID Lengkap (Sub Bab 4.3)',
        code: `% Pengujian Kontroler PID (Proportional-Integral-Derivative)
% Pengaturan Parameter:
% Filter Coefficient (N) = 3
% P = 15, I = 8
% Variasi Nilai D:
% 1. D = 3  (Meredam overshoot dari aksi integral, respon menjadi stabil mulus)
% 2. D = 6  (Redaman lebih kuat, overshoot semakin kecil)`,
      },
    ],
    tugasAkhir: {
      shift1: [
        'Berdasarkan diagram Simulink yang telah dibuat, sebutkan blok-blok yang digunakan dalam sistem kontrol PID dan jelaskan fungsi masing-masing blok tersebut!',
        'Apa perbedaan fungsi antara Scope dan Scope 1 pada percobaan?',
        'Pada percobaan kontroler proporsional dengan setpoint 160 rpm, bagaimana bentuk respons sistem ketika nilai P = 0?',
        'Ubahlah nilai P = AB (2 angka terakhir NIM, jika ada angka 0 diganti 1). Bandingkan respons output ketika P diubah dari 15 menjadi 20! Apa perubahan pada rise time, overshoot, dan kestabilan?',
        'Mengapa pada percobaan kontroler proporsional nilai I, D, dan N dibuat sama dengan 0?',
      ],
      shift2: [
        'Pada percobaan kontroler PI dengan nilai P = 15, bagaimana perbedaan respons sistem antara penggunaan I = 4 dan I = 8?',
        'Berdasarkan grafik yang diamati, bagaimana pengaruh peningkatan nilai integral terhadap steady-state error, overshoot, dan osilasi output?',
        'Ubahlah nilai P = AB (2 angka terakhir NIM). Bandingkan respons output sistem ketika nilai proporsional diubah dari P = 15 menjadi P = 20!',
        'Apa fungsi Filter Coefficient (N) = 1 / 3 pada percobaan kontroler PID yang menggunakan parameter derivative?',
        'Berdasarkan seluruh grafik percobaan kontroler P, PI, dan PID, kontroler manakah yang menghasilkan respons paling mendekati setpoint 160 rpm dengan cepat dan stabil? Jelaskan!',
      ],
    },
    tugasRumah: {
      shift1: [
        'Jelaskan apa yang Anda ketahui mengenai sistem kontrol PID!',
        'Sebutkan dan jelaskan minimal 3 desain controller selain desain controller PID!',
        'Apa yang dimaksud dengan sistem loop tertutup dan jelaskan perbedaannya dengan sistem loop terbuka!',
        'Apa yang Anda ketahui mengenai plant? Sebutkan contoh plant dalam kehidupan sehari-hari dan jelaskan perbedaan plant dengan aktuator!',
        'Sebutkan apa saja kriteria sistem yang baik (minimal 3)!',
        'Jelaskan apa yang Anda ketahui mengenai Controller, Aktuator, Plant, dan Feedback!',
        'Sebutkan dan jelaskan penerapan control PID dalam kehidupan sehari-hari (minimal 6)!',
        'Buatkan kurva sinyal dari proporsional jika diberikan kurang, lebih, dan ideal!',
        'Buatkan kurva sinyal dari Integral jika diberikan kurang, lebih, dan ideal!',
        'Gambarkanlah desain diagram blok PID close loop system! (Tinta biru untuk NIM ganjil, merah untuk NIM genap + watermark Nama_NIM).',
      ],
      shift2: [
        'Jelaskan apa yang Anda ketahui mengenai sistem kontrol PID!',
        'Sebutkan dan jelaskan minimal 3 desain controller selain desain controller PID!',
        'Apa yang dimaksud dengan sistem loop tertutup dan jelaskan perbedaannya dengan sistem loop terbuka!',
        'Apa yang Anda ketahui mengenai plant? Sebutkan contoh plant dan perbedaannya dengan aktuator!',
        'Sebutkan kriteria sistem yang baik (minimal 3)!',
        'Jelaskan Controller, Aktuator, Plant, dan Feedback!',
        'Buatkan kurva sinyal dari proporsional jika diberikan kurang, lebih, dan ideal!',
        'Buatkan kurva sinyal dari Integral jika diberikan kurang, lebih, dan ideal!',
        'Buatkan kurva sinyal dari Derivative jika diberikan kurang, lebih, dan ideal!',
        'Gambarkanlah desain diagram blok PID close loop system! (Tinta biru untuk NIM ganjil, merah untuk NIM genap + watermark Nama_NIM).',
      ],
    },
    referensi: 'Ogata, K. (1996 & 2001). Teknik Kontrol Automatik & Modern Control Engineering (4th ed.). Prentice Hall.',
  },
]

// Tim Penyusun Resmi
const TIM_PENYUSUN = {
  kepalaLab: 'Ir. Meyhart Torsna Bangkit Sitorus, S.T., M.Eng., IPM.',
  dosen: 'Ir. Meyhart Torsna Bangkit Sitorus, S.T., M.Eng., IPM.',
  laboran: 'Panca Agung Nugraha, S.T.',
  asisten: [
    'Anggi Berlian Hutasoit',
    'Aswad',
    'Bungaran Jeremi Jonatan Butar Butar',
    'Dedy Adhitya Rahmadani',
    'Dzul Fachmi',
    'Faris Elhimma Fadli',
    'Hakimi Farhan Elfalah',
    'Kaila Nafisa',
    'Khansa Zara Anefda',
    'Komang Jaya Laksmana BP',
    'Muhammad Fachrizal Faqih Hilmawan',
    'Muhammad Uzair Suluhi',
    'Muhammad Yusril Shandi',
    'Muhammad Kalieh Pangestoe',
    'Muhammad Farrel Alfalah',
    'Novita Permatasyania',
    'Putri Sahira',
    'Raihan Riza Thaffany',
    'Seja Sastrianto',
    'Siti Arrossa Nur Aris Taryana Putri',
    'Siti Nur Aziza Latuconsina',
    'Umar Wanto',
    'Uminyya Zaskia Putri Rusna',
    'Yuliana Kristin',
    'Yosua Kevin Pratama Naibaho',
  ],
}

// 12 Tata Tertib Praktikum Resmi Laboratorium ICAL (Halaman 8-9)
const TATA_TERTIB_RESMI = [
  {
    no: 1,
    teks: 'Praktikan wajib hadir 15 menit sebelum kegiatan praktikum berlangsung. Jika praktikan terlambat hadir praktikum setelah pre-test selesai, maka praktikan tidak diizinkan mengikuti kegiatan praktikum.',
  },
  {
    no: 2,
    teks: 'Pakaian wajib menggunakan kemeja berkerah rapi dan jas almamater resmi Institut Teknologi PLN.',
  },
  {
    no: 3,
    teks: 'Modul praktikum wajib diunduh sebelum pelaksanaan pengarahan praktikum.',
  },
  {
    no: 4,
    teks: 'Modul tidak diwajibkan untuk di-print (cukup dalam format digital PDF).',
  },
  {
    no: 5,
    teks: 'Praktikan wajib mengumpulkan tugas rumah sebelum melaksanakan praktikum di Assignment MS Teams.',
  },
  {
    no: 6,
    teks: 'Praktikan wajib menjaga keselamatan dirinya, peralatan, dan kebersihan laboratorium.',
  },
  {
    no: 7,
    teks: 'Sebelum praktikum dimulai, praktikan wajib melaksanakan pre-test dengan menggunakan aplikasi ketiga (KAHOOT!).',
  },
  {
    no: 8,
    teks: 'Praktikan yang tidak hadir tanpa keterangan pada hari praktikum yang telah ditentukan, maka nilai pada pertemuan tersebut sama dengan nol (0).',
  },
  {
    no: 9,
    teks: 'Apabila praktikan berhalangan hadir harus ada pemberitahuan dengan perizinan untuk sakit (maksimal H+1 dan konfirmasi H-3 jam sebelum praktikum dimulai); untuk izin (H-3 hari sebelum praktikum dimulai). Semua perizinan wajib disampaikan kepada asisten masing-masing disertai bukti yang jelas, mencari kelas pengganti, surat izin asisten lab, dan surat dokter bila sakit.',
  },
  {
    no: 10,
    teks: 'Kelompok praktikum yang telah dibuat tidak bisa diubah.',
  },
  {
    no: 11,
    teks: 'Diharapkan praktikan menjaga sikap dan tutur kata selama praktikum berlangsung.',
  },
  {
    no: 12,
    teks: 'Ketentuan Plagiarisme: Plagiarisme 50% - 60% = Nilai laporan dikurangi 50%. Plagiarisme > 60% = Auto E. Laporan praktikum wajib dikumpulkan dalam waktu yang ditentukan (terlambat = nilai 0).',
    isAlert: true,
  },
]

export default function DskDetailPage({ setCurrentPage }: DskDetailPageProps) {
  const [selectedModulIndex, setSelectedModulIndex] = useState(0)
  const [activeShift, setActiveShift] = useState<'shift1' | 'shift2'>('shift1')
  const [activeTaskTab, setActiveTaskTab] = useState<'ta' | 'tr'>('ta')
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null)
  const [showPdfModal, setShowPdfModal] = useState(false)

  const activeModul = DSK_MODULES[selectedModulIndex]

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedCodeIndex(idx)
    setTimeout(() => setCopiedCodeIndex(null), 2000)
  }

  const bobotPenilaian = [
    { label: 'Kehadiran', bobot: '10%', desc: 'Presensi dan kedisiplinan praktikan tepat waktu (Hadir 15 mnt sebelum mulai)', color: '#102544', bg: '#EEF5FA', icon: 'check-circle' },
    { label: 'Tugas Rumah / Pre-Test', bobot: '15%', desc: 'Tugas persiapan via MS Teams & kuis awal via KAHOOT!', color: '#0A58BE', bg: '#EBF4FE', icon: 'file-text' },
    { label: 'Keaktifan', bobot: '10%', desc: 'Partisipasi aktif dalam tanya jawab dan eksperimen MATLAB', color: '#0D9488', bg: '#F0FDFA', icon: 'zap' },
    { label: 'Laporan Mingguan', bobot: '25%', desc: 'Analisa numerik, grafik respon, dan pembahasan praktikum', color: '#2563EB', bg: '#EFF6FF', icon: 'book-open' },
    { label: 'Program Akhir / Jurnal', bobot: '10%', desc: 'Penyusunan jurnal ilmiah kelompok & perancangan simulasi', color: '#7C3AED', bg: '#F5F3FF', icon: 'layers' },
    { label: 'UAP (Ujian Akhir)', bobot: '30%', desc: 'Evaluasi praktikum komprehensif akhir semester', color: '#E11D48', bg: '#FFF1F2', icon: 'award' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#F4F8FC' }}>
      {/* Background Pattern Watermark */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dskNodePattern" width="280" height="280" patternUnits="userSpaceOnUse">
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
        <rect width="100%" height="100%" fill="url(#dskNodePattern)" />
      </svg>

      {/* Header Banner */}
      <div
        className="relative pt-24 pb-14 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #102544 0%, #1E4B85 50%, #537AB8 100%)',
        }}
      >
        <div className="absolute inset-0 dots-header pointer-events-none opacity-35" style={{ zIndex: 1 }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8" style={{ zIndex: 10 }}>
          {/* Back button */}
          <button
            onClick={() => setCurrentPage('home')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 transition-all cursor-pointer mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <Icon name="arrow-left" size={14} /> Kembali ke Beranda
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="section-badge mb-3" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
                <Icon name="book-open" size={13} /> Modul Resmi Praktikum
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
                Dasar Sistem Kontrol (DSK)
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.92)', marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '680px', lineHeight: 1.6 }}>
                Buku panduan lengkap praktikum DSK Institut Teknologi PLN: 5 Modul Pembelajaran MATLAB & Simulink, Tata Tertib Resmi, Penilaian, dan Simulasi PID Loop Tertutup.
              </p>

              {/* Action Buttons in Banner */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-[#102544] hover:bg-blue-50 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <Icon name="eye" size={16} color="#102544" /> Baca Dokumen PDF Modul
                </button>
                <a
                  href="/modul/MODUL DASAR SISTEM KONTROL.pdf?download=1"
                  download
                  className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/20 hover:bg-white/30 text-white border border-white/40 transition-all flex items-center gap-2 cursor-pointer"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <Icon name="download" size={16} /> Unduh PDF Modul (3.9 MB)
                </a>
              </div>
            </div>

            {/* Quick Badge Box */}
            <div className="hidden lg:flex flex-col items-center justify-center p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/25 shadow-xl text-center min-w-[200px]">
              <span className="text-3xl font-extrabold text-white tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
                5 MODUL
              </span>
              <span className="text-xs text-blue-100 mt-1 font-semibold">Total 80 Halaman</span>
              <div className="mt-3 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[0.75rem] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Edisi Resmi ICAL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-12" style={{ zIndex: 10 }}>

        {/* 1. EXPLORER 5 MODUL LENGKAP DSK */}
        <section className="space-y-6">
          <div className="border-b border-[#D6E4F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="section-badge mb-2"><Icon name="layers" size={13} /> Kurikulum & Materi Praktikum</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
                Silabus & Eksplorasi 5 Modul DSK
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#537AB8]">Pilih modul untuk melihat teori, skrip, dan bank soal</span>
          </div>

          {/* Module Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {DSK_MODULES.map((m, idx) => {
              const active = idx === selectedModulIndex
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModulIndex(idx)}
                  className="p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border"
                  style={{
                    background: active ? 'linear-gradient(135deg, #102544 0%, #1E4B85 100%)' : '#FFFFFF',
                    borderColor: active ? '#102544' : '#BAD6EB',
                    boxShadow: active ? '0 8px 20px rgba(16, 37, 68, 0.2)' : 'none',
                    color: active ? '#FFFFFF' : '#162D4E',
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="px-2 py-0.5 rounded-md text-[0.7rem] font-extrabold uppercase"
                      style={{
                        background: active ? 'rgba(255,255,255,0.2)' : '#EEF5FA',
                        color: active ? '#FFFFFF' : '#1E4B85',
                      }}
                    >
                      {m.no}
                    </span>
                    <span className="text-[0.68rem] opacity-75 font-mono">{m.pages}</span>
                  </div>
                  <div
                    className="font-bold text-xs sm:text-sm line-clamp-2"
                    style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.3 }}
                  >
                    {m.title.replace(' dengan Menggunakan MATLAB', '').replace(' dengan MATLAB', '')}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Active Module Detail Container */}
          <div
            className="rounded-3xl p-6 sm:p-9 bg-white border border-[#BAD6EB] shadow-sm relative space-y-8"
          >
            {/* Header of Active Module */}
            <div className="border-b border-[#E1EDF8] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="px-3.5 py-1 rounded-xl text-xs font-extrabold text-white shadow-2xs"
                    style={{ background: 'linear-gradient(135deg, #102544 0%, #1E4B85 100%)', fontFamily: 'var(--font-heading)' }}
                  >
                    {activeModul.no}
                  </span>
                  <span className="text-xs text-[#537AB8] font-bold">{activeModul.pages}</span>
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.7rem)',
                    color: '#102544',
                  }}
                >
                  {activeModul.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#1E4B85] bg-[#EEF5FA] border border-[#BAD6EB] hover:bg-blue-100/60 transition-all flex items-center gap-1.5 cursor-pointer"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <Icon name="eye" size={14} /> Lihat di PDF
                </button>
              </div>
            </div>

            {/* I. Tujuan Praktikum */}
            <div>
              <h4 className="flex items-center gap-2 font-bold text-[#102544] text-base mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                <Icon name="target" size={18} color="#0A58BE" /> I. Tujuan Praktikum
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeModul.tujuan.map((tuj, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#F8FBFE] border border-[#BAD6EB]/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1E4B85] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-[#2C4D78] leading-relaxed font-medium">
                      {tuj}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* II. Ringkasan Teori & Konsep Kunci */}
            <div>
              <h4 className="flex items-center gap-2 font-bold text-[#102544] text-base mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                <Icon name="book-open" size={18} color="#0A58BE" /> II. Dasar Teori & Persamaan Matematis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeModul.teori.map((teo, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#F0F6FD] border border-[#BAD6EB] space-y-2.5">
                    <h5 className="font-bold text-sm text-[#102544]" style={{ fontFamily: 'var(--font-heading)' }}>
                      {teo.sub}
                    </h5>
                    <p className="text-xs sm:text-sm text-[#3B577D] leading-relaxed">
                      {teo.isi}
                    </p>
                    {teo.poin && teo.poin.length > 0 && (
                      <ul className="space-y-1.5 pt-1">
                        {teo.poin.map((p, pidx) => (
                          <li key={pidx} className="text-xs text-[#2C4D78] flex items-start gap-2">
                            <span className="text-[#0A58BE] font-bold">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* III & IV. Langkah Praktikum & Skrip MATLAB */}
            <div>
              <h4 className="flex items-center gap-2 font-bold text-[#102544] text-base mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                <Icon name="laptop" size={18} color="#0A58BE" /> III & IV. Langkah Percobaan & Skrip Program MATLAB
              </h4>
              <div className="space-y-4">
                {activeModul.langkah.map((step, idx) => (
                  <div key={idx} className="rounded-2xl border border-[#BAD6EB] overflow-hidden bg-slate-950 text-slate-100">
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-200" style={{ fontFamily: 'var(--font-heading)' }}>
                          {step.judul}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(step.code, idx)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCodeIndex === idx ? (
                          <>
                            <Icon name="check" size={12} color="#10B981" /> Tersalin!
                          </>
                        ) : (
                          <>
                            <Icon name="clipboard-list" size={12} /> Salin Skrip
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-xs sm:text-[0.82rem] font-mono leading-relaxed overflow-x-auto text-emerald-400 bg-slate-950/90">
                      <code>{step.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* V & VI. Bank Soal: Tugas Akhir (TA) & Tugas Rumah (TR) */}
            <div className="p-6 rounded-2xl bg-[#EEF5FA] border border-[#BAD6EB] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#BAD6EB] pb-3">
                <div className="flex items-center gap-2">
                  <Icon name="file-text" size={18} color="#0A58BE" />
                  <h4 className="font-bold text-[#102544] text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                    Bank Soal Praktikum: {activeTaskTab === 'ta' ? 'V. Tugas Akhir (TA)' : 'VI. Tugas Rumah (TR)'}
                  </h4>
                </div>

                {/* Sub Tab Switchers */}
                <div className="flex items-center gap-2">
                  {/* TA vs TR Toggle */}
                  <div className="flex rounded-xl bg-white p-1 border border-[#BAD6EB]">
                    <button
                      onClick={() => setActiveTaskTab('ta')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTaskTab === 'ta' ? 'bg-[#102544] text-white' : 'text-[#3B577D]'
                      }`}
                    >
                      Tugas Akhir
                    </button>
                    <button
                      onClick={() => setActiveTaskTab('tr')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTaskTab === 'tr' ? 'bg-[#102544] text-white' : 'text-[#3B577D]'
                      }`}
                    >
                      Tugas Rumah
                    </button>
                  </div>

                  {/* Shift 1 vs Shift 2 Toggle */}
                  <div className="flex rounded-xl bg-white p-1 border border-[#BAD6EB]">
                    <button
                      onClick={() => setActiveShift('shift1')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeShift === 'shift1' ? 'bg-[#1E4B85] text-white' : 'text-[#3B577D]'
                      }`}
                    >
                      Shift 1
                    </button>
                    <button
                      onClick={() => setActiveShift('shift2')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeShift === 'shift2' ? 'bg-[#1E4B85] text-white' : 'text-[#3B577D]'
                      }`}
                    >
                      Shift 2
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-2.5">
                {(activeTaskTab === 'ta' ? activeModul.tugasAkhir[activeShift] : activeModul.tugasRumah[activeShift]).map(
                  (soal, sidx) => (
                    <div
                      key={sidx}
                      className="p-3.5 rounded-xl bg-white border border-[#BAD6EB] flex items-start gap-3 text-xs sm:text-sm text-[#2C4D78]"
                    >
                      <span className="font-bold text-[#1E4B85] min-w-[20px]">{sidx + 1}.</span>
                      <p className="leading-relaxed font-medium whitespace-pre-line">{soal}</p>
                    </div>
                  )
                )}
              </div>

              {/* Note Watermark / Aturan Pengerjaan */}
              <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2.5 text-xs text-[#92400E]">
                <Icon name="warning" size={16} color="#D97706" className="shrink-0 mt-0.5" />
                <p>
                  <strong>Perhatian:</strong> Soal gambar wajib menyertakan watermark berupa <strong>Nama_NIM</strong> (tinta biru untuk NIM ganjil, tinta merah untuk NIM genap). Jawaban tanpa watermark akan dianggap salah / tidak dinilai.
                </p>
              </div>
            </div>

            {/* Referensi Modul */}
            <div className="pt-2 text-xs text-[#6B87A8] flex items-center gap-2 border-t border-[#E1EDF8]">
              <span className="font-bold text-[#102544]">Referensi:</span>
              <span>{activeModul.referensi}</span>
            </div>
          </div>
        </section>

        {/* 2. TATA TERTIB PRAKTIKUM LABORATORIUM RESMI (12 POIN) */}
        <section className="rounded-3xl p-7 sm:p-9 bg-white border border-[#BAD6EB] shadow-sm relative overflow-hidden">
          <div className="border-b border-[#D6E4F0] pb-4 mb-6">
            <div className="section-badge mb-2"><Icon name="shield" size={13} /> Standar Operasional Laboratorium</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              Tata Tertib Praktikum Laboratorium ICAL
            </h2>
            <p className="text-xs sm:text-sm text-[#3B577D] mt-1">
              Ketentuan resmi yang wajib dipatuhi oleh seluruh praktikan Dasar Sistem Kontrol (DSK) selama pelaksanaan praktikum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TATA_TERTIB_RESMI.map((item) => (
              <div
                key={item.no}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  item.isAlert
                    ? 'bg-[#FEF2F2] border-[#FECACA] text-red-900 md:col-span-2'
                    : 'bg-[#F8FBFE] border-[#BAD6EB]/80 text-[#2C4D78]'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs ${
                    item.isAlert ? 'bg-red-600 text-white' : 'bg-[#1E4B85] text-white'
                  }`}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {item.no}
                </span>
                <p className="text-xs sm:text-sm leading-relaxed font-medium">
                  {item.teks}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. BOBOT PENILAIAN & PERIZINAN */}
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#D6E4F0] pb-4">
            <div>
              <div className="section-badge mb-2"><Icon name="bar-chart" size={13} /> Evaluasi Akademik</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
                Bobot Penilaian Praktikum DSK
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

          {/* Ketentuan Perizinan Card */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white border border-[#BAD6EB] shadow-sm space-y-4">
            <h3 className="font-bold text-base sm:text-lg text-[#102544] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Icon name="clock" size={20} color="#0A58BE" /> Prosedur & Tenggat Perizinan Praktikan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#EEF5FA] border border-[#BAD6EB] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0A58BE] shrink-0 border border-[#BAD6EB]">
                  <Icon name="warning" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#102544] text-sm mb-1">Izin Sakit</h4>
                  <p className="text-xs sm:text-sm text-[#3B577D] leading-relaxed">
                    Maksimal <strong>H+1</strong> dengan konfirmasi awal <strong>H-3 jam</strong> sebelum praktikum dimulai. Wajib menyertakan surat dokter dan mencari kelas pengganti.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#EEF5FA] border border-[#BAD6EB] flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0A58BE] shrink-0 border border-[#BAD6EB]">
                  <Icon name="calendar-days" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#102544] text-sm mb-1">Izin Kegiatan / Acara Lain</h4>
                  <p className="text-xs sm:text-sm text-[#3B577D] leading-relaxed">
                    Diajukan minimal <strong>H-3 hari</strong> sebelum pelaksanaan praktikum dengan bukti surat dinas/kegiatan resmi dan persetujuan asisten lab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SIMULASI KONTROL PID VIRTUAL */}
        <section className="space-y-4">
          <div className="border-b border-[#D6E4F0] pb-4">
            <div className="section-badge mb-2"><Icon name="sliders" size={13} /> Laboratorium Virtual</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              Simulasi Kontroler PID (Proportional - Integral - Derivative)
            </h2>
            <p className="text-xs sm:text-sm text-[#3B577D] mt-1">
              Laboratorium virtual interaktif untuk mengamati respon transien loop tertutup sistem kendali kecepatan/sudut motor DC (Materi Modul V).
            </p>
          </div>

          <PIDSimulatorWidget />
        </section>

        {/* 5. TIM PENYUSUN & PENGELOLA MODUL DSK */}
        <section className="rounded-3xl p-7 sm:p-9 bg-white border border-[#BAD6EB] shadow-sm space-y-6">
          <div className="border-b border-[#D6E4F0] pb-4">
            <div className="section-badge mb-2"><Icon name="users" size={13} /> Tim Akademik Laboratorium</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: '#102544' }}>
              Tim Penyusun Modul Praktikum DSK
            </h2>
          </div>

          {/* Dosen & Laboran Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#EEF5FA] border border-[#BAD6EB] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#102544] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Icon name="graduation-cap" size={24} />
              </div>
              <div>
                <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#537AB8]">Kepala Lab & Dosen Praktikum</span>
                <h4 className="font-bold text-[#102544] text-sm sm:text-base">{TIM_PENYUSUN.kepalaLab}</h4>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#EEF5FA] border border-[#BAD6EB] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1E4B85] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Icon name="briefcase" size={24} />
              </div>
              <div>
                <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#537AB8]">Laboran Laboratorium ICAL</span>
                <h4 className="font-bold text-[#102544] text-sm sm:text-base">{TIM_PENYUSUN.laboran}</h4>
              </div>
            </div>
          </div>

          {/* Asisten List */}
          <div>
            <h4 className="font-bold text-[#102544] text-sm sm:text-base mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Icon name="users" size={16} color="#0A58BE" /> Asisten Laboratorium Pengampu (25 Asisten)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {TIM_PENYUSUN.asisten.map((asisten, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-xl bg-[#F8FBFE] border border-[#BAD6EB]/80 text-xs font-semibold text-[#162D4E] flex items-center gap-2 truncate"
                >
                  <span className="w-2 h-2 rounded-full bg-[#0A58BE] shrink-0" />
                  <span className="truncate">{asisten}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Card */}
        <div
          className="rounded-3xl p-8 text-center bg-gradient-to-r from-[#102544] via-[#1E4B85] to-[#537AB8] text-white shadow-xl flex flex-col items-center justify-center gap-4"
        >
          <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Siap Melaksanakan Praktikum DSK?
          </h3>
          <p className="text-blue-100 text-sm max-w-xl">
            Pelajari modul secara mandiri, unduh template laporan resmi, dan instal MATLAB pada laptop sebelum sesi praktikum dimulai.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <button
              onClick={() => setShowPdfModal(true)}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-[#102544] hover:bg-blue-50 transition-all shadow-md cursor-pointer flex items-center gap-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Icon name="book-open" size={16} /> Buka PDF Modul
            </button>
            <button
              onClick={() => setCurrentPage('template')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/40 transition-all cursor-pointer flex items-center gap-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Icon name="file-text" size={16} /> Unduh Format Laporan DSK
            </button>
          </div>
        </div>

      </div>

      {/* Direct In-App PDF Reader Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeInUp">
          <div
            className="relative w-full max-w-5xl h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#C6DBF2]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#BAD6EB] bg-[#102544] text-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#1E4B85] uppercase tracking-wider shrink-0">
                  DSK PDF
                </span>
                <h3 className="font-bold text-base sm:text-lg truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                  MODUL PRAKTIKUM DASAR SISTEM KONTROL - IT PLN
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/modul/MODUL DASAR SISTEM KONTROL.pdf?download=1"
                  download
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs text-white bg-[#1E4B85] hover:bg-[#2563EB] transition-colors shadow-xs"
                >
                  <Icon name="download" size={14} /> Unduh PDF
                </a>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <Icon name="x" size={20} />
                </button>
              </div>
            </div>

            {/* Modal PDF Iframe */}
            <div className="flex-1 w-full h-full bg-slate-100 relative">
              <iframe
                src="/modul/MODUL DASAR SISTEM KONTROL.pdf#toolbar=0&navpanes=0&scrollbar=1&view=FitH"
                className="w-full h-full border-0"
                title="Modul Praktikum Dasar Sistem Kontrol"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
