-- ============================================================================
-- ICAL ITPLN — MASTER DATABASE SETUP SCRIPT (ALL-IN-ONE)
-- Jalankan skrip ini langsung di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ddswbhfyirpnnaqxjeix/sql/new
--
-- File ini sudah mencakup:
-- 1. Semua Extensions & Enums
-- 2. Semua Tabel (Termasuk Absensi, Asisten, Software, Berita, Nilai, Jadwal, Modul, Template)
-- 3. Trigger & Function Otomatis (Sinkronisasi Kehadiran & Nilai PLC)
-- 4. RLS (Row Level Security) Policies
-- 5. Data Awal Lengkap (25 Asisten, Software, Jurusan, Praktikum 2026/2027, Modul, Template)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS & ENUMS
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema extensions;

do $$ begin
  create type public.user_role as enum ('asisten', 'praktikan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.jenis_pertemuan as enum ('pengarahan', 'pertemuan', 'presentasi', 'uap');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kategori_berita as enum ('pengumuman', 'info', 'kegiatan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shift_enum as enum ('1', '2');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.hari_enum as enum ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 1. MASTER TABLES
-- ----------------------------------------------------------------------------

-- 1.1 JURUSAN
create table if not exists public.jurusan (
  id uuid primary key default extensions.uuid_generate_v4(),
  kode varchar not null unique,
  nama varchar not null,
  kelas_tersedia text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2 PERIODE AKADEMIK
create table if not exists public.periode_akademik (
  id uuid primary key default extensions.uuid_generate_v4(),
  kode_semester varchar not null unique,
  nama varchar not null,
  tanggal_mulai date,
  tanggal_selesai date,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- 1.3 PRAKTIKUM
create table if not exists public.praktikum (
  id uuid primary key default extensions.uuid_generate_v4(),
  kode_mk varchar,
  kode_singkat varchar not null,
  nama varchar not null,
  deskripsi text,
  jurusan_id uuid not null references public.jurusan(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint praktikum_kode_singkat_jurusan_id_key unique (kode_singkat, jurusan_id)
);

-- 1.4 PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar not null,
  nama_lengkap varchar not null,
  role public.user_role not null default 'praktikan',
  nim varchar unique,
  nomor_telepon varchar,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.5 KELAS PRAKTIKUM
create table if not exists public.kelas_praktikum (
  id uuid primary key default extensions.uuid_generate_v4(),
  praktikum_id uuid not null references public.praktikum(id) on delete cascade,
  periode_id uuid not null references public.periode_akademik(id) on delete cascade,
  nama_kelas varchar not null,
  hari public.hari_enum,
  jam_mulai time,
  jam_selesai time,
  ruangan varchar,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kelas_praktikum_unique_per_periode unique (praktikum_id, periode_id, nama_kelas)
);

-- 1.6 KELOMPOK
create table if not exists public.kelompok (
  id uuid primary key default extensions.uuid_generate_v4(),
  kelas_praktikum_id uuid not null references public.kelas_praktikum(id) on delete cascade,
  nama_kelompok varchar not null,
  shift public.shift_enum,
  asisten_id uuid references public.profiles(id) on delete set null,
  nama_asisten varchar,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kelompok_unique_per_kelas unique (kelas_praktikum_id, nama_kelompok)
);

-- 1.7 ANGGOTA KELOMPOK
create table if not exists public.anggota_kelompok (
  id uuid primary key default extensions.uuid_generate_v4(),
  kelompok_id uuid not null references public.kelompok(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  nama varchar not null,
  nim varchar not null,
  created_at timestamptz not null default now(),
  constraint anggota_kelompok_unique_per_kelompok unique (kelompok_id, nim)
);

-- 1.8 PERTEMUAN
create table if not exists public.pertemuan (
  id uuid primary key default extensions.uuid_generate_v4(),
  kelompok_id uuid not null references public.kelompok(id) on delete cascade,
  urutan_ke integer,
  jenis public.jenis_pertemuan not null default 'pertemuan',
  label varchar,
  tanggal date,
  topik text,
  created_at timestamptz not null default now(),
  constraint pertemuan_unique_per_kelompok unique (kelompok_id, jenis, urutan_ke)
);

-- 1.9 KOMPONEN NILAI
create table if not exists public.komponen_nilai (
  id uuid primary key default extensions.uuid_generate_v4(),
  praktikum_id uuid not null references public.praktikum(id) on delete cascade,
  kode_komponen varchar not null,
  nama_komponen varchar not null,
  bobot numeric(5,2) not null default 0,
  urutan integer not null default 0,
  is_per_pertemuan boolean not null default true,
  created_at timestamptz not null default now(),
  constraint komponen_nilai_unique_per_praktikum unique (praktikum_id, kode_komponen)
);

-- 1.10 NILAI KOMPONEN
create table if not exists public.nilai_komponen (
  id uuid primary key default extensions.uuid_generate_v4(),
  anggota_kelompok_id uuid not null references public.anggota_kelompok(id) on delete cascade,
  pertemuan_id uuid not null references public.pertemuan(id) on delete cascade,
  kode_komponen varchar not null,
  nilai numeric(5,2),
  catatan text,
  dinilai_oleh uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nilai_komponen_unique unique (anggota_kelompok_id, pertemuan_id, kode_komponen)
);

-- 1.11 BERITA
create table if not exists public.berita (
  id uuid primary key default extensions.uuid_generate_v4(),
  judul varchar not null,
  isi text not null,
  kategori public.kategori_berita not null default 'info',
  tanggal_terbit date not null default current_date,
  is_published boolean not null default true,
  ditulis_oleh uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.12 DEADLINE TUGAS
create table if not exists public.deadline_tugas (
  id uuid primary key default extensions.uuid_generate_v4(),
  praktikum_id uuid not null references public.praktikum(id) on delete cascade,
  pertemuan_urutan integer not null,
  judul varchar not null,
  keterangan text,
  deadline_wib timestamptz not null,
  allow_late boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deadline_tugas_unique unique (praktikum_id, pertemuan_urutan)
);

-- 1.13 TUGAS MAHASISWA
create table if not exists public.tugas_mahasiswa (
  id uuid primary key default extensions.uuid_generate_v4(),
  deadline_id uuid not null references public.deadline_tugas(id) on delete cascade,
  anggota_kelompok_id uuid references public.anggota_kelompok(id) on delete cascade,
  nim varchar not null,
  nama_mahasiswa varchar not null,
  file_url text not null,
  file_name varchar not null,
  file_size_bytes bigint,
  r2_key text,
  google_drive_file_id varchar,
  google_drive_web_view_link text,
  status_upload varchar not null default 'r2_only',
  uploaded_at timestamptz not null default now(),
  constraint tugas_mahasiswa_unique_per_nim unique (deadline_id, nim)
);

-- 1.14 MODUL PRAKTIKUM
create table if not exists public.modul (
  id uuid primary key default extensions.uuid_generate_v4(),
  praktikum_id uuid references public.praktikum(id) on delete set null,
  kode_singkat varchar not null,
  nama varchar not null,
  deskripsi text,
  file_path text,
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.15 TEMPLATE DOKUMEN
create table if not exists public.template_dokumen (
  id uuid primary key default extensions.uuid_generate_v4(),
  nama varchar not null,
  deskripsi text,
  kategori varchar not null,
  file_path text,
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.16 ABSENSI
create table if not exists public.absensi (
  id uuid primary key default extensions.uuid_generate_v4(),
  anggota_kelompok_id uuid not null references public.anggota_kelompok(id) on delete cascade,
  pertemuan_id uuid not null references public.pertemuan(id) on delete cascade,
  status varchar not null check (status in ('H', 'I', 'S', 'A')),
  waktu_scan timestamptz not null default now(),
  dicatat_oleh uuid references public.profiles(id) on delete set null,
  metode varchar not null default 'scan_qr' check (metode in ('scan_qr', 'manual')),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint absensi_unique_per_pertemuan unique (anggota_kelompok_id, pertemuan_id)
);

-- 1.17 ASISTEN (Kontak Tim Asisten)
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

-- 1.18 SOFTWARE PRAKTIKUM
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

-- ----------------------------------------------------------------------------
-- 2. TRIGGERS & FUNCTIONS
-- ----------------------------------------------------------------------------

-- 2.1 Trigger Recalculate Kehadiran Absensi ke Nilai Komponen
create or replace function public.fn_absensi_recalc_kehadiran()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kelompok_id uuid;
  v_uap_pertemuan_id uuid;
  v_total_reguler integer;
  v_total_hadir integer;
  v_persen numeric(5,2);
  v_target_anggota_id uuid;
begin
  v_target_anggota_id := coalesce(NEW.anggota_kelompok_id, OLD.anggota_kelompok_id);

  select ak.kelompok_id into v_kelompok_id
  from public.anggota_kelompok ak
  where ak.id = v_target_anggota_id;

  if v_kelompok_id is null then
    return coalesce(NEW, OLD);
  end if;

  select p.id into v_uap_pertemuan_id
  from public.pertemuan p
  where p.kelompok_id = v_kelompok_id
    and p.jenis = 'uap'
  limit 1;

  if v_uap_pertemuan_id is null then
    return coalesce(NEW, OLD);
  end if;

  select count(*) into v_total_reguler
  from public.pertemuan p
  where p.kelompok_id = v_kelompok_id
    and p.jenis = 'pertemuan';

  if v_total_reguler = 0 then
    return coalesce(NEW, OLD);
  end if;

  select count(*) into v_total_hadir
  from public.absensi a
  join public.pertemuan p on p.id = a.pertemuan_id
  where a.anggota_kelompok_id = v_target_anggota_id
    and p.kelompok_id = v_kelompok_id
    and p.jenis = 'pertemuan'
    and a.status = 'H';

  v_persen := round((v_total_hadir::numeric / v_total_reguler::numeric) * 100.0, 2);

  insert into public.nilai_komponen (
    anggota_kelompok_id,
    pertemuan_id,
    kode_komponen,
    nilai,
    catatan,
    dinilai_oleh
  ) values (
    v_target_anggota_id,
    v_uap_pertemuan_id,
    'KEHADIRAN',
    v_persen,
    format('Otomatis dihitung dari absensi: %s/%s hadir (%s%%)', v_total_hadir, v_total_reguler, v_persen),
    coalesce(NEW.dicatat_oleh, OLD.dicatat_oleh)
  )
  on conflict (anggota_kelompok_id, pertemuan_id, kode_komponen)
  do update set
    nilai = excluded.nilai,
    catatan = excluded.catatan,
    dinilai_oleh = coalesce(excluded.dinilai_oleh, public.nilai_komponen.dinilai_oleh),
    updated_at = now();

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_absensi_recalc_kehadiran on public.absensi;
create trigger trg_absensi_recalc_kehadiran
after insert or update or delete on public.absensi
for each row execute function public.fn_absensi_recalc_kehadiran();

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
alter table public.jurusan enable row level security;
alter table public.periode_akademik enable row level security;
alter table public.praktikum enable row level security;
alter table public.profiles enable row level security;
alter table public.kelas_praktikum enable row level security;
alter table public.kelompok enable row level security;
alter table public.anggota_kelompok enable row level security;
alter table public.pertemuan enable row level security;
alter table public.komponen_nilai enable row level security;
alter table public.nilai_komponen enable row level security;
alter table public.berita enable row level security;
alter table public.deadline_tugas enable row level security;
alter table public.tugas_mahasiswa enable row level security;
alter table public.modul enable row level security;
alter table public.template_dokumen enable row level security;
alter table public.absensi enable row level security;
alter table public.asisten enable row level security;
alter table public.software enable row level security;

-- Public Read Policies
create policy "jurusan_read" on public.jurusan for select using (true);
create policy "periode_read" on public.periode_akademik for select using (true);
create policy "praktikum_read" on public.praktikum for select using (true);
create policy "kelas_read" on public.kelas_praktikum for select using (true);
create policy "kelompok_read" on public.kelompok for select using (true);
create policy "anggota_read" on public.anggota_kelompok for select using (true);
create policy "pertemuan_read" on public.pertemuan for select using (true);
create policy "komponen_read" on public.komponen_nilai for select using (true);
create policy "nilai_read" on public.nilai_komponen for select using (true);
create policy "berita_read" on public.berita for select using (true);
create policy "deadline_read" on public.deadline_tugas for select using (true);
create policy "tugas_read" on public.tugas_mahasiswa for select using (true);
create policy "modul_read" on public.modul for select using (true);
create policy "template_read" on public.template_dokumen for select using (true);
create policy "absensi_read" on public.absensi for select using (true);
create policy "asisten_read" on public.asisten for select using (true);
create policy "software_read" on public.software for select using (true);
create policy "profiles_read" on public.profiles for select using (true);

-- Service Role Full Access Policies
create policy "jurusan_admin" on public.jurusan for all using (auth.jwt()->>'role' = 'service_role');
create policy "periode_admin" on public.periode_akademik for all using (auth.jwt()->>'role' = 'service_role');
create policy "praktikum_admin" on public.praktikum for all using (auth.jwt()->>'role' = 'service_role');
create policy "kelas_admin" on public.kelas_praktikum for all using (auth.jwt()->>'role' = 'service_role');
create policy "kelompok_admin" on public.kelompok for all using (auth.jwt()->>'role' = 'service_role');
create policy "anggota_admin" on public.anggota_kelompok for all using (auth.jwt()->>'role' = 'service_role');
create policy "pertemuan_admin" on public.pertemuan for all using (auth.jwt()->>'role' = 'service_role');
create policy "komponen_admin" on public.komponen_nilai for all using (auth.jwt()->>'role' = 'service_role');
create policy "nilai_admin" on public.nilai_komponen for all using (auth.jwt()->>'role' = 'service_role');
create policy "berita_admin" on public.berita for all using (auth.jwt()->>'role' = 'service_role');
create policy "deadline_admin" on public.deadline_tugas for all using (auth.jwt()->>'role' = 'service_role');
create policy "tugas_admin" on public.tugas_mahasiswa for all using (auth.jwt()->>'role' = 'service_role');
create policy "modul_admin" on public.modul for all using (auth.jwt()->>'role' = 'service_role');
create policy "template_admin" on public.template_dokumen for all using (auth.jwt()->>'role' = 'service_role');
create policy "absensi_admin" on public.absensi for all using (auth.jwt()->>'role' = 'service_role');
create policy "asisten_admin" on public.asisten for all using (auth.jwt()->>'role' = 'service_role');
create policy "software_admin" on public.software for all using (auth.jwt()->>'role' = 'service_role');
create policy "profiles_admin" on public.profiles for all using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 4. SEED DATA LENGKAP
-- ----------------------------------------------------------------------------

-- 4.1 JURUSAN
insert into public.jurusan (id, kode, nama, kelas_tersedia) values
  ('a1000000-0000-4000-8000-000000000001', 'TTL',     'Teknik Tenaga Listrik',    array['A','B','C','D','E']),
  ('a1000000-0000-4000-8000-000000000002', 'S1TE',    'S1 Teknik Elektro',        array['A','B','C','D']),
  ('a1000000-0000-4000-8000-000000000003', 'TSE',     'Teknik Sistem Energi',     array['A','B','C']),
  ('a1000000-0000-4000-8000-000000000004', 'D3TE',    'D3 Teknik Elektro',        array['A','B','C','D'])
on conflict (kode) do update
  set nama = excluded.nama,
      kelas_tersedia = excluded.kelas_tersedia;

-- 4.2 PRAKTIKUM
insert into public.praktikum (id, kode_mk, kode_singkat, nama, jurusan_id) values
  ('a2000000-0000-4000-8000-000000000001', 'C14020402', 'DSK', 'Praktikum Dasar Sistem Kontrol',
    (select id from public.jurusan where kode = 'TTL')),
  ('a2000000-0000-4000-8000-000000000002', 'C11010502', 'PLC', 'Praktikum Programmable Logic Controller',
    (select id from public.jurusan where kode = 'S1TE')),
  ('a2000000-0000-4000-8000-000000000003', 'C14020402', 'DSK', 'Praktikum Dasar Sistem Kontrol',
    (select id from public.jurusan where kode = 'TSE')),
  ('a2000000-0000-4000-8000-000000000004', 'C11010502', 'PLC', 'Praktikum Programmable Logic Controller',
    (select id from public.jurusan where kode = 'D3TE'))
on conflict (kode_singkat, jurusan_id) do update
  set nama = excluded.nama,
      kode_mk = excluded.kode_mk;

-- 4.3 PERIODE AKADEMIK
insert into public.periode_akademik (id, kode_semester, nama, is_active) values
  ('a3000000-0000-4000-8000-000000000001', '20261', 'Ganjil 2026/2027', true)
on conflict (id) do update
  set is_active = true,
      nama = excluded.nama;

-- 4.4 DAFTAR 25 ASISTEN ICAL
insert into public.asisten (nama, nim, wa, ig, role, color, initial, photo, urutan) values
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

-- 4.5 SOFTWARE PRAKTIKUM
insert into public.software (nama, versi, deskripsi, icon, warna, tags, download_url, guide_url, youtube_id, drive_id, urutan) values
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

-- 4.6 BERITA AWAL
insert into public.berita (judul, isi, kategori, tanggal_terbit, is_published) values
  ('Pendaftaran Praktikum Semester Ganjil 2026/2027 Dibuka', 'Pendaftaran praktikum Dasar Sistem Kontrol dan PLC resmi dibuka untuk seluruh mahasiswa angkatan 2023 & 2024.', 'pengumuman', current_date, true),
  ('Jadwal Pengarahan Praktikum ICAL', 'Pengarahan praktikum akan dilaksanakan secara luring di Laboratorium ICAL lantai 3. Praktikan wajib membawa kartu praktikum dan mengenakan jas lab.', 'info', current_date, true)
on conflict do nothing;

-- 4.7 MODUL PRAKTIKUM
insert into public.modul (kode_singkat, nama, deskripsi, urutan) values
  ('DSK', 'Modul 1: Pemodelan Matematis & Fungsi Alih', 'Mempelajari persamaan diferensial dan fungsi alih Laplace pada sistem fisik.', 1),
  ('DSK', 'Modul 2: Karakteristik Respons Transien', 'Analisis kestabilan dan performa respons orde satu dan orde dua.', 2),
  ('PLC', 'Modul 1: Dasar Pemrograman Ladder Diagram', 'Pengenalan instruksi dasar NO, NC, Output Coil, dan Relay pada CX-Programmer.', 1),
  ('PLC', 'Modul 2: Timer & Counter Automation', 'Penggunaan instruksi TIM dan CNT untuk otomasi sekuensial mesin konveyor.', 2)
on conflict do nothing;

-- 4.8 TEMPLATE DOKUMEN
insert into public.template_dokumen (nama, deskripsi, kategori, urutan) values
  ('Template Presentasi UAP', 'Format slide resmi presentasi Ujian Akhir Praktikum ICAL.', 'Power Point Presentasi', 1),
  ('Template Laporan Akhir Praktikum', 'Format dokumen laporan praktikum sesuai standar lab.', 'Laporan', 2),
  ('Cover Tugas Rumah', 'Format cover pengumpulan tugas rumah per pertemuan.', 'Cover Tugas Rumah', 3),
  ('Lembar Kerja Praktikum', 'Lembar pengambilan data saat praktikum berlangsung.', 'Lembar Kerja', 4)
on conflict do nothing;

-- 4.9 KELAS PRAKTIKUM & JADWAL
-- (TTL - DSK Kelas A & B, S1TE - PLC Kelas A & B, TSE - DSK Kelas A, D3TE - PLC Kelas A)
insert into public.kelas_praktikum (id, praktikum_id, periode_id, nama_kelas, hari, jam_mulai, jam_selesai, ruangan) values
  -- TTL - DSK Kelas A & B
  ('b1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'A', 'Senin', '08:00', '10:00', 'Lab ICAL 1'),
  ('b1000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'B', 'Senin', '10:00', '12:00', 'Lab ICAL 1'),
  -- S1TE - PLC Kelas A & B
  ('b1000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001', 'A', 'Selasa', '08:00', '10:00', 'Lab ICAL 2'),
  ('b1000000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001', 'B', 'Selasa', '10:00', '12:00', 'Lab ICAL 2'),
  -- TSE - DSK Kelas A
  ('b1000000-0000-4000-8000-000000000005', 'a2000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000001', 'A', 'Rabu', '08:00', '10:00', 'Lab ICAL 1'),
  -- D3TE - PLC Kelas A
  ('b1000000-0000-4000-8000-000000000006', 'a2000000-0000-4000-8000-000000000004', 'a3000000-0000-4000-8000-000000000001', 'A', 'Kamis', '08:00', '10:00', 'Lab ICAL 2')
on conflict (praktikum_id, periode_id, nama_kelas) do update
  set hari = excluded.hari,
      jam_mulai = excluded.jam_mulai,
      jam_selesai = excluded.jam_selesai,
      ruangan = excluded.ruangan;

-- 4.10 KELOMPOK PRAKTIKUM
insert into public.kelompok (id, kelas_praktikum_id, nama_kelompok, shift, nama_asisten, hari, jam_mulai, jam_selesai, ruangan) values
  -- TTL DSK Kelas A (Kelompok A1 - A4)
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'A1', '1', 'Hakimi Farhan Elfalah', 'Senin', '08:00', '10:00', 'Lab ICAL 1'),
  ('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'A2', '1', 'Anggi Berlian Hutasoit', 'Senin', '08:00', '10:00', 'Lab ICAL 1'),
  ('c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'A3', '2', 'Aswad', 'Senin', '10:00', '12:00', 'Lab ICAL 1'),
  ('c1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'A4', '2', 'Bungaran Jeremi', 'Senin', '10:00', '12:00', 'Lab ICAL 1'),

  -- S1TE PLC Kelas A (Kelompok A1 - A4)
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000003', 'A1', '1', 'Dedy Adhitya Rahmadani', 'Selasa', '08:00', '10:00', 'Lab ICAL 2'),
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000003', 'A2', '1', 'Dzul Fachmi', 'Selasa', '08:00', '10:00', 'Lab ICAL 2'),
  ('c1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000003', 'A3', '2', 'Faris Elhimma Fadli', 'Selasa', '10:00', '12:00', 'Lab ICAL 2'),
  ('c1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000003', 'A4', '2', 'Kaila Nafisa', 'Selasa', '10:00', '12:00', 'Lab ICAL 2')
on conflict (kelas_praktikum_id, nama_kelompok) do update
  set shift = excluded.shift,
      nama_asisten = excluded.nama_asisten,
      hari = excluded.hari,
      jam_mulai = excluded.jam_mulai,
      jam_selesai = excluded.jam_selesai,
      ruangan = excluded.ruangan;

-- 4.11 ANGGOTA KELOMPOK (Praktikan)
insert into public.anggota_kelompok (kelompok_id, nama, nim) values
  -- Anggota Kelompok A1 DSK TTL
  ('c1000000-0000-4000-8000-000000000001', 'Ahmad Fauzi', '2022110001'),
  ('c1000000-0000-4000-8000-000000000001', 'Bintang Ramadhan', '2022110002'),
  ('c1000000-0000-4000-8000-000000000001', 'Cahya Nugraha', '2022110003'),
  ('c1000000-0000-4000-8000-000000000001', 'Deni Saputra', '2022110004'),

  -- Anggota Kelompok A2 DSK TTL
  ('c1000000-0000-4000-8000-000000000002', 'Evan Maulana', '2022110005'),
  ('c1000000-0000-4000-8000-000000000002', 'Fani Susanti', '2022110006'),
  ('c1000000-0000-4000-8000-000000000002', 'Gilang Prayoga', '2022110007'),
  ('c1000000-0000-4000-8000-000000000002', 'Hani Kartika', '2022110008'),

  -- Anggota Kelompok A1 PLC S1TE
  ('c1000000-0000-4000-8000-000000000005', 'Ahmad Fauzi', '2022110001'),
  ('c1000000-0000-4000-8000-000000000005', 'Ivan Setiawan', '2022110009'),
  ('c1000000-0000-4000-8000-000000000005', 'Joko Purnomo', '2022110010'),

  -- Anggota Kelompok A2 PLC S1TE
  ('c1000000-0000-4000-8000-000000000006', 'Bintang Ramadhan', '2022110002'),
  ('c1000000-0000-4000-8000-000000000006', 'Kirana Salsabila', '2022110011'),
  ('c1000000-0000-4000-8000-000000000006', 'Luthfi Hakim', '2022110012')
on conflict (kelompok_id, nim) do nothing;

-- 4.12 JADWAL PERTEMUAN (Pengarahan, P1, P2, P3, P4, UAP)
insert into public.pertemuan (kelompok_id, urutan_ke, jenis, label, tanggal) values
  -- Jadwal Pertemuan Kelompok A1 TTL DSK
  ('c1000000-0000-4000-8000-000000000001', 0, 'pengarahan', 'Pengarahan', '2026-09-07'),
  ('c1000000-0000-4000-8000-000000000001', 1, 'pertemuan',  'Pertemuan 1', '2026-09-14'),
  ('c1000000-0000-4000-8000-000000000001', 2, 'pertemuan',  'Pertemuan 2', '2026-09-21'),
  ('c1000000-0000-4000-8000-000000000001', 3, 'pertemuan',  'Pertemuan 3', '2026-09-28'),
  ('c1000000-0000-4000-8000-000000000001', 4, 'pertemuan',  'Pertemuan 4', '2026-10-05'),
  ('c1000000-0000-4000-8000-000000000001', 5, 'uap',        'Ujian Akhir Praktikum (UAP)', '2026-10-12'),

  -- Jadwal Pertemuan Kelompok A2 TTL DSK
  ('c1000000-0000-4000-8000-000000000002', 0, 'pengarahan', 'Pengarahan', '2026-09-07'),
  ('c1000000-0000-4000-8000-000000000002', 1, 'pertemuan',  'Pertemuan 1', '2026-09-14'),
  ('c1000000-0000-4000-8000-000000000002', 2, 'pertemuan',  'Pertemuan 2', '2026-09-21'),
  ('c1000000-0000-4000-8000-000000000002', 3, 'pertemuan',  'Pertemuan 3', '2026-09-28'),
  ('c1000000-0000-4000-8000-000000000002', 4, 'pertemuan',  'Pertemuan 4', '2026-10-05'),
  ('c1000000-0000-4000-8000-000000000002', 5, 'uap',        'Ujian Akhir Praktikum (UAP)', '2026-10-12'),

  -- Jadwal Pertemuan Kelompok A1 S1TE PLC
  ('c1000000-0000-4000-8000-000000000005', 0, 'pengarahan', 'Pengarahan', '2026-09-08'),
  ('c1000000-0000-4000-8000-000000000005', 1, 'pertemuan',  'Pertemuan 1', '2026-09-15'),
  ('c1000000-0000-4000-8000-000000000005', 2, 'pertemuan',  'Pertemuan 2', '2026-09-22'),
  ('c1000000-0000-4000-8000-000000000005', 3, 'pertemuan',  'Pertemuan 3', '2026-09-29'),
  ('c1000000-0000-4000-8000-000000000005', 4, 'pertemuan',  'Pertemuan 4', '2026-10-06'),
  ('c1000000-0000-4000-8000-000000000005', 5, 'uap',        'Ujian Akhir Praktikum (UAP)', '2026-10-13'),

  -- Jadwal Pertemuan Kelompok A2 S1TE PLC
  ('c1000000-0000-4000-8000-000000000006', 0, 'pengarahan', 'Pengarahan', '2026-09-08'),
  ('c1000000-0000-4000-8000-000000000006', 1, 'pertemuan',  'Pertemuan 1', '2026-09-15'),
  ('c1000000-0000-4000-8000-000000000006', 2, 'pertemuan',  'Pertemuan 2', '2026-09-22'),
  ('c1000000-0000-4000-8000-000000000006', 3, 'pertemuan',  'Pertemuan 3', '2026-09-29'),
  ('c1000000-0000-4000-8000-000000000006', 4, 'pertemuan',  'Pertemuan 4', '2026-10-06'),
  ('c1000000-0000-4000-8000-000000000006', 5, 'uap',        'Ujian Akhir Praktikum (UAP)', '2026-10-13')
on conflict (kelompok_id, jenis, urutan_ke) do update
  set label = excluded.label,
      tanggal = excluded.tanggal;
