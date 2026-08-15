-- ============================================================================
-- HIDUPKAN KEMBALI D3TE25, TAPI SEMBUNYIKAN DARI STATISTIK BERANDA
-- Tujuan: jurusan "D3TE25" (D3 Teknik Elektro 2025) aktif penuh lagi di semua
-- fitur (dropdown pendaftaran, import praktikan, kelola nilai, dll), TAPI
-- tidak dihitung di angka "X Prodi" pada Beranda & Tentang Lab -- angka itu
-- tetap tampil 4, bukan 5.
--
-- Caranya: tambah kolom `tampil_statistik` di tabel jurusan. Baris dengan
-- tampil_statistik = false tetap berfungsi normal di semua tempat lain,
-- hanya dikecualikan dari perhitungan total_jurusan di get_public_stats().
--
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query
-- Aman dijalankan berkali-kali (idempotent).
-- ============================================================================

-- 1) Kolom penanda "ikut dihitung di statistik publik atau tidak"
alter table public.jurusan
  add column if not exists tampil_statistik boolean not null default true;

comment on column public.jurusan.tampil_statistik is
  'Jika false, jurusan ini tetap aktif penuh di semua fitur (dropdown, import, nilai, dll) tapi dikecualikan dari hitungan "X Prodi" di Beranda & Tentang Lab.';

-- 2) Hidupkan lagi D3TE25 (upsert berdasarkan kode, aman dijalankan ulang).
--    kelas_tersedia disamakan dengan D3TE supaya tidak ada kelas yang hilang.
insert into public.jurusan (kode, nama, kelas_tersedia, tampil_statistik)
values (
  'D3TE25',
  'D3 Teknik Elektro (2025)',
  coalesce((select kelas_tersedia from public.jurusan where kode = 'D3TE'), array['A','B','C','D']),
  false
)
on conflict (kode) do update
  set nama = excluded.nama,
      tampil_statistik = false,
      updated_at = now();

-- 3) Praktikum untuk D3TE25, mengikuti jenis praktikum D3TE (PLC).
insert into public.praktikum (kode_mk, kode_singkat, nama, jurusan_id)
select 'C11010502', 'PLC', 'Praktikum Programmable Logic Controller',
       (select id from public.jurusan where kode = 'D3TE25')
on conflict (kode_singkat, jurusan_id) do update
  set nama = excluded.nama,
      kode_mk = excluded.kode_mk,
      updated_at = now();

-- 4) Perbarui get_public_stats() supaya total_jurusan hanya menghitung
--    jurusan dengan tampil_statistik = true.
--    CATATAN: jika fungsi asli Anda di Supabase punya logika total_praktikan
--    / total_asisten / total_modul yang berbeda dari di bawah ini, sesuaikan
--    bagian tersebut -- yang penting bagian total_jurusan memakai filter
--    "where tampil_statistik" seperti contoh ini.
create or replace function public.get_public_stats()
returns table (
  total_praktikan bigint,
  total_asisten bigint,
  total_jurusan bigint,
  total_modul bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.profiles where role = 'praktikan' and is_active) as total_praktikan,
    (select count(*) from public.profiles where role = 'asisten' and is_active) as total_asisten,
    (select count(*) from public.jurusan where tampil_statistik) as total_jurusan,
    (select count(*) from public.modul) as total_modul;
$$;

comment on function public.get_public_stats() is
  'Statistik ringkas untuk landing page (Beranda & Tentang Lab). total_jurusan hanya menghitung jurusan dengan tampil_statistik = true (lihat 06_hidupkan_d3te25_sembunyikan_dari_statistik.sql).';
