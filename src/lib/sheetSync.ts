import { getSupabaseAdmin } from './supabaseAdmin'

export interface RawNilaiRow {
  anggota_kelompok_id: string
  pertemuan_id: string
  kode_komponen: string
  nomor_modul?: number | null
  nilai: number | null | string
}

export interface SheetUpdateItem {
  praktikum: 'DSK' | 'PLC' | string
  nim: string
  komponen: string
  nomor: number
  nilai: number | null
}

export interface KirimKeSheetResult {
  dilewati?: boolean
  terkirim: number
  gagal: Array<{
    nim: string
    komponen: string
    nomor: number
    alasan?: string
  }>
  tidakPasti?: boolean
}

/**
 * Memetakan baris nilai_komponen ke format pembaruan Google Sheets.
 * Mengambil data pendukung (nim, praktikum, jenis & urutan pertemuan) via batch query.
 * Baris yang tidak bisa dipetakan otomatis dilewati.
 */
export async function petakanKeSheet(rows: RawNilaiRow[]): Promise<SheetUpdateItem[]> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }

  const anggotaIds = Array.from(new Set(rows.map((r) => r.anggota_kelompok_id).filter(Boolean)))
  const pertemuanIds = Array.from(new Set(rows.map((r) => r.pertemuan_id).filter(Boolean)))

  if (anggotaIds.length === 0 || pertemuanIds.length === 0) {
    return []
  }

  const sb = getSupabaseAdmin()

  const [anggotaRes, pertemuanRes] = await Promise.all([
    sb
      .from('anggota_kelompok')
      .select(`
        id,
        nim,
        kelompok:kelompok_id (
          kelas_praktikum:kelas_praktikum_id (
            praktikum:praktikum_id (
              kode_singkat
            )
          )
        )
      `)
      .in('id', anggotaIds),
    sb
      .from('pertemuan')
      .select('id, jenis, urutan_ke')
      .in('id', pertemuanIds),
  ])

  function extractKodeSingkat(kelompok: any): string | null {
    if (!kelompok) return null
    const k = Array.isArray(kelompok) ? kelompok[0] : kelompok
    const kp = Array.isArray(k?.kelas_praktikum) ? k.kelas_praktikum[0] : k?.kelas_praktikum
    const p = Array.isArray(kp?.praktikum) ? kp.praktikum[0] : kp?.praktikum
    return p?.kode_singkat || null
  }

  const anggotaMap = new Map<string, { nim: string; praktikum: string }>()
  for (const a of (anggotaRes.data || []) as any[]) {
    const praktikum = extractKodeSingkat(a.kelompok)
    if (a.nim && praktikum) {
      anggotaMap.set(a.id, { nim: a.nim, praktikum })
    }
  }

  const pertemuanMap = new Map<string, { jenis: string; urutan_ke: number | null }>()
  for (const p of (pertemuanRes.data || []) as any[]) {
    pertemuanMap.set(p.id, { jenis: p.jenis, urutan_ke: p.urutan_ke })
  }

  const updates: SheetUpdateItem[] = []

  for (const row of rows) {
    const anggota = anggotaMap.get(row.anggota_kelompok_id)
    const pert = pertemuanMap.get(row.pertemuan_id)
    if (!anggota || !pert) {
      continue
    }

    const komponen = (row.kode_komponen || '').trim().toUpperCase()
    let nomor: number | null = null

    switch (komponen) {
      case 'TR':
      case 'M':
      case 'LP': {
        const n = Number(row.nomor_modul)
        if (n >= 1 && n <= 5) {
          nomor = n
        } else if ((!row.nomor_modul || n === 0) && pert.urutan_ke != null && pert.urutan_ke >= 1 && pert.urutan_ke <= 5) {
          nomor = Number(pert.urutan_ke)
        }
        break
      }
      case 'TA':
      case 'VID': {
        const n = Number(pert.urutan_ke)
        if (n >= 1 && n <= 4) {
          nomor = n
        }
        break
      }
      case 'P': {
        if (pert.jenis === 'pengarahan') {
          nomor = 0
        } else if (pert.urutan_ke != null && !isNaN(Number(pert.urutan_ke))) {
          nomor = Number(pert.urutan_ke)
        }
        break
      }
      case 'UAP':
      case 'JURNAL':
      case 'LAPORAN':
      case 'POSTER':
      case 'PRESENTASI': {
        nomor = 0
        break
      }
      default:
        // KEHADIRAN dan kode lain: JANGAN dikirim (dilewati)
        break
    }

    if (nomor === null) {
      continue
    }

    let nilai: number | null = null
    if (row.nilai !== null && row.nilai !== undefined && row.nilai !== '') {
      const num = Number(row.nilai)
      nilai = isNaN(num) ? null : num
    }

    updates.push({
      praktikum: anggota.praktikum,
      nim: anggota.nim,
      komponen,
      nomor,
      nilai,
    })
  }

  return updates
}

