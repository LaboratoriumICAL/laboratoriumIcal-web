-- ============================================================================
-- MIGRASI: tambah status "Sakit" (S) pada absensi
-- Jalankan SETELAH 02_migration_absensi.sql (Supabase Dashboard > SQL Editor > New query).
-- Sebelumnya status absensi cuma H (Hadir) / I (Izin) / A (Alfa). Sekarang ditambah
-- S (Sakit) supaya asisten bisa membedakan praktikan yang izin karena sakit dari izin biasa.
-- Trigger trg_recalc_kehadiran TIDAK perlu diubah karena hanya menghitung status='H'.
-- ============================================================================

alter table public.absensi drop constraint if exists absensi_status_check;
alter table public.absensi add constraint absensi_status_check check (status in ('H', 'I', 'S', 'A'));

comment on column public.absensi.status is 'H = Hadir, I = Izin, S = Sakit, A = Alfa (tidak hadir tanpa keterangan).';
