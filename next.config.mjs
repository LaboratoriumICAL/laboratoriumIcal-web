/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // File di public/modul/** defaultnya TAMPIL INLINE (untuk preview PDF di halaman).
  // Supaya DI-PAKSA DOWNLOAD (dipakai tombol "Unduh"), tambahkan ?download=1 di URL-nya.
  // Ini murni aturan header statis -- tidak menyentuh Supabase sama sekali.
  async headers() {
    return [
      {
        source: '/modul/:path*',
        has: [{ type: 'query', key: 'download' }],
        headers: [{ key: 'Content-Disposition', value: 'attachment' }],
      },
      {
        // Template (docx/pptx) SELALU dipaksa download -- format ini tidak bisa
        // di-preview di browser, jadi tidak perlu mode inline seperti modul PDF.
        source: '/template/:path*',
        headers: [{ key: 'Content-Disposition', value: 'attachment' }],
      },
    ]
  },
}

export default nextConfig
