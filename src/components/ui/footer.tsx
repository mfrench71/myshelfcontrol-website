// Footer Component - Site-wide footer
'use client';

import Link from 'next/link';
import { useAuthContext } from '@/components/providers/auth-provider';

export function Footer() {
  const { user } = useAuthContext();
  const currentYear = new Date().getFullYear();
  const version = process.env.NEXT_PUBLIC_BUILD_VERSION || 'dev';

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-500 dark:text-gray-300 text-sm">
        <span>© {currentYear} Book Assembly</span>
        <div className="flex items-center gap-4">
          <Link href={user ? '/settings/support' : '/support'} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Support
          </Link>
          <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Privacy Policy
          </Link>
          {user && (
            <Link href="/settings/about" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              v{version}
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
