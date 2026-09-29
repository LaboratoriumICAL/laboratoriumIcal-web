export const SESI_MODUL: Record<'DSK' | 'PLC', Record<number, number[]>> = {
  DSK: {
    1: [1],
    2: [2, 3],
    3: [4],
    4: [5],
  },
  PLC: {
    1: [1],
    2: [2],
    3: [3],
    4: [4, 5],
  },
}

/**
 * Mengembalikan urutan_ke sesi Pertemuan tempat modul itu dilaksanakan.
 * @param praktikum 'DSK' | 'PLC' | string
 * @param nomorModul nomor modul asli (1..n)
 * @returns urutan_ke sesi pertemuan, atau undefined jika tidak ditemukan
 */
export function sesiUntukModul(praktikum: 'DSK' | 'PLC' | string, nomorModul: number): number | undefined {
  const p = praktikum.toUpperCase() as 'DSK' | 'PLC'
  const mapping = SESI_MODUL[p]
  if (!mapping) return undefined
  for (const [sesiStr, modulList] of Object.entries(mapping)) {
    if (modulList.includes(nomorModul)) {
      return Number(sesiStr)
    }
  }
  return undefined
}
