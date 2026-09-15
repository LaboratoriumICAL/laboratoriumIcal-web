import { SupabaseClient } from '@supabase/supabase-js'

export interface ResetKelasOptions {
  kelasId: string
  onlyNumbers?: boolean // jika true, hanya kelompok yang namanya berupa angka ('1', '2', '3', dst)
}

/**
 * Menghapus kelompok, anggota_kelompok, pertemuan, serta rekaman nilai/absensi terkait
 * secara berurutan agar tidak melanggar foreign key constraint.
 */
export async function resetKelasData(sb: SupabaseClient, options: ResetKelasOptions) {
  const { kelasId, onlyNumbers = false } = options

  // 1. Ambil daftar kelompok di kelas ini
  const { data: kelompokList, error: eK } = await sb
    .from('kelompok')
    .select('id, nama_kelompok')
    .eq('kelas_praktikum_id', kelasId)
  if (eK) throw eK

  let targets = kelompokList || []
  if (onlyNumbers) {
    targets = targets.filter((k) => /^\d+$/.test(k.nama_kelompok.trim()))
  }

  if (targets.length === 0) {
    return { kelompokCount: 0, anggotaCount: 0, pertemuanCount: 0 }
  }

  const kelompokIds = targets.map((k) => k.id)

  // 2. Ambil daftar ID anggota_kelompok yang terkait
  const { data: anggotaList, error: eA } = await sb
    .from('anggota_kelompok')
    .select('id')
    .in('kelompok_id', kelompokIds)
  if (eA) throw eA
  const anggotaIds = (anggotaList || []).map((a) => a.id)

  // 3. Ambil daftar ID pertemuan yang terkait
  const { data: pertemuanList, error: eP } = await sb
    .from('pertemuan')
    .select('id')
    .in('kelompok_id', kelompokIds)
  if (eP) throw eP
  const pertemuanIds = (pertemuanList || []).map((p) => p.id)

  // 4. Hapus data turunan yang merujuk ke anggota_kelompok (nilai, absensi)
  if (anggotaIds.length > 0) {
    try {
      await sb.from('nilai').delete().in('anggota_kelompok_id', anggotaIds)
    } catch (_) {}

    try {
      await sb.from('absensi').delete().in('anggota_kelompok_id', anggotaIds)
    } catch (_) {}

    const { error: errDelAnggota } = await sb
      .from('anggota_kelompok')
      .delete()
      .in('id', anggotaIds)
    if (errDelAnggota) throw errDelAnggota
  }

  // 5. Hapus data turunan yang merujuk ke pertemuan
  if (pertemuanIds.length > 0) {
    try {
      await sb.from('kehadiran_asisten').delete().in('pertemuan_id', pertemuanIds)
    } catch (_) {}

    try {
      await sb.from('absensi_sesi').delete().in('pertemuan_id', pertemuanIds)
    } catch (_) {}

    const { error: errDelPertemuan } = await sb
      .from('pertemuan')
      .delete()
      .in('id', pertemuanIds)
    if (errDelPertemuan) throw errDelPertemuan
  }

  // 6. Hapus kelompok
  const { error: errDelKelompok } = await sb
    .from('kelompok')
    .delete()
    .in('id', kelompokIds)
  if (errDelKelompok) throw errDelKelompok

  return {
    kelompokCount: kelompokIds.length,
    anggotaCount: anggotaIds.length,
    pertemuanCount: pertemuanIds.length,
  }
}
