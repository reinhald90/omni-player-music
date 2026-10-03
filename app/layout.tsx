import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SITE_CONFIG } from '@/lib/constants'
import Navbar from '@/components/layout/Navbar'
import GlobalPlayer from '@/components/player/GlobalPlayer'
import LoadingScreen from '@/components/layout/LoadingScreen'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} — Premium Music Player`,
    template: `%s · ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  authors: [{ name: SITE_CONFIG.author }],
  creator: SITE_CONFIG.author,
  keywords: [
    'music player',
    'streaming musik',
    'youtube music',
    'lirik lagu',
    'omni player',
    'omni player music',
    'pemutar musik online',
    'gratis',
  ],
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '512x512' }],
    shortcut: '/icon.png',
    apple: [{ url: '/icon.png', sizes: '512x512' }],
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} — Premium Music Player`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} Logo`,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} — Premium Music Player`,
    description: SITE_CONFIG.description,
    images: ['/logo.png'],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#ff2d55',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta
          name="apple-mobile-web-app-title"
          content={SITE_CONFIG.shortName}
        />
        <meta name="msapplication-TileColor" content="#ff2d55" />
        <meta name="msapplication-TileImage" content="/icon.png" />
      </head>
      <body className={inter.className}>
        <LoadingScreen />
        <Navbar />
        <main className="min-h-screen pt-20 pb-28">{children}</main>
        <GlobalPlayer />
      </body>
    </html>
  )
}
