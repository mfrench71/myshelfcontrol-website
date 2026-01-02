import type { NextConfig } from "next";

// Generate build date version (DD.MM.YYYY format - UK style)
const buildDate = new Date();
const BUILD_VERSION = `${String(buildDate.getDate()).padStart(2, '0')}.${String(buildDate.getMonth() + 1).padStart(2, '0')}.${buildDate.getFullYear()}`;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_VERSION: BUILD_VERSION,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'books.google.com',
        pathname: '/books/**',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/b/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/**',
      },
    ],
  },
};

export default nextConfig;
