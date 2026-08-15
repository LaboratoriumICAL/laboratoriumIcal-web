-- ============================================================================
-- ICAL ITPLN — SEED JURUSAN, KELAS, & PRAKTIKUM (Semester Ganjil 2026/2027)
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query
-- Bisa dijalankan berkali-kali dengan aman (idempotent: upsert / on conflict).
--
-- Struktur mengikuti tabel `jurusan` dan `praktikum` pada supabase/schema.sql:
--   - jurusan.kelas_tersedia  -> daftar huruf kelas yang tersedia untuk jurusan itu
--   - praktikum               -> satu baris per (jurusan, jenis praktikum) yang tersedia
--
-- Jurusan & praktikum yang tersedia:
--   1. Teknik Tenaga Listrik   -> kelas A,B,C,D,E  -> hanya Dasar Sistem Kontrol (DSK)
--   2. S1 Teknik Elektro       -> kelas A,B,C,D     -> hanya Programmable Logic Controller (PLC)
--   3. Teknik Sistem Energi    -> kelas A,B,C       -> hanya Dasar Sistem Kontrol (DSK)
--   4. D3 Teknik Elektro       -> kelas A,B,C,D     -> hanya Programmable Logic Controller (PLC)
--
-- Catatan: jurusan "D3TE25" (D3 Teknik Elektro 2025) sudah digabung ke dalam
-- "D3TE" -- lihat supabase/05_merge_d3te25_into_d3te.sql. Jangan ditambahkan
-- lagi di sini supaya total jurusan tetap 4.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. JURUSAN (upsert berdasarkan kode, aman dijalankan ulang)
-- ----------------------------------------------------------------------------
insert into public.jurusan (id, kode, nama, kelas_tersedia) values
  ('a1000000-0000-4000-8000-000000000001', 'TTL',     'Teknik Tenaga Listrik',    array['A','B','C','D','E']),
  ('a1000000-0000-4000-8000-000000000002', 'S1TE',    'S1 Teknik Elektro',        array['A','B','C','D']),
  ('a1000000-0000-4000-8000-000000000003', 'TSE',     'Teknik Sistem Energi',     array['A','B','C']),
  ('a1000000-0000-4000-8000-000000000004', 'D3TE',    'D3 Teknik Elektro',        array['A','B','C','D'])
on conflict (kode) do update
  set nama = excluded.nama,
      kelas_tersedia = excluded.kelas_tersedia,
      updated_at = now();

-- ----------------------------------------------------------------------------
-- 2. PRAKTIKUM (hanya jenis praktikum yang tersedia per jurusan sesuai spesifikasi)
--    kode_singkat: DSK = Dasar Sistem Kontrol, PLC = Programmable Logic Controller
-- ----------------------------------------------------------------------------
insert into public.praktikum (id, kode_mk, kode_singkat, nama, jurusan_id) values
  -- 1. Teknik Tenaga Listrik -> Dasar Sistem Kontrol
  ('a2000000-0000-4000-8000-000000000001', 'C14020402', 'DSK', 'Praktikum Dasar Sistem Kontrol',
    (select id from public.jurusan where kode = 'TTL')),

  -- 2. S1 Teknik Elektro -> Programmable Logic Controller
  ('a2000000-0000-4000-8000-000000000002', 'C11010502', 'PLC', 'Praktikum Programmable Logic Controller',
    (select id from public.jurusan where kode = 'S1TE')),

  -- 3. Teknik Sistem Energi -> Dasar Sistem Kontrol
  ('a2000000-0000-4000-8000-000000000003', 'C14020402', 'DSK', 'Praktikum Dasar Sistem Kontrol',
    (select id from public.jurusan where kode = 'TSE')),

  -- 4. D3 Teknik Elektro -> Programmable Logic Controller
  ('a2000000-0000-4000-8000-000000000004', 'C11010502', 'PLC', 'Praktikum Programmable Logic Controller',
    (select id from public.jurusan where kode = 'D3TE'))
on conflict (kode_singkat, jurusan_id) do update
  set nama = excluded.nama,
      kode_mk = excluded.kode_mk,
      updated_at = now();

-- ----------------------------------------------------------------------------
-- 3. PERIODE AKADEMIK AKTIF: Semester Ganjil 2026/2027
--    Menonaktifkan periode aktif lama (jika ada) lalu mengaktifkan periode baru.
-- ----------------------------------------------------------------------------
update public.periode_akademik set is_active = false where is_active = true;

insert into public.periode_akademik (id, kode_semester, nama, is_active) values
  ('a3000000-0000-4000-8000-000000000001', '20261', 'Ganjil 2026/2027', true)
on conflict (id) do update
  set is_active = true,
      nama = excluded.nama;

-- ============================================================================
-- CATATAN:
-- - Data seed contoh pada schema.sql (kelas_praktikum, kelompok, anggota_kelompok,
--   pertemuan) hanya contoh. Silakan tambahkan kelas_praktikum + kelompok yang
--   sebenarnya lewat fitur "Import Praktikan" pada dashboard asisten, atau lewat
--   INSERT manual ke public.kelas_praktikum dengan praktikum_id dan periode_id
--   ('a3000000-0000-4000-8000-000000000001') di atas.
-- - Jika sebelumnya sempat menjalankan schema.sql versi lama yang memberi
--   S1 Teknik Elektro akses ke praktikum DSK, baris tersebut TIDAK otomatis
--   dihapus oleh skrip ini (untuk menghindari kehilangan data kelas/nilai yang
--   sudah terisi). Hapus manual jika memang tidak diperlukan, contoh:
--     delete from public.praktikum
--     where kode_singkat = 'DSK'
--       and jurusan_id = (select id from public.jurusan where kode = 'S1TE');
-- ============================================================================
