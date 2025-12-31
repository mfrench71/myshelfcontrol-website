// Header Component - Main navigation header
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Search, Settings, User } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuthContext();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-primary font-semibold"
          >
            <BookOpen className="w-6 h-6" />
            <span className="hidden sm:inline">MyShelfControl</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link
              href="/books"
              className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                pathname.startsWith('/books')
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Books"
            >
              <BookOpen className="w-5 h-5" />
            </Link>

            <button
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/settings"
              className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                pathname.startsWith('/settings')
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* User avatar or login */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <Link
                href="/login"
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Login"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
