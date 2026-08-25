import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ICAL - Intelligent Control & Automation Laboratory ITPLN',
  description: 'Website resmi Laboratorium Intelligent Control & Automation (ICAL) Institut Teknologi PLN. Informasi praktikum DSK, PLC, dan SKI.',
  keywords: ['ICAL', 'ITPLN', 'Sistem Kontrol', 'PLC', 'Laboratorium ITPLN', 'Dasar Sistem Kontrol', 'Sistem Kontrol Industri'],
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
