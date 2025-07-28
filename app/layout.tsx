import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from './provider'
import { Toaster } from 'sonner'

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
        <Toaster position='top-right'richColors={true}/>
        {children}
      </AuthProvider>
      </body>
    </html>
  )
}
