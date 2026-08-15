-- ============================================================================
-- ICAL ITPLN — FULL DATABASE SCHEMA EXPORT
-- Jalankan file ini di: Supabase Dashboard (project baru Anda) > SQL Editor > New query
-- Urutan: 01 (schema+data) -> 02 (functions+triggers) -> 03 (RLS policies)
-- Semua sudah digabung dalam 1 file ini, jalankan dari atas ke bawah sekali jalan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema extensions;

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
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
-- 2. TABLES (urutan sesuai dependency foreign key)
-- ----------------------------------------------------------------------------

-- 2.1 jurusan
create table public.jurusan (
  id uuid primary key default extensions.uuid_generate_v4(),
  kode varchar not null unique,
  nama varchar not null,
  kelas_tersedia text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.jurusan is 'Master data jurusan, contoh: S1TE, TSE, D3TE';
comment on column public.jurusan.kelas_tersedia is 'Daftar huruf kelas akademik yang tersedia untuk jurusan ini, mis. {A,B,C,D}';

-- 2.2 periode_akademik
create table public.periode_akademik (
  id uuid primary key default extensions.uuid_generate_v4(),
  kode_semester varchar not null unique,
  nama varchar not null,
  tanggal_mulai date,
  tanggal_selesai date,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.periode_akademik is 'Periode/semester akademik, contoh kode 20241, 20242, 20252';

-- 2.3 praktikum
create table public.praktikum (
  id uuid primary key default extensions.uuid_generate_v4(),
  kode_mk varchar not null,
  kode_singkat varchar not null,
  nama varchar not null,
  jurusan_id uuid not null references public.jurusan(id),
  deskripsi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kode_singkat, jurusan_id)
);
comment on table public.praktikum is 'Master mata kuliah praktikum per jurusan, contoh: DSK, PLC, SKI';

-- 2.4 profiles (1:1 dengan auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id),
  role public.user_role not null,
  nim varchar unique,
  nip_nim_asisten varchar unique,
  nama_lengkap varchar not null,
  email varchar not null unique,
  no_telepon varchar,
  jurusan_id uuid references public.jurusan(id),
  angkatan varchar,
  avatar_url text,
  is_active boolean not null default true,
  profil_lengkap boolean not null default false,
  no_whatsapp varchar,
  foto_url text,
  spesialisasi varchar,
  periode_daftar uuid references public.periode_akademik(id),
  instagram varchar,
  is_koordinator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Profil pengguna (asisten & praktikan), 1:1 dengan auth.users. NIM tidak diwajibkan NOT NULL agar trigger on_auth_user_created tidak gagal saat sign-up awal.';
comment on column public.profiles.no_whatsapp is 'Nomor WhatsApp asisten, format internasional cth 6281234567890 (tanpa + atau spasi), dipakai untuk tautan wa.me';
comment on column public.profiles.foto_url is 'Path foto profil di Supabase Storage (bucket foto-profil), khusus ditampilkan untuk asisten di halaman Kontak';
comment on column public.profiles.instagram is 'Username Instagram asisten (tanpa @), dipakai untuk tombol terhubung Instagram di halaman Kontak.';
comment on column public.profiles.is_koordinator is 'Menandai asisten yang menjadi koordinator laboratorium.';

-- 2.5 kelas_praktikum
create table public.kelas_praktikum (
  id uuid primary key default extensions.uuid_generate_v4(),
  praktikum_id uuid not null references public.praktikum(id),
  periode_id uuid not null references public.periode_akademik(id),
  nama_kelas varchar not null,
  dosen_pengampu varchar,
  id_dosen varchar,
  jumlah_peserta integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (praktikum_id, periode_id, nama_kelas)
);
comment on table public.kelas_praktikum is 'Kelas per praktikum per periode, contoh: PLC kelas A semester 20242';

-- 2.6 kelompok
create table public.kelompok (
  id uuid primary key default extensions.uuid_generate_v4(),
  kelas_praktikum_id uuid not null references public.kelas_praktikum(id),
  nama_kelompok varchar not null,
  nomor_kelompok integer not null,
  asisten_id uuid references public.profiles(id),
  shift public.shift_enum,
  hari public.hari_enum,
  jam_mulai time,
  jam_selesai time,
  ruangan varchar,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kelas_praktikum_id, nama_kelompok)
);
comment on table public.kelompok is 'Kelompok dalam suatu kelas praktikum, memegang 1 asisten & jadwal/shift tertentu';

