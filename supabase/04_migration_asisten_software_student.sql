-- ============================================================================
-- MIGRASI 04: TABEL ASISTEN, SOFTWARE, & JADWAL PRAKTIKUM
-- Jalankan file ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ddswbhfyirpnnaqxjeix/sql/new
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL asisten
-- ----------------------------------------------------------------------------
create table if not exists public.asisten (
  id uuid primary key default extensions.uuid_generate_v4(),
  nama varchar not null,
  nim varchar not null unique,
  wa varchar not null default '',
  ig varchar not null default '',
  role varchar not null default 'Asisten' check (role in ('Koordinator', 'Asisten')),
  color varchar not null default '#015c61',
  initial varchar not null default '',
  photo varchar not null default '',
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.asisten is 'Daftar asisten laboratorium ICAL beserta info kontak & role';

-- RLS asisten
alter table public.asisten enable row level security;

drop policy if exists "asisten_select_public" on public.asisten;
create policy "asisten_select_public" on public.asisten
  for select using (true);

drop policy if exists "asisten_all_service_role" on public.asisten;
create policy "asisten_all_service_role" on public.asisten
  for all using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 2. TABEL software
-- ----------------------------------------------------------------------------
create table if not exists public.software (
  id uuid primary key default extensions.uuid_generate_v4(),
  nama varchar not null,
  versi varchar not null default '',
  deskripsi text not null default '',
  icon varchar not null default 'laptop',
  warna varchar not null default '#015c61',
  tags text[] not null default '{}',
  download_url text not null default '',
  guide_url text not null default '',
  youtube_id varchar not null default '',
  drive_id varchar not null default '',
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.software is 'Daftar perangkat lunak / software praktikum ICAL';

-- RLS software
alter table public.software enable row level security;

drop policy if exists "software_select_public" on public.software;
create policy "software_select_public" on public.software
  for select using (true);

drop policy if exists "software_all_service_role" on public.software;
create policy "software_all_service_role" on public.software
  for all using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 3. SEED DATA ASISTEN (25 Orang Asisten ICAL)
-- ----------------------------------------------------------------------------
insert into public.asisten (nama, nim, wa, ig, role, color, initial, photo, urutan)
values
  ('Hakimi Farhan Elfalah', '202311005', '', '', 'Koordinator', '#0891b2', 'HF', '/avatars/202311005.jpg', 1),
  ('Anggi Berlian Hutasoit', '202311289', '', '', 'Asisten', '#2563eb', 'AB', '/avatars/202311289.jpg', 2),
  ('Aswad', '202415057', '', '', 'Asisten', '#7c3aed', 'AS', '/avatars/202415057.jpg', 3),
  ('Bungaran Jeremi Jonatan Butar Butar', '202311086', '', '', 'Asisten', '#0ea5e9', 'BJ', '/avatars/202311086.jpg', 4),
  ('Dedy Adhitya Rahmadani', '202311032', '', '', 'Asisten', '#059669', 'DA', '/avatars/202311032.jpg', 5),
  ('Dzul Fachmi', '202411098', '', '', 'Asisten', '#db2777', 'DF', '/avatars/202411098.jpg', 6),
  ('Faris Elhimma Fadli', '202411109', '', '', 'Asisten', '#d97706', 'FE', '/avatars/202411109.jpg', 7),
  ('Kaila Nafisa', '202311081', '', '', 'Asisten', '#be185d', 'KN', '/avatars/202311081.jpg', 8),
  ('Khansa Zara Anefda', '202415102', '', '', 'Asisten', '#9333ea', 'KZ', '/avatars/202415102.jpg', 9),
  ('Komang Jaya Laksmana BP', '202311007', '', '', 'Asisten', '#b45309', 'KJ', '/avatars/202311007.jpg', 10),
  ('Muhammad Fachrizal Faqih Hilmawan', '202311161', '', '', 'Asisten', '#16a34a', 'MF', '/avatars/202311161.jpg', 11),
  ('Muhammad Uzair Suluhi', '202314074', '', '', 'Asisten', '#dc2626', 'MU', '/avatars/202314074.jpg', 12),
  ('Muhammad Yusril Shandi', '202314081', '', '', 'Asisten', '#4f46e5', 'MY', '/avatars/202314081.jpg', 13),
  ('Muhammad Kalieh Pangestoe', '202411023', '', '', 'Asisten', '#0d9488', 'MK', '/avatars/202411023.jpg', 14),
  ('Muhammad Farrel Alfalah', '202411124', '', '', 'Asisten', '#ca8a04', 'MA', '/avatars/202411124.jpg', 15),
  ('Novita Permatasyania', '202311058', '', '', 'Asisten', '#c026d3', 'NP', '/avatars/202311058.jpg', 16),
  ('Putri Sahira', '202311009', '', '', 'Asisten', '#65a30d', 'PS', '/avatars/202311009.jpg', 17),
  ('Raihan Riza Thaffany', '202414128', '', '', 'Asisten', '#e11d48', 'RR', '/avatars/202414128.jpg', 18),
  ('Seja Sastrianto', '202311299', '', '', 'Asisten', '#1d4ed8', 'SS', '/avatars/202311299.jpg', 19),
  ('Siti Arrossa Nur Aris Taryana Putri', '202411010', '', '', 'Asisten', '#7e22ce', 'SA', '/avatars/202411010.jpg', 20),
  ('Siti Nur Aziza Latuconsina', '202411067', '', '', 'Asisten', '#0369a1', 'SN', '/avatars/202411067.jpg', 21),
  ('Umar Wanto', '202311298', '', '', 'Asisten', '#15803d', 'UW', '/avatars/202311298.jpg', 22),
  ('Uminyya Zaskia Putri Rusna', '202411105', '', '', 'Asisten', '#a21caf', 'UZ', '/avatars/202411105.jpg', 23),
  ('Yuliana Kristin', '202311198', '', '', 'Asisten', '#b91c1c', 'YK', '/avatars/202311198.jpg', 24),
  ('Yosua Kevin Pratama Naibaho', '202411001', '', '', 'Asisten', '#0f766e', 'YN', '/avatars/202411001.jpg', 25)
on conflict (nim) do update set
  nama = excluded.nama,
  role = excluded.role,
  color = excluded.color,
  initial = excluded.initial,
  photo = excluded.photo,
  urutan = excluded.urutan;

-- ----------------------------------------------------------------------------
-- 4. SEED DATA SOFTWARE
-- ----------------------------------------------------------------------------
insert into public.software (nama, versi, deskripsi, icon, warna, tags, download_url, guide_url, youtube_id, drive_id, urutan)
values
  (
    'MATLAB & Simulink',
    '2016b',
    'Perangkat lunak komputasi numerik dan simulasi sistem kontrol.',
    'bar-chart',
    '#e04010',
    array['Simulasi', 'Numerik', 'DSK'],
    'https://drive.google.com/drive/folders/1kHwZp7VGEmTVVxu0TZqm6w3kjtxiXLG1',
    'https://drive.google.com/file/d/1iVlxRQiiY3Mg7eCaOKqA7jashjlTWh2y/view',
    '',
    '1iVlxRQiiY3Mg7eCaOKqA7jashjlTWh2y',
    1
  ),
  (
    'CX-One',
    '9.76',
    'IDE untuk pemrograman PLC Omron seri CJ/CS/CP/NJ.',
    'laptop',
    '#d97706',
    array['PLC', 'Ladder', 'Omron'],
    'https://drive.google.com/drive/folders/1-mxu4Z1ZnlifOeB9bNVYnEMZhYm9BCyi',
    'https://www.youtube.com/watch?v=mWjS91FmJcA',
    'mWjS91FmJcA',
    '',
    2
  ),
  (
    'NB Designer',
    '1.52',
    'Software konfigurasi HMI seri NB untuk kontrol antarmuka visual.',
    'smartphone',
    '#7c3aed',
    array['HMI', 'NB Series'],
    'https://drive.google.com/drive/folders/1-mxu4Z1ZnlifOeB9bNVYnEMZhYm9BCyi',
    'https://www.youtube.com/watch?v=NUKe6iWPBA4',
    'NUKe6iWPBA4',
    '',
    3
  )
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 5. KELAS, KELOMPOK, ANGGOTA & JADWAL PERTEMUAN
-- ----------------------------------------------------------------------------
insert into public.kelas_praktikum (id, praktikum_id, periode_id, nama_kelas, hari, jam_mulai, jam_selesai, ruangan) values
  ('b1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'A', 'Senin', '08:00', '10:00', 'Lab ICAL 1'),
  ('b1000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'B', 'Senin', '10:00', '12:00', 'Lab ICAL 1'),
  ('b1000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001', 'A', 'Selasa', '08:00', '10:00', 'Lab ICAL 2'),
  ('b1000000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001', 'B', 'Selasa', '10:00', '12:00', 'Lab ICAL 2')
on conflict (praktikum_id, periode_id, nama_kelas) do update
  set hari = excluded.hari,
      jam_mulai = excluded.jam_mulai,
      jam_selesai = excluded.jam_selesai,
      ruangan = excluded.ruangan;

insert into public.kelompok (id, kelas_praktikum_id, nama_kelompok, shift, nama_asisten, hari, jam_mulai, jam_selesai, ruangan) values
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'A1', '1', 'Hakimi Farhan Elfalah', 'Senin', '08:00', '10:00', 'Lab ICAL 1'),
  ('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'A2', '1', 'Anggi Berlian Hutasoit', 'Senin', '08:00', '10:00', 'Lab ICAL 1'),
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000003', 'A1', '1', 'Dedy Adhitya Rahmadani', 'Selasa', '08:00', '10:00', 'Lab ICAL 2'),
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000003', 'A2', '1', 'Dzul Fachmi', 'Selasa', '08:00', '10:00', 'Lab ICAL 2')
on conflict (kelas_praktikum_id, nama_kelompok) do update
  set shift = excluded.shift,
      nama_asisten = excluded.nama_asisten,
      hari = excluded.hari,
      jam_mulai = excluded.jam_mulai,
      jam_selesai = excluded.jam_selesai,
      ruangan = excluded.ruangan;

insert into public.anggota_kelompok (kelompok_id, nama, nim) values
  ('c1000000-0000-4000-8000-000000000001', 'Ahmad Fauzi', '2022110001'),
  ('c1000000-0000-4000-8000-000000000001', 'Bintang Ramadhan', '2022110002'),
  ('c1000000-0000-4000-8000-000000000002', 'Evan Maulana', '2022110005'),
  ('c1000000-0000-4000-8000-000000000002', 'Fani Susanti', '2022110006'),
  ('c1000000-0000-4000-8000-000000000005', 'Ahmad Fauzi', '2022110001'),
  ('c1000000-0000-4000-8000-000000000006', 'Bintang Ramadhan', '2022110002')
on conflict (kelompok_id, nim) do nothing;

insert into public.pertemuan (kelompok_id, urutan_ke, jenis, label, tanggal) values
  ('c1000000-0000-4000-8000-000000000001', 0, 'pengarahan', 'Pengarahan', '2026-09-07'),
  ('c1000000-0000-4000-8000-000000000001', 1, 'pertemuan',  'Pertemuan 1', '2026-09-14'),
  ('c1000000-0000-4000-8000-000000000001', 2, 'pertemuan',  'Pertemuan 2', '2026-09-21'),
  ('c1000000-0000-4000-8000-000000000001', 3, 'pertemuan',  'Pertemuan 3', '2026-09-28'),
  ('c1000000-0000-4000-8000-000000000001', 4, 'pertemuan',  'Pertemuan 4', '2026-10-05'),
  ('c1000000-0000-4000-8000-000000000001', 5, 'uap',        'Ujian Akhir Praktikum (UAP)', '2026-10-12'),

  ('c1000000-0000-4000-8000-000000000002', 0, 'pengarahan', 'Pengarahan', '2026-09-07'),
  ('c1000000-0000-4000-8000-000000000002', 1, 'pertemuan',  'Pertemuan 1', '2026-09-14'),
  ('c1000000-0000-4000-8000-000000000002', 2, 'pertemuan',  'Pertemuan 2', '2026-09-21'),
  ('c1000000-0000-4000-8000-000000000002', 3, 'pertemuan',  'Pertemuan 3', '2026-09-28'),
  ('c1000000-0000-4000-8000-000000000002', 4, 'pertemuan',  'Pertemuan 4', '2026-10-05'),
  ('c1000000-0000-4000-8000-000000000002', 5, 'uap',        'Ujian Akhir Praktikum (UAP)', '2026-10-12'),

  ('c1000000-0000-4000-8000-000000000005', 0, 'pengarahan', 'Pengarahan', '2026-09-08'),
  ('c1000000-0000-4000-8000-000000000005', 1, 'pertemuan',  'Pertemuan 1', '2026-09-15'),
  ('c1000000-0000-4000-8000-000000000005', 2, 'pertemuan',  'Pertemuan 2', '2026-09-22'),
  ('c1000000-0000-4000-8000-000000000005', 3, 'pertemuan',  'Pertemuan 3', '2026-09-29'),
  ('c1000000-0000-4000-8000-000000000005', 4, 'pertemuan',  'Pertemuan 4', '2026-10-06'),
  ('c1000000-0000-4000-8000-000000000005', 5, 'uap',        'Ujian Akhir Praktikum (UAP)', '2026-10-13'),

  ('c1000000-0000-4000-8000-000000000006', 0, 'pengarahan', 'Pengarahan', '2026-09-08'),
  ('c1000000-0000-4000-8000-000000000006', 1, 'pertemuan',  'Pertemuan 1', '2026-09-15'),
  ('c1000000-0000-4000-8000-000000000006', 2, 'pertemuan',  'Pertemuan 2', '2026-09-22'),
  ('c1000000-0000-4000-8000-000000000006', 3, 'pertemuan',  'Pertemuan 3', '2026-09-29'),
  ('c1000000-0000-4000-8000-000000000006', 4, 'pertemuan',  'Pertemuan 4', '2026-10-06'),
  ('c1000000-0000-4000-8000-000000000006', 5, 'uap',        'Ujian Akhir Praktikum (UAP)', '2026-10-13')
on conflict (kelompok_id, jenis, urutan_ke) do update
  set label = excluded.label,
      tanggal = excluded.tanggal;
