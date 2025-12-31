import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ServiceWorkerRegister } from '@/components/service-worker-register';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MyShelfControl',
    template: '%s | MyShelfControl',
  },
  description: 'Track your reading journey. Organise your book collection with ease.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MyShelfControl',
  },
  openGraph: {
    type: 'website',
    siteName: 'MyShelfControl',
    title: 'MyShelfControl',
    description: 'Track your reading journey. Organise your book collection with ease.',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen`}>
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