-- 2.7 anggota_kelompok
create table public.anggota_kelompok (
  id uuid primary key default extensions.uuid_generate_v4(),
  kelompok_id uuid not null references public.kelompok(id),
  praktikan_id uuid references public.profiles(id),
  nomor_urut integer,
  nama_praktikan varchar not null,
  nim varchar not null,
  created_at timestamptz not null default now(),
  unique (kelompok_id, praktikan_id),
  unique (kelompok_id, nim)
);
comment on table public.anggota_kelompok is 'Roster praktikan per kelompok. nama_praktikan & nim WAJIB diisi. praktikan_id OPSIONAL -- otomatis tertaut begitu praktikan dengan NIM yang sama mendaftar akun.';

-- 2.8 modul
create table public.modul (
  id uuid primary key default extensions.uuid_generate_v4(),
  praktikum_id uuid not null references public.praktikum(id),
  nomor_modul integer not null,
  judul varchar not null,
  deskripsi text,
  file_path text,
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (praktikum_id, nomor_modul)
);
comment on table public.modul is 'Master modul praktikum beserta referensi file PDF di Supabase Storage';

-- 2.9 pertemuan
create table public.pertemuan (
  id uuid primary key default extensions.uuid_generate_v4(),
  kelompok_id uuid not null references public.kelompok(id),
  jenis public.jenis_pertemuan not null,
  urutan_ke integer,
  tanggal date not null,
  keterangan varchar,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kelompok_id, jenis, urutan_ke)
);
comment on table public.pertemuan is 'Jadwal pertemuan (pengarahan/pertemuan ke-n/presentasi/UAP) per kelompok';

-- 2.10 pertemuan_modul
create table public.pertemuan_modul (
  id uuid primary key default extensions.uuid_generate_v4(),
  pertemuan_id uuid not null references public.pertemuan(id),
  modul_id uuid not null references public.modul(id),
  unique (pertemuan_id, modul_id)
);
comment on table public.pertemuan_modul is 'Relasi N:N antara pertemuan dan modul yang dibahas di pertemuan tersebut';

