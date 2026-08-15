-- ============================================================================
-- MERGE JURUSAN: D3TE25 ("D3 Teknik Elektro (2025)") -> D3TE ("D3 Teknik Elektro")
-- Tujuan: menyatukan 2 baris jurusan yang sebenarnya sama (D3TE & D3TE25)
-- menjadi 1, supaya total jurusan yang tampil di Beranda & Tentang Lab
-- kembali menjadi 4 (bukan 5).
--
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query
-- Aman dijalankan berkali-kali (idempotent) -- kalau D3TE25 sudah tidak ada,
-- semua blok di bawah otomatis tidak melakukan apa-apa.
-- ============================================================================

do $$
declare
  v_id_lama uuid;   -- id jurusan D3TE25 (yang akan dihapus)
  v_id_baru uuid;   -- id jurusan D3TE   (yang dipertahankan)
  v_praktikum_lama uuid;
  v_praktikum_baru uuid;
begin
  select id into v_id_lama from public.jurusan where kode = 'D3TE25';
  select id into v_id_baru from public.jurusan where kode = 'D3TE';

  if v_id_lama is null then
    raise notice 'D3TE25 sudah tidak ada, tidak ada yang perlu digabung.';
    return;
  end if;

  if v_id_baru is null then
    raise exception 'Jurusan D3TE tidak ditemukan, tidak bisa menggabungkan.';
  end if;

  -- 1) Pindahkan baris praktikum milik D3TE25 ke D3TE, kecuali kalau D3TE
  --    sudah punya praktikum dengan kode_singkat yang sama (hindari duplikat).
  update public.praktikum p
  set jurusan_id = v_id_baru,
      updated_at = now()
  where p.jurusan_id = v_id_lama
    and not exists (
      select 1 from public.praktikum p2
      where p2.jurusan_id = v_id_baru
        and p2.kode_singkat = p.kode_singkat
    );

  -- 2) Untuk praktikum D3TE25 yang kodenya sudah ada di D3TE (duplikat),
  --    alihkan dulu semua kelas_praktikum yang menempel ke praktikum D3TE
  --    yang setara, baru hapus baris praktikum D3TE25 yang jadi duplikat.
  for v_praktikum_lama, v_praktikum_baru in
    select p_lama.id, p_baru.id
    from public.praktikum p_lama
    join public.praktikum p_baru
      on p_baru.jurusan_id = v_id_baru
     and p_baru.kode_singkat = p_lama.kode_singkat
    where p_lama.jurusan_id = v_id_lama
  loop
    update public.kelas_praktikum
    set praktikum_id = v_praktikum_baru,
        updated_at = now()
    where praktikum_id = v_praktikum_lama;

    delete from public.praktikum where id = v_praktikum_lama;
  end loop;

  -- 3) Gabungkan kelas_tersedia (union) dari D3TE25 ke D3TE, biar tidak ada
  --    kelas yang hilang kalau D3TE25 punya kelas yang belum ada di D3TE.
  update public.jurusan j_baru
  set kelas_tersedia = (
        select array(
          select distinct unnest(j_baru.kelas_tersedia || j_lama.kelas_tersedia)
        )
      ),
      updated_at = now()
  from public.jurusan j_lama
  where j_baru.id = v_id_baru
    and j_lama.id = v_id_lama;

  -- 4) Hapus baris jurusan D3TE25 (semua praktikum-nya sudah dipindah/dihapus
  --    di langkah 1-2, jadi foreign key jurusan_id sudah tidak dirujuk lagi).
  delete from public.jurusan where id = v_id_lama;

  raise notice 'D3TE25 berhasil digabung ke D3TE.';
end $$;
