// Catatan: file ini HANYA berisi data fallback yang dipakai sesaat sebelum fetch ke
// Supabase selesai (atau kalau API gagal). Setiap array di sini dioverwrite otomatis oleh
// data asli begitu response API berhasil — lihat ContactPage.tsx & SoftwarePage.tsx.
// Data simulasi lain (jadwal kelompok, tanggal pertemuan, daftar jurusan/praktikum) yang
// dulu ada di sini SUDAH DIHAPUS karena sudah sepenuhnya digantikan oleh data asli dari
// Supabase (lihat /api/jurusan, /api/jadwal, /api/kelas-praktikum, /api/modul).

export interface Assistant {
  id: string | number;
  name: string;
  nim: string;
  wa: string;
  ig: string;
  role: 'Koordinator' | 'Asisten';
  color: string;
  initial: string;
  photo?: string;
}

export const assistants: Assistant[] = [
  // Angkatan 2023
  { id: 7, name: 'Hakimi Farhan Elfalah', nim: '202311005', wa: '', ig: '', role: 'Koordinator', color: '#0891b2', initial: 'HF', photo: '/avatars/202311005.jpg' },
  { id: 10, name: 'Komang Jaya Laksmana BP', nim: '202311007', wa: '', ig: '', role: 'Asisten', color: '#b45309', initial: 'KJ', photo: '/avatars/202311007.jpg' },
  { id: 17, name: 'Putri Sahira', nim: '202311009', wa: '', ig: '', role: 'Asisten', color: '#65a30d', initial: 'PS', photo: '/avatars/202311009.jpg' },
  { id: 4, name: 'Dedy Adhitya Rahmadani', nim: '202311032', wa: '', ig: '', role: 'Asisten', color: '#059669', initial: 'DA', photo: '/avatars/202311032.jpg' },
  { id: 16, name: 'Novita Permatasyania', nim: '202311058', wa: '', ig: '', role: 'Asisten', color: '#c026d3', initial: 'NP', photo: '/avatars/202311058.jpg' },
  { id: 8, name: 'Kaila Nafisa', nim: '202311081', wa: '', ig: '', role: 'Asisten', color: '#be185d', initial: 'KN', photo: '/avatars/202311081.jpg' },
  { id: 3, name: 'Bungaran Jeremi Jonatan Butar Butar', nim: '202311086', wa: '', ig: '', role: 'Asisten', color: '#0ea5e9', initial: 'BJ', photo: '/avatars/202311086.jpg' },
  { id: 11, name: 'Muhammad Fachrizal Faqih Hilmawan', nim: '202311161', wa: '', ig: '', role: 'Asisten', color: '#16a34a', initial: 'MF', photo: '/avatars/202311161.jpg' },
  { id: 24, name: 'Yuliana Kristin', nim: '202311198', wa: '', ig: '', role: 'Asisten', color: '#b91c1c', initial: 'YK', photo: '/avatars/202311198.jpg' },
  { id: 1, name: 'Anggi Berlian Hutasoit', nim: '202311289', wa: '', ig: '', role: 'Asisten', color: '#5C8BC8', initial: 'AB', photo: '/avatars/202311289.jpg' },
  { id: 22, name: 'Umar Wanto', nim: '202311298', wa: '', ig: '', role: 'Asisten', color: '#15803d', initial: 'UW', photo: '/avatars/202311298.jpg' },
  { id: 19, name: 'Seja Sastrianto', nim: '202311299', wa: '', ig: '', role: 'Asisten', color: '#3B639B', initial: 'SS', photo: '/avatars/202311299.jpg' },
  { id: 12, name: 'Muhammad Uzair Suluhi', nim: '202314074', wa: '', ig: '', role: 'Asisten', color: '#dc2626', initial: 'MU', photo: '/avatars/202314074.jpg' },
  { id: 13, name: 'Muhammad Yusril Shandi', nim: '202314081', wa: '', ig: '', role: 'Asisten', color: '#4f46e5', initial: 'MY', photo: '/avatars/202314081.jpg' },

  // Angkatan 2024
  { id: 25, name: 'Yosua Kevin Pratama Naibaho', nim: '202411001', wa: '', ig: '', role: 'Asisten', color: '#0f766e', initial: 'YN', photo: '/avatars/202411001.jpg' },
  { id: 20, name: 'Siti Arrossa Nur Aris Taryana Putri', nim: '202411010', wa: '', ig: '', role: 'Asisten', color: '#7e22ce', initial: 'SA', photo: '/avatars/202411010.jpg' },
  { id: 14, name: 'Muhammad Kalieh Pangestoe', nim: '202411023', wa: '', ig: '', role: 'Asisten', color: '#0d9488', initial: 'MK', photo: '/avatars/202411023.jpg' },
  { id: 21, name: 'Siti Nur Aziza Latuconsina', nim: '202411067', wa: '', ig: '', role: 'Asisten', color: '#0369a1', initial: 'SN', photo: '/avatars/202411067.jpg' },
  { id: 5, name: 'Dzul Fachmi', nim: '202411098', wa: '', ig: '', role: 'Asisten', color: '#db2777', initial: 'DF', photo: '/avatars/202411098.jpg' },
  { id: 23, name: 'Uminyya Zaskia Putri Rusna', nim: '202411105', wa: '', ig: '', role: 'Asisten', color: '#a21caf', initial: 'UZ', photo: '/avatars/202411105.jpg' },
  { id: 6, name: 'Faris Elhimma Fadli', nim: '202411109', wa: '', ig: '', role: 'Asisten', color: '#d97706', initial: 'FE', photo: '/avatars/202411109.jpg' },
  { id: 15, name: 'Muhammad Farrel Alfalah', nim: '202411124', wa: '', ig: '', role: 'Asisten', color: '#ca8a04', initial: 'MA', photo: '/avatars/202411124.jpg' },
  { id: 18, name: 'Raihan Riza Thaffany', nim: '202414128', wa: '', ig: '', role: 'Asisten', color: '#e11d48', initial: 'RR', photo: '/avatars/202414128.jpg' },
  { id: 2, name: 'Aswad', nim: '202415057', wa: '', ig: '', role: 'Asisten', color: '#7c3aed', initial: 'AS', photo: '/avatars/202415057.jpg' },
  { id: 9, name: 'Khansa Zara Anefda', nim: '202415102', wa: '', ig: '', role: 'Asisten', color: '#9333ea', initial: 'KZ', photo: '/avatars/202415102.jpg' },
];

