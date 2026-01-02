import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { ServiceWorkerRegister } from '@/components/service-worker-register';

// Anti-flash script to set theme before React hydrates
// Forces light mode on public/auth pages and when not authenticated
const themeScript = `
  (function() {
    var path = window.location.pathname;
    var isPublicPage = path.startsWith('/login') || path.startsWith('/privacy');
    var isAuthenticated = document.cookie.indexOf('auth=') !== -1;

    // Force light mode for public pages or unauthenticated users on home
    if (isPublicPage || (path === '/' && !isAuthenticated)) {
      document.documentElement.classList.add('light');
      return;
    }

    var stored = localStorage.getItem('theme');
    var theme = stored || 'system';
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(resolved);
    var themeColor = resolved === 'dark' ? '#111827' : '#ffffff';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeColor);
  })();
`;

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://myshelfcontrol.app'
  ),
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
