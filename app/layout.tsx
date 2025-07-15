import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from './provider'

export const metadata: Metadata = {
  title: 'AskDocs AI',
  description: 'Communicate With PDF or Docs URL easily with our platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>  
      <AuthProvider >
        {children}
      </AuthProvider>
      </body>
    </html>
  )
}