-- 2.11 berita
create table public.berita (
  id uuid primary key default extensions.uuid_generate_v4(),
  judul varchar not null,
  isi text not null,
  kategori public.kategori_berita not null default 'info',
  ditulis_oleh uuid references public.profiles(id),
  tanggal_terbit date not null default current_date,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.berita is 'Berita/pengumuman lab, dikelola oleh asisten, dapat dibaca publik';

-- 2.12 nilai_komponen
create table public.nilai_komponen (
  id uuid primary key default extensions.uuid_generate_v4(),
  anggota_kelompok_id uuid not null references public.anggota_kelompok(id),
  pertemuan_id uuid not null references public.pertemuan(id),
  kode_komponen varchar not null,
  nilai numeric check (nilai is null or (nilai >= 0 and nilai <= 100)),
  updated_at timestamptz not null default now(),
  unique (anggota_kelompok_id, pertemuan_id, kode_komponen)
);
comment on table public.nilai_komponen is 'Nilai per komponen (kode_komponen: TR=Tugas Rumah, TA=Tugas Awal, P=Keaktifan/Partisipasi, dst) per praktikan per pertemuan.';

-- 2.13 modul_utama
create table public.modul_utama (
  id uuid primary key default extensions.uuid_generate_v4(),
  kode_singkat varchar not null unique,
  nama varchar not null,
  deskripsi text,
  file_path text,
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.14 software_pendukung
create table public.software_pendukung (
  id uuid primary key default extensions.uuid_generate_v4(),
  nama varchar not null,
  deskripsi text,
  link_google_drive text,
  link_youtube text,
  jenis varchar not null default 'software',
  urutan integer not null default 0
);

-- 2.15 template_dokumen
create table public.template_dokumen (
  id uuid primary key default extensions.uuid_generate_v4(),
  nama varchar not null,
  deskripsi text,
  file_path text,
  urutan integer not null default 0
);

-- 2.16 jenis_tugas
create table public.jenis_tugas (
  id uuid primary key default extensions.uuid_generate_v4(),
  praktikum_id uuid not null references public.praktikum(id) on delete cascade,
  kode varchar not null,
  nama varchar not null,
  urutan integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (praktikum_id, kode)
);
comment on table public.jenis_tugas is 'Master jenis tugas per praktikum, diatur oleh asisten/koordinator lewat Dashboard Asisten. Contoh Dasar Sistem Kontrol: Tugas Rumah, Daftar Pustaka, Laporan. Contoh Programmable Logic Controller: Tugas Rumah, Laporan, Tugas Akhir.';

-- 2.17 deadline_tugas
create table public.deadline_tugas (
  id uuid primary key default extensions.uuid_generate_v4(),
  pertemuan_id uuid not null references public.pertemuan(id) on delete cascade,
  jenis_tugas_id uuid not null references public.jenis_tugas(id) on delete cascade,
  deadline timestamptz not null,
  diatur_oleh uuid references public.profiles(id),
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pertemuan_id, jenis_tugas_id)
);
comment on table public.deadline_tugas is 'Deadline pengumpulan tugas per pertemuan per jenis tugas. Diatur oleh asisten/koordinator lewat Dashboard Asisten > Kelola Deadline Tugas.';
comment on column public.deadline_tugas.keterangan is 'Catatan/instruksi bebas dari asisten untuk jenis tugas ini pada pertemuan tsb, mis. format file yang diminta.';

-- 2.18 pengumpulan_tugas
create table public.pengumpulan_tugas (
  id uuid primary key default extensions.uuid_generate_v4(),
  anggota_kelompok_id uuid not null references public.anggota_kelompok(id) on delete cascade,
  pertemuan_id uuid not null references public.pertemuan(id) on delete cascade,
  jenis_tugas_id uuid not null references public.jenis_tugas(id) on delete cascade,
  nama_file varchar not null,
  file_path text not null,
  ukuran_bytes bigint,
  mime_type varchar,
  waktu_upload timestamptz not null default now(),
  status varchar not null default 'tepat_waktu' check (status in ('tepat_waktu','telat')),
  gdrive_file_id text,
  gdrive_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (anggota_kelompok_id, pertemuan_id, jenis_tugas_id)
);
comment on table public.pengumpulan_tugas is 'Record pengumpulan tugas praktikan. File pertama disimpan di Cloudflare R2 (file_path = object key), lalu dipindah ke Google Drive secara manual lewat tombol "Simpan ke Google Drive". Setelah deadline_tugas.deadline lewat dan belum ada baris di sini, praktikan tidak bisa lagi upload (dikunci total, via trigger trg_enforce_deadline_tugas).';

-- ----------------------------------------------------------------------------
-- 3. FUNCTIONS
-- ----------------------------------------------------------------------------

create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_asisten_of_kelompok(p_kelompok_id uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.kelompok k
    where k.id = p_kelompok_id and k.asisten_id = auth.uid()
  );
$$;

create or replace function public.is_periode_aktif(user_id uuid)
returns boolean
language sql stable security definer
as $$
  select coalesce(
    (select pa.is_active from public.profiles p
     join public.periode_akademik pa on pa.id = p.periode_daftar
     where p.id = user_id),
    true
  );
$$;

create or replace function public.trg_set_updated_at()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.trg_handle_new_auth_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.profiles (id, role, nama_lengkap, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'praktikan'),
    coalesce(new.raw_user_meta_data->>'nama_lengkap', new.email),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.trg_autolink_anggota_kelompok()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.role = 'praktikan' and new.nim is not null then
    update public.anggota_kelompok
    set praktikan_id = new.id
    where nim = new.nim and praktikan_id is null;
  end if;
  return new;
end;
$$;

create or replace function public.trg_set_periode_daftar()
returns trigger language plpgsql as $$
begin
  if new.role = 'praktikan' and new.periode_daftar is null then
    select id into new.periode_daftar
    from public.periode_akademik
    where is_active = true
    order by tanggal_mulai desc nulls last
    limit 1;
  end if;
  return new;
end;
$$;

create or replace function public.trg_validasi_nim_praktikan_terdaftar()
returns trigger language plpgsql as $$
begin
  if new.role = 'praktikan' and new.nim is not null then
    if not exists (select 1 from public.anggota_kelompok where nim = new.nim) then
      raise exception 'NIM % belum terdaftar di kelompok praktikum manapun. Hubungi asisten/admin jika Anda merasa ini keliru.', new.nim
      using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.trg_validate_anggota_kelompok()
returns trigger language plpgsql as $$
declare
  v_kelas_praktikum_id uuid;
  v_existing_count int;
begin
  if new.nim is null or length(trim(new.nim)) = 0 then
    raise exception 'Kolom nim pada anggota_kelompok wajib diisi';
  end if;

  if new.praktikan_id is not null then
    if not exists (select 1 from public.profiles where id = new.praktikan_id and role = 'praktikan') then
      raise exception 'praktikan_id (%) harus merujuk ke profile dengan role praktikan', new.praktikan_id;
    end if;
  end if;

  select kelas_praktikum_id into v_kelas_praktikum_id from public.kelompok where id = new.kelompok_id;

  select count(*) into v_existing_count
  from public.anggota_kelompok ak
  join public.kelompok k on k.id = ak.kelompok_id
  where ak.nim = new.nim and k.kelas_praktikum_id = v_kelas_praktikum_id and ak.id is distinct from new.id;

  if v_existing_count > 0 then
    raise exception 'Praktikan dengan NIM % sudah terdaftar di kelompok lain pada kelas praktikum ini', new.nim;
  end if;

  return new;
end;
$$;

create or replace function public.trg_validate_asisten_role()
returns trigger language plpgsql as $$
begin
  if new.asisten_id is not null then
    if not exists (select 1 from public.profiles where id = new.asisten_id and role = 'asisten') then
      raise exception 'asisten_id (%) harus merujuk ke profile dengan role asisten', new.asisten_id;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.trg_enforce_deadline_tugas()
returns trigger language plpgsql set search_path to 'public' as $$
declare
  v_deadline timestamptz;
begin
  select deadline into v_deadline
  from public.deadline_tugas
  where pertemuan_id = new.pertemuan_id and jenis_tugas_id = new.jenis_tugas_id;

  if v_deadline is null then
    raise exception 'Deadline untuk jenis tugas ini belum diatur oleh asisten';
  end if;

  if now() > v_deadline then
    raise exception 'Batas waktu pengumpulan sudah lewat (%). Upload dikunci.', v_deadline;
  end if;

  new.status := 'tepat_waktu';
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS
-- ----------------------------------------------------------------------------

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.trg_handle_new_auth_user();

create trigger set_updated_at_jurusan before update on public.jurusan
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at_praktikum before update on public.praktikum
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at_kelas_praktikum before update on public.kelas_praktikum
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at_kelompok before update on public.kelompok
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at_modul before update on public.modul
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at_pertemuan before update on public.pertemuan
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at_berita before update on public.berita
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at_nilai_komponen before update on public.nilai_komponen
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at_modul_utama before update on public.modul_utama
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at before update on public.jenis_tugas
  for each row execute function public.trg_set_updated_at();
create trigger set_updated_at before update on public.deadline_tugas
  for each row execute function public.trg_set_updated_at();

create trigger autolink_anggota_kelompok after insert or update on public.profiles
  for each row execute function public.trg_autolink_anggota_kelompok();
create trigger set_periode_daftar before insert on public.profiles
  for each row execute function public.trg_set_periode_daftar();
create trigger validasi_nim_praktikan_terdaftar before insert or update on public.profiles
  for each row execute function public.trg_validasi_nim_praktikan_terdaftar();

create trigger validate_anggota_kelompok before insert or update on public.anggota_kelompok
  for each row execute function public.trg_validate_anggota_kelompok();

create trigger validate_asisten_role before insert or update on public.kelompok
  for each row execute function public.trg_validate_asisten_role();

create trigger enforce_deadline_tugas before insert or update on public.pengumpulan_tugas
  for each row execute function public.trg_enforce_deadline_tugas();

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.jurusan enable row level security;
alter table public.periode_akademik enable row level security;
alter table public.praktikum enable row level security;
alter table public.profiles enable row level security;
alter table public.kelas_praktikum enable row level security;
alter table public.kelompok enable row level security;
alter table public.anggota_kelompok enable row level security;
alter table public.modul enable row level security;
alter table public.pertemuan enable row level security;
alter table public.pertemuan_modul enable row level security;
alter table public.berita enable row level security;
alter table public.nilai_komponen enable row level security;
alter table public.modul_utama enable row level security;
alter table public.software_pendukung enable row level security;
alter table public.template_dokumen enable row level security;
alter table public.jenis_tugas enable row level security;
alter table public.deadline_tugas enable row level security;
alter table public.pengumpulan_tugas enable row level security;

-- jurusan
create policy public_read_jurusan on public.jurusan for select using (true);
create policy asisten_manage_jurusan on public.jurusan for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- periode_akademik
create policy public_read_periode on public.periode_akademik for select using (true);
create policy asisten_manage_periode on public.periode_akademik for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- praktikum
create policy public_read_praktikum on public.praktikum for select using (true);
create policy asisten_manage_praktikum on public.praktikum for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- profiles
create policy user_select_own_profile on public.profiles for select using ((select auth.uid()) = id);
create policy user_insert_own_profile on public.profiles for insert with check ((select auth.uid()) = id);
create policy user_update_own_profile on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy asisten_select_all_profiles on public.profiles for select using (current_user_role() = 'asisten'::public.user_role);

-- kelas_praktikum
create policy public_read_kelas_praktikum on public.kelas_praktikum for select using (true);
create policy asisten_manage_kelas_praktikum on public.kelas_praktikum for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- kelompok
create policy public_read_kelompok on public.kelompok for select using (true);
create policy asisten_manage_kelompok on public.kelompok for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- anggota_kelompok
create policy public_read_anggota_kelompok on public.anggota_kelompok for select using (true);
create policy asisten_manage_anggota_kelompok on public.anggota_kelompok for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- modul
create policy public_read_modul on public.modul for select using (true);
create policy asisten_manage_modul on public.modul for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- pertemuan
create policy public_read_pertemuan on public.pertemuan for select using (true);
create policy asisten_manage_pertemuan on public.pertemuan for all
  using (is_asisten_of_kelompok(kelompok_id)) with check (is_asisten_of_kelompok(kelompok_id));

-- pertemuan_modul
create policy public_read_pertemuan_modul on public.pertemuan_modul for select using (true);
create policy asisten_manage_pertemuan_modul on public.pertemuan_modul for all
  using (exists (select 1 from public.pertemuan p where p.id = pertemuan_modul.pertemuan_id and is_asisten_of_kelompok(p.kelompok_id)))
  with check (exists (select 1 from public.pertemuan p where p.id = pertemuan_modul.pertemuan_id and is_asisten_of_kelompok(p.kelompok_id)));

-- berita
create policy public_read_berita_published on public.berita for select using (is_published = true);
create policy asisten_read_all_berita on public.berita for select using (current_user_role() = 'asisten'::public.user_role);
create policy asisten_manage_berita on public.berita for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- nilai_komponen
create policy praktikan_read_own_nilai on public.nilai_komponen for select using (
  kode_komponen in ('TR','TA','P') and exists (
    select 1 from public.anggota_kelompok ak
    where ak.id = nilai_komponen.anggota_kelompok_id and ak.praktikan_id = auth.uid()
  )
);
create policy asisten_manage_nilai on public.nilai_komponen for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- modul_utama
create policy public_read_modul_utama on public.modul_utama for select using (true);
create policy asisten_manage_modul_utama on public.modul_utama for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- software_pendukung
create policy public_read_software on public.software_pendukung for select using (true);
create policy asisten_manage_software on public.software_pendukung for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- template_dokumen
create policy public_read_template on public.template_dokumen for select using (true);
create policy asisten_manage_template on public.template_dokumen for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- jenis_tugas
create policy public_read_jenis_tugas on public.jenis_tugas for select using (true);
create policy asisten_manage_jenis_tugas on public.jenis_tugas for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- deadline_tugas
create policy public_read_deadline_tugas on public.deadline_tugas for select using (true);
create policy asisten_manage_deadline_tugas on public.deadline_tugas for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- pengumpulan_tugas
create policy praktikan_read_own_pengumpulan on public.pengumpulan_tugas for select using (
  exists (select 1 from public.anggota_kelompok ak where ak.id = pengumpulan_tugas.anggota_kelompok_id and ak.praktikan_id = auth.uid())
);
create policy praktikan_insert_own_pengumpulan on public.pengumpulan_tugas for insert with check (
  exists (select 1 from public.anggota_kelompok ak where ak.id = pengumpulan_tugas.anggota_kelompok_id and ak.praktikan_id = auth.uid())
);
create policy praktikan_update_own_pengumpulan on public.pengumpulan_tugas for update using (
  exists (select 1 from public.anggota_kelompok ak where ak.id = pengumpulan_tugas.anggota_kelompok_id and ak.praktikan_id = auth.uid())
);
create policy asisten_manage_pengumpulan on public.pengumpulan_tugas for all
  using (current_user_role() = 'asisten'::public.user_role) with check (current_user_role() = 'asisten'::public.user_role);

-- ----------------------------------------------------------------------------
-- 6. SEED DATA (jurusan, praktikum, jenis tugas, + 1 periode aktif contoh)
-- ----------------------------------------------------------------------------

insert into public.jurusan (id, kode, nama, kelas_tersedia) values
  ('11111111-1111-1111-1111-111111111111', 'S1TE', 'S1 Teknik Elektro', array['A','B','C','D']),
  ('33333333-aaaa-4444-bbbb-555555555555', 'TSE', 'Teknik Sistem Energi', array['A','B','C']),
  ('44444444-aaaa-4444-bbbb-666666666666', 'D3TE', 'D3 Teknik Elektro', array['A','B'])
on conflict (id) do nothing;

insert into public.praktikum (id, kode_mk, kode_singkat, nama, jurusan_id) values
  ('55555555-5555-5555-5555-555555555555', 'C11010502', 'PLC', 'Praktikum Programmable Logic Controller', '11111111-1111-1111-1111-111111111111'),
  ('66666666-6666-6666-6666-666666666666', 'C14020402', 'DSK', 'Praktikum Dasar Sistem Kontrol', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into public.periode_akademik (id, kode_semester, nama, is_active) values
  ('33333333-3333-3333-3333-333333333333', '20242', 'Ganjil 2025/2026', true)
on conflict (id) do nothing;

insert into public.jenis_tugas (praktikum_id, kode, nama, urutan) values
  ('66666666-6666-6666-6666-666666666666', 'tugas_rumah', 'Tugas Rumah', 1),
  ('66666666-6666-6666-6666-666666666666', 'daftar_pustaka', 'Daftar Pustaka', 2),
  ('66666666-6666-6666-6666-666666666666', 'laporan', 'Laporan', 3),
  ('55555555-5555-5555-5555-555555555555', 'tugas_rumah', 'Tugas Rumah', 1),
  ('55555555-5555-5555-5555-555555555555', 'laporan', 'Laporan', 2),
  ('55555555-5555-5555-5555-555555555555', 'tugas_akhir', 'Tugas Akhir', 3)
on conflict (praktikum_id, kode) do nothing;

-- Kelas + kelompok contoh (silakan sesuaikan/hapus, atau import roster asli lewat fitur "Import Praktikan")
insert into public.kelas_praktikum (id, praktikum_id, periode_id, nama_kelas, dosen_pengampu, jumlah_peserta) values
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'A', 'Tim Dosen PLC', 20),
  ('6b997872-8399-48e6-89c3-020c4affadb6', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'A', 'Tim Dosen DSK', 20)
on conflict (id) do nothing;

insert into public.kelompok (id, kelas_praktikum_id, nama_kelompok, nomor_kelompok, shift, hari, jam_mulai, jam_selesai, ruangan) values
  ('32b20c6e-b154-40dc-9e05-035a91ce31e0', '6b997872-8399-48e6-89c3-020c4affadb6', 'TE A2', 2, '1', 'Senin', '08:00', '10:00', 'Lab ICAL 1'),
  ('8f586e82-527a-40dc-a66a-7101e70fbf47', '88888888-8888-8888-8888-888888888888', 'TE A2', 2, '1', 'Senin', '10:00', '12:00', 'Lab ICAL 2')
on conflict (id) do nothing;

insert into public.anggota_kelompok (kelompok_id, nama_praktikan, nim, nomor_urut) values
  ('32b20c6e-b154-40dc-9e05-035a91ce31e0', 'Ahmad Fauzi', '2022110001', 1),
  ('8f586e82-527a-40dc-a66a-7101e70fbf47', 'Ahmad Fauzi', '2022110001', 1),
  ('32b20c6e-b154-40dc-9e05-035a91ce31e0', 'Bintang Ramadhan', '2022110002', 2),
  ('8f586e82-527a-40dc-a66a-7101e70fbf47', 'Bintang Ramadhan', '2022110002', 2)
on conflict do nothing;

insert into public.pertemuan (kelompok_id, jenis, urutan_ke, tanggal, keterangan) values
  ('32b20c6e-b154-40dc-9e05-035a91ce31e0', 'pengarahan', 0, '2025-02-03', 'Pengarahan'),
  ('32b20c6e-b154-40dc-9e05-035a91ce31e0', 'pertemuan', 1, '2025-02-10', 'Pertemuan 1'),
  ('32b20c6e-b154-40dc-9e05-035a91ce31e0', 'pertemuan', 2, '2025-02-17', 'Pertemuan 2'),
  ('32b20c6e-b154-40dc-9e05-035a91ce31e0', 'pertemuan', 3, '2025-02-24', 'Pertemuan 3'),
  ('32b20c6e-b154-40dc-9e05-035a91ce31e0', 'pertemuan', 4, '2025-03-03', 'Pertemuan 4'),
  ('32b20c6e-b154-40dc-9e05-035a91ce31e0', 'uap', 5, '2025-03-10', 'UAP'),
  ('8f586e82-527a-40dc-a66a-7101e70fbf47', 'pengarahan', 0, '2025-02-03', 'Pengarahan'),
  ('8f586e82-527a-40dc-a66a-7101e70fbf47', 'pertemuan', 1, '2025-02-10', 'Pertemuan 1'),
  ('8f586e82-527a-40dc-a66a-7101e70fbf47', 'pertemuan', 2, '2025-02-17', 'Pertemuan 2'),
  ('8f586e82-527a-40dc-a66a-7101e70fbf47', 'pertemuan', 3, '2025-02-24', 'Pertemuan 3'),
  ('8f586e82-527a-40dc-a66a-7101e70fbf47', 'pertemuan', 4, '2025-03-03', 'Pertemuan 4'),
  ('8f586e82-527a-40dc-a66a-7101e70fbf47', 'uap', 5, '2025-03-10', 'UAP')
on conflict do nothing;

-- ============================================================================
-- SELESAI. Setelah menjalankan file ini:
-- 1. Buka Project Settings > API, salin "Project URL" dan "anon public key" ke NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
-- 2. Salin "service_role key" (JANGAN disebar) ke SUPABASE_SERVICE_ROLE_KEY
-- 3. (Opsional Storage) Buat bucket "foto-profil" jika ingin menyimpan foto profil asisten di Supabase Storage
-- ============================================================================
