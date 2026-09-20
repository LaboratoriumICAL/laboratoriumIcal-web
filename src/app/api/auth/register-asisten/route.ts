import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Pendaftaran asisten mandiri tidak tersedia. Hubungi admin untuk membuat akun.' },
    { status: 403 }
  )
}
