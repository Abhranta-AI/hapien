import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hapien.com'),
  title: {
    default: 'Hapien - The Happy Sapien Network',
    template: '%s | Hapien',
  },
  description:
    'Hapien is a private, hyperlocal social network that nurtures connections within built communities through recurring hangouts.',
  keywords: [
    'social network',
    'community',
    'friends',
    'hangouts',
    'local',
    'connections',
  ],
  authors: [{ name: 'Alok Gautam', url: 'mailto:alok@abhranta.com' }],
  creator: 'Hapien',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://hapien.com',
    siteName: 'Hapien',
    title: 'Hapien - The Happy Sapien Network',
    description:
      'A private, hyperlocal social network that nurtures connections through shared experiences.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hapien - The Happy Sapien Network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hapien - The Happy Sapien Network',
    description:
      'A private, hyperlocal social network that nurtures connections through shared experiences.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#5d146f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#323232',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '12px 16px',
              border: '1px solid #464646',
            },
            success: {
              iconTheme: {
                primary: '#727ef5',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#aa31ac',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