export const software = [
  {
    name: 'MATLAB & Simulink',
    version: '2016b',
    icon: 'bar-chart',
    description: 'Perangkat lunak komputasi numerik dan simulasi sistem kontrol.',
    color: '#e04010',
    tags: ['Simulasi', 'Numerik', 'DSK'],
    downloadUrl: 'https://drive.google.com/drive/folders/1kHwZp7VGEmTVVxu0TZqm6w3kjtxiXLG1',
    guideUrl: 'https://drive.google.com/file/d/1iVlxRQiiY3Mg7eCaOKqA7jashjlTWh2y/view',
    driveId: '1iVlxRQiiY3Mg7eCaOKqA7jashjlTWh2y',
  },
  {
    name: 'CX-One',
    version: '9.76',
    icon: 'laptop',
    description: 'IDE untuk pemrograman PLC Omron seri CJ/CS/CP/NJ.',
    color: '#d97706',
    tags: ['PLC', 'Ladder', 'Omron'],
    downloadUrl: 'https://drive.google.com/drive/folders/1-mxu4Z1ZnlifOeB9bNVYnEMZhYm9BCyi',
    guideUrl: 'https://www.youtube.com/watch?v=mWjS91FmJcA',
    youtubeId: 'mWjS91FmJcA',
  },
  {
    name: 'NB Designer',
    version: '1.52',
    icon: 'smartphone',
    description: 'Software konfigurasi HMI seri NB untuk kontrol antarmuka visual.',
    color: '#7c3aed',
    tags: ['HMI', 'NB Series'],
    downloadUrl: 'https://drive.google.com/drive/folders/1-mxu4Z1ZnlifOeB9bNVYnEMZhYm9BCyi',
    guideUrl: 'https://www.youtube.com/watch?v=NUKe6iWPBA4',
    youtubeId: 'NUKe6iWPBA4',
  },
];

// Catatan: data pengumuman/berita SUDAH dipindah ke tabel `berita` di Supabase, diakses
// lewat /api/berita (dipakai HomePage & Dashboard Asisten). Array `announcements` yang dulu
// di sini sudah dihapus supaya tidak ada 2 sumber data yang membingungkan.
