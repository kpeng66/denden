import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToasterProvider } from '@/providers/toast-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DenDen Arcade',
  description: 'DenDen Arcade',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToasterProvider />
        {children}
      </body>
    </html>
  )
}