/**
 * Mengirim array updates ke Google Apps Script Web App.
 * Menggunakan AbortController untuk timeout (default 8000ms).
 * Fungsi ini TIDAK melempar error.
 * Tidak pernah mengekspos APPS_SCRIPT_URL atau APPS_SCRIPT_TOKEN di log maupun respons.
 */
export async function kirimKeSheet(
  updates: SheetUpdateItem[],
  options?: { timeoutMs?: number }
): Promise<KirimKeSheetResult> {
  const url = process.env.APPS_SCRIPT_URL
  const token = process.env.APPS_SCRIPT_TOKEN

  if (!url || !token) {
    return { dilewati: true, terkirim: 0, gagal: [] }
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    return { terkirim: 0, gagal: [] }
  }

  const timeoutMs = options?.timeoutMs ?? 8000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        token,
        updates,
      }),
      redirect: 'follow',
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      console.error(`kirimKeSheet: HTTP status ${res.status}`)
      return {
        terkirim: 0,
        gagal: updates.map((u) => ({
          nim: u.nim,
          komponen: u.komponen,
          nomor: u.nomor,
          alasan: `HTTP status ${res.status}`,
        })),
        tidakPasti: true,
      }
    }

    const text = await res.text()
    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      console.error('kirimKeSheet: Format respons Apps Script tidak valid (bukan JSON)')
      return {
        terkirim: 0,
        gagal: updates.map((u) => ({
          nim: u.nim,
          komponen: u.komponen,
          nomor: u.nomor,
          alasan: 'Respons Apps Script bukan JSON',
        })),
        tidakPasti: true,
      }
    }

    if (!json.ok) {
      const errMsg = json.error || 'ok=false'
      console.error('kirimKeSheet: Apps Script menolak pembaruan:', errMsg)
      return {
        terkirim: 0,
        gagal: updates.map((u) => ({
          nim: u.nim,
          komponen: u.komponen,
          nomor: u.nomor,
          alasan: errMsg,
        })),
      }
    }

    const hasilList: any[] = Array.isArray(json.hasil) ? json.hasil : []
    const gagal: Array<{ nim: string; komponen: string; nomor: number; alasan?: string }> = []
    let terkirim = 0

    if (hasilList.length > 0) {
      for (const h of hasilList) {
        if (h.status === 'ok') {
          terkirim++
        } else {
          gagal.push({
            nim: h.nim,
            komponen: h.komponen,
            nomor: h.nomor,
            alasan: h.alasan || 'Gagal di sheet',
          })
        }
      }
    } else {
      terkirim = updates.length
    }

    return { terkirim, gagal }
  } catch (err: any) {
    clearTimeout(timer)
    const isAbort = err?.name === 'AbortError' || controller.signal.aborted
    if (isAbort) {
      console.warn(`kirimKeSheet: Request timeout setelah ${timeoutMs}ms (skrip mungkin masih berjalan)`)
    } else {
      console.warn('kirimKeSheet: Terjadi kesalahan jaringan saat memanggil Apps Script:', err?.message || err)
    }
    return {
      terkirim: 0,
      gagal: updates.map((u) => ({
        nim: u.nim,
        komponen: u.komponen,
        nomor: u.nomor,
        alasan: isAbort ? 'Timeout' : 'Network error',
      })),
      tidakPasti: true,
    }
  }
}
