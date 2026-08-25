-- ============================================================================
-- 04_migration_kehadiran_pengarahan_uap.sql
-- Memperbarui trigger trg_recalc_kehadiran agar menghitung seluruh sesi
-- yang wajib dihadiri praktikan: Pengarahan, Pertemuan 1..n, dan UAP/Presentasi.
-- ============================================================================

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

  -- Total sesi yang dihitung mencakup pengarahan, pertemuan reguler, dan uap/presentasi
  select count(*) into v_total_sesi
  from public.pertemuan
  where kelompok_id = v_kelompok_id and jenis in ('pengarahan', 'pertemuan', 'uap', 'presentasi');

  select count(*) into v_hadir
  from public.absensi ab
  join public.pertemuan p on p.id = ab.pertemuan_id
  where ab.anggota_kelompok_id = v_anggota_id
    and p.jenis in ('pengarahan', 'pertemuan', 'uap', 'presentasi')
    and ab.status = 'H';

  v_persen := case when v_total_sesi > 0 then round((v_hadir::numeric / v_total_sesi::numeric) * 100) else 0 end;

  -- Simpan di baris "bucket" pertemuan jenis 'uap' milik kelompok yg sama
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
