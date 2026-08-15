-- ============================================================================
-- MIGRASI: ABSENSI & SCAN QR (real, terhubung database)
-- Jalankan file ini SETELAH schema.sql (Supabase Dashboard > SQL Editor > New query).
-- Aman dijalankan ulang (idempotent) selama tabel/trigger belum ada.
--
-- Yang dibuat:
-- 1. Tabel public.absensi -> menyimpan status kehadiran (H/I/A) per praktikan per pertemuan,
--    hasil dari Scan QR (otomatis, status H) atau input manual asisten.
-- 2. Trigger trg_absensi_recalc_kehadiran -> setiap kali baris absensi berubah, otomatis
--    menghitung ulang persentase kehadiran praktikan (jumlah hadir / jumlah pertemuan reguler
--    kelompoknya x 100) dan menuliskannya ke public.nilai_komponen (kode_komponen = 'KEHADIRAN')
--    pada baris pertemuan jenis 'uap' milik kelompok tsb -- baris "bucket" yang sama yang dipakai
--    tabel Kelola Nilai untuk komponen final tunggal. Artinya kolom "Kehadiran" pada rekap nilai
--    PLC terisi OTOMATIS, tidak perlu diketik manual oleh asisten lagi.
-- 3. RLS policies selaras dengan pola tabel lain di schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL absensi
-- ----------------------------------------------------------------------------
create table if not exists public.absensi (
  id uuid primary key default extensions.uuid_generate_v4(),
  anggota_kelompok_id uuid not null references public.anggota_kelompok(id) on delete cascade,
  pertemuan_id uuid not null references public.pertemuan(id) on delete cascade,
  status varchar not null check (status in ('H','I','A')),
  metode varchar not null default 'scan_qr' check (metode in ('scan_qr','manual')),
  waktu_absen timestamptz not null default now(),
  dicatat_oleh uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (anggota_kelompok_id, pertemuan_id)
);
comment on table public.absensi is 'Rekam kehadiran real per praktikan per pertemuan. Diisi lewat Scan QR (otomatis, status H) atau tombol H/I/A manual asisten di Dashboard Asisten > Absensi & QR. Persentase kehadiran otomatis disinkronkan ke nilai_komponen (KEHADIRAN) lewat trigger trg_absensi_recalc_kehadiran.';
comment on column public.absensi.metode is 'scan_qr = tercatat otomatis lewat kamera Scan QR praktikan; manual = diklik langsung oleh asisten di tabel rekap.';

create index if not exists idx_absensi_pertemuan on public.absensi(pertemuan_id);
create index if not exists idx_absensi_anggota on public.absensi(anggota_kelompok_id);

drop trigger if exists trg_absensi_updated_at on public.absensi;
create trigger trg_absensi_updated_at
  before update on public.absensi
  for each row execute function public.trg_set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. FUNGSI + TRIGGER: sinkronisasi otomatis ke nilai_komponen.KEHADIRAN
-- ----------------------------------------------------------------------------
create or replace function public.trg_recalc_kehadiran()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_anggota_id uuid;
  v_kelompok_id uuid;
  v_total_sesi int;
  v_hadir int;
  v_persen numeric;
  v_uap_pertemuan_id uuid;
begin
  v_anggota_id := coalesce(new.anggota_kelompok_id, old.anggota_kelompok_id);

  select kelompok_id into v_kelompok_id
  from public.anggota_kelompok
  where id = v_anggota_id;

  if v_kelompok_id is null then
    return coalesce(new, old);
  end if;

  -- total sesi yang dihitung untuk persentase kehadiran = pertemuan reguler (jenis 'pertemuan'),
  -- tidak termasuk pengarahan/presentasi/uap.
  select count(*) into v_total_sesi
  from public.pertemuan
  where kelompok_id = v_kelompok_id and jenis = 'pertemuan';

  select count(*) into v_hadir
  from public.absensi ab
  join public.pertemuan p on p.id = ab.pertemuan_id
  where ab.anggota_kelompok_id = v_anggota_id
    and p.jenis = 'pertemuan'
    and ab.status = 'H';

  v_persen := case when v_total_sesi > 0 then round((v_hadir::numeric / v_total_sesi::numeric) * 100) else 0 end;

  -- simpan di baris "bucket" pertemuan jenis 'uap' milik kelompok yg sama, sesuai konvensi
  -- komponen finalTunggal (satu nilai per praktikan, bukan per pertemuan).
  select id into v_uap_pertemuan_id
  from public.pertemuan
  where kelompok_id = v_kelompok_id and jenis = 'uap'
  limit 1;

  if v_uap_pertemuan_id is not null then
    insert into public.nilai_komponen (anggota_kelompok_id, pertemuan_id, kode_komponen, nilai, updated_at)
    values (v_anggota_id, v_uap_pertemuan_id, 'KEHADIRAN', v_persen, now())
    on conflict (anggota_kelompok_id, pertemuan_id, kode_komponen)
    do update set nilai = excluded.nilai, updated_at = now();
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_absensi_recalc_kehadiran on public.absensi;
create trigger trg_absensi_recalc_kehadiran
  after insert or update or delete on public.absensi
  for each row execute function public.trg_recalc_kehadiran();

-- ----------------------------------------------------------------------------
-- 3. RLS
-- ----------------------------------------------------------------------------
alter table public.absensi enable row level security;

drop policy if exists praktikan_read_own_absensi on public.absensi;
create policy praktikan_read_own_absensi on public.absensi for select using (
  exists (
    select 1 from public.anggota_kelompok ak
    where ak.id = absensi.anggota_kelompok_id and ak.praktikan_id = auth.uid()
  )
);

drop policy if exists asisten_manage_absensi on public.absensi;
create policy asisten_manage_absensi on public.absensi for all
  using (current_user_role() = 'asisten'::public.user_role)
  with check (current_user_role() = 'asisten'::public.user_role);

-- ============================================================================
-- SELESAI. Setelah menjalankan file ini, fitur "Absensi & Scan QR" di Dashboard
-- Asisten sudah terhubung penuh ke database (bukan mock lagi), dan kolom
-- "Kehadiran" pada Kelola Nilai > PLC otomatis terisi dari data absensi ini
-- (read-only, tidak perlu input manual).
-- ============================================================================
