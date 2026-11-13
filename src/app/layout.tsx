import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Lora } from 'next/font/google'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'
import NavigationBar from '@/components/navigation-bar'
import Header from '@/components/header'
import AuthListener from '@/components/auth-listener'

config.autoAddCss = false

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
})

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  style: ['normal', 'italic'],
})

export const viewport: Viewport = {
  themeColor: '#F7F5F0',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'BetterThoughts · Diário Terapêutico',
  description: 'Diário terapêutico mobile-first com questionamento socrático via IA',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BetterThoughts',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakartaSans.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F5F0] text-[#2F3530] font-sans selection:bg-[#7B907E]/25 selection:text-[#2F3530]">
        <AuthListener />
        <Header />
        <main className="flex-1 pb-24 md:pb-12">{children}</main>
        <NavigationBar />
      </body>
    </html>
  )
}
