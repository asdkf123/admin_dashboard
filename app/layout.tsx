import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '차지비 관리자 대시보드',
  description: '충전소 관리자 전용 대시보드',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  )
}
