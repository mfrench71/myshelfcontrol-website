// Footer Component - Site-wide footer
'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const version = process.env.NEXT_PUBLIC_BUILD_VERSION || 'dev';

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-500 text-sm">
        <span>© {currentYear} MyShelfControl</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-gray-400">v{version}</span>
        </div>
      </div>
    </footer>
  );
}
