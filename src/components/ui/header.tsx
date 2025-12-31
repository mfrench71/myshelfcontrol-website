// Header Component - Main navigation header
// Matches the old site's header design with menu bottom sheet
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import {
  BookOpen,
  Search,
  Menu,
  X,
  Library,
  Heart,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [showMenu, setShowMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      setShowMenu(false);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  /**
   * Close menu when clicking outside (desktop)
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  /**
   * Close menu on escape key
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMenu]);

  /**
   * Get user initials for avatar
   */
  const getUserInitial = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  /**
   * Get user avatar (photo or initial)
   */
  const renderAvatar = (size: 'sm' | 'md') => {
    const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
    const textSize = size === 'sm' ? 'text-sm' : 'text-lg';

    if (user?.photoURL) {
      return (
        <Image
          src={user.photoURL}
          alt=""
          width={size === 'sm' ? 40 : 48}
          height={size === 'sm' ? 40 : 48}
          className={`${sizeClasses} rounded-full object-cover`}
        />
      );
    }

    return (
      <div
        className={`${sizeClasses} bg-primary rounded-full flex items-center justify-center text-white font-bold`}
      >
        {getUserInitial()}
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 h-14">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-gray-900">MyShelfControl</span>
          </Link>

          {/* Right side buttons */}
          <div className="flex items-center gap-1">
            {/* My Library button */}
            <Link
              href="/books"
              className={`p-2 sm:px-4 sm:py-2 rounded-lg transition-colors inline-flex items-center gap-2 ${
                pathname.startsWith('/books')
                  ? 'bg-primary-dark text-white'
                  : 'bg-primary hover:bg-primary-dark text-white'
              }`}
              aria-label="View My Library"
            >
              <Library className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="hidden sm:inline text-sm">My Library</span>
            </Link>

            {/* Search button */}
            <button
              className="p-2.5 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Search books"
            >
              <Search className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </button>

            {/* Menu button */}
            <button
              onClick={() => setShowMenu(true)}
              className="p-2.5 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Menu Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowMenu(false)}
        >
          {/* Mobile: Bottom sheet */}
          <div
            ref={menuRef}
            className="md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4 md:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 mb-4">
                {renderAvatar('md')}
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500">MyShelfControl</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="space-y-1">
              <Link
                href="/wishlist"
                onClick={() => setShowMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg min-h-[44px] transition-colors ${
                  pathname.startsWith('/wishlist') ? 'text-primary font-medium' : ''
                }`}
              >
                <Heart className="w-5 h-5 text-pink-500" aria-hidden="true" />
                <span>Wishlist</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setShowMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg min-h-[44px] transition-colors ${
                  pathname.startsWith('/settings') ? 'text-primary font-medium' : ''
                }`}
              >
                <Settings className="w-5 h-5 text-gray-600" aria-hidden="true" />
                <span>Settings</span>
              </Link>

              {user && (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg text-left text-red-600 min-h-[44px] transition-colors disabled:opacity-50"
                >
                  {loggingOut ? (
                    <>
                      <span className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" aria-hidden="true" />
                      <span>Sign Out</span>
                    </>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Desktop: Slide-out panel */}
          <div
            ref={menuRef}
            className="hidden md:block absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {user && (
                  <div className="flex items-center gap-3">
                    {renderAvatar('sm')}
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500">MyShelfControl</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2.5 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <nav className="p-2">
              <Link
                href="/wishlist"
                onClick={() => setShowMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg min-h-[44px] transition-colors ${
                  pathname.startsWith('/wishlist') ? 'text-primary font-medium' : ''
                }`}
              >
                <Heart className="w-5 h-5 text-pink-500" aria-hidden="true" />
                <span>Wishlist</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setShowMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg min-h-[44px] transition-colors ${
                  pathname.startsWith('/settings') ? 'text-primary font-medium' : ''
                }`}
              >
                <Settings className="w-5 h-5 text-gray-600" aria-hidden="true" />
                <span>Settings</span>
              </Link>

              <hr className="my-2" />

              {user && (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg text-left text-red-600 min-h-[44px] transition-colors disabled:opacity-50"
                >
                  {loggingOut ? (
                    <>
                      <span className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" aria-hidden="true" />
                      <span>Sign Out</span>
                    </>
                  )}
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
