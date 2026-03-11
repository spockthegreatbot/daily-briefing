import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Daily Briefing · Micro News Hub',
  description: 'Daily market intelligence dashboard — world news, crypto, social trends',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`} style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
