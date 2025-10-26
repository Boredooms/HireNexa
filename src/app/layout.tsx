import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import WalletAddressSync from '@/components/auth/WalletAddressSync'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HireNexa - Blockchain-Powered Recruitment',
  description: 'AI-verified skills, blockchain credentials, IPFS portfolios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <WalletAddressSync />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
