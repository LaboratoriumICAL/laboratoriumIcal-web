import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fileParam = searchParams.get('file')

    if (!fileParam) {
      return NextResponse.json({ error: 'Parameter file wajib disertakan' }, { status: 400 })
    }

    // Sanitize filename to prevent directory traversal
    const safeFileName = path.basename(fileParam)
    const filePath = path.join(process.cwd(), 'public', 'template', safeFileName)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File tidak ditemukan di server' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const ext = path.extname(safeFileName).toLowerCase()

    let contentType = 'application/octet-stream'
    if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (ext === '.pptx') {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    } else if (ext === '.xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (ext === '.pdf') {
      contentType = 'application/pdf'
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengunduh file' }, { status: 500 })
  }
}
