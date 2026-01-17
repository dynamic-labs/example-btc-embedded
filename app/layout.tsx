import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { DynamicContextProvider } from './providers/DynamicProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BTC Demo - Dynamic Labs',
  description: 'Test app for Dynamic Labs wallet creation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DynamicContextProvider>
          {children}
        </DynamicContextProvider>
      </body>
    </html>
  )
}

