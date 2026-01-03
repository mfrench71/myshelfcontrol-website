// Header Component - Main navigation header
// Matches the old site's header design with menu bottom sheet
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  WifiOff,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/modal';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getGravatarUrl } from '@/lib/utils';
import { SearchOverlay } from '@/components/ui/search-overlay';
import { getWishlist } from '@/lib/repositories/wishlist';

/** localStorage key for caching Gravatar availability per email hash */
const GRAVATAR_CACHE_KEY = 'gravatar_cache';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthContext();
  const [showMenu, setShowMenu] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Track online/offline status (must set initial state in effect to avoid hydration mismatch)
  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Fetch wishlist count
   */
  const loadWishlistCount = useCallback(async () => {
    if (!user) {
      setWishlistCount(0);
      return;
    }
    try {
      const items = await getWishlist(user.uid);
      setWishlistCount(items.length);
    } catch (err) {
      console.error('Failed to load wishlist count:', err);
    }
  }, [user]);

  // Load wishlist count on mount (data fetching pattern)
  useEffect(() => {
    loadWishlistCount();
  }, [loadWishlistCount]);

  // Reload wishlist count on visibility change and custom wishlist-updated events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadWishlistCount();
      }
    };

    // Listen for custom wishlist update events from other components
    const handleWishlistUpdate = () => {
      loadWishlistCount();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
    };
  }, [loadWishlistCount]);

  /**
   * Check if Gravatar exists for user email
   * Caches result in localStorage to avoid repeated requests
   */
  useEffect(() => {
    if (!user?.email || user.photoURL) {
      setGravatarUrl(null);
      return;
    }

    const email = user.email.toLowerCase().trim();

    // Check cache first
    try {
      const cache = JSON.parse(localStorage.getItem(GRAVATAR_CACHE_KEY) || '{}');
      if (cache[email] !== undefined) {
        setGravatarUrl(cache[email] || null);
        return;
      }
    } catch {
      // Ignore cache errors
    }

    // Check if Gravatar exists by loading the image
    const url = getGravatarUrl(email, 80);
    const img = new window.Image();

    img.onload = () => {
      setGravatarUrl(url);
      // Cache success
      try {
        const cache = JSON.parse(localStorage.getItem(GRAVATAR_CACHE_KEY) || '{}');
        cache[email] = url;
        localStorage.setItem(GRAVATAR_CACHE_KEY, JSON.stringify(cache));
      } catch {
        // Ignore cache errors
      }
    };

    img.onerror = () => {
      setGravatarUrl(null);
      // Cache failure
      try {
        const cache = JSON.parse(localStorage.getItem(GRAVATAR_CACHE_KEY) || '{}');
        cache[email] = '';
        localStorage.setItem(GRAVATAR_CACHE_KEY, JSON.stringify(cache));
      } catch {
        // Ignore cache errors
      }
    };

    img.src = url;
  }, [user?.email, user?.photoURL]);

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      setShowMenu(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  /**
   * Close desktop menu with animation
   */
  const closeDesktopMenu = useCallback(() => {
    setMenuClosing(true);
    setTimeout(() => {
      setShowMenu(false);
      setMenuClosing(false);
    }, 200); // Match animation duration
  }, []);

  /**
   * Close menu when clicking outside (desktop only)
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle on desktop (md+)
      if (window.innerWidth < 768) return;

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeDesktopMenu();
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, closeDesktopMenu]);

  /**
   * Close menu on escape key
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Use animated close on desktop
        if (window.innerWidth >= 768) {
          closeDesktopMenu();
        } else {
          setShowMenu(false);
        }
      }
    };

    if (showMenu) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMenu, closeDesktopMenu]);

  /**
   * Get user initials for avatar
   */
  const getUserInitial = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  /**
   * Get user avatar (photo, Gravatar, or initial)
   */
  const renderAvatar = (size: 'sm' | 'md') => {
    const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
    const pixelSize = size === 'sm' ? 40 : 48;

    // Priority: 1. photoURL, 2. Gravatar, 3. Initial
    const avatarUrl = user?.photoURL || gravatarUrl;

    if (avatarUrl) {
      return (
        <Image
          src={avatarUrl}
          alt=""
          width={pixelSize}
          height={pixelSize}
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

  // Simple header for unauthenticated users (e.g., on privacy page)
  if (!user) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 h-14">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-gray-900">MyShelfControl</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Login
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-center text-sm py-1 px-4">
          <span className="inline-flex items-center gap-1">
            <WifiOff className="w-4 h-4" aria-hidden="true" />
            You&apos;re offline - viewing cached data
          </span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 h-14">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">MyShelfControl</span>
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
              onClick={() => setShowSearch(true)}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Search books"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            </button>

            {/* Menu button */}
            <button
              onClick={() => setShowMenu(true)}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Bottom Sheet */}
      <BottomSheet
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title="Menu"
        className="md:hidden"
      >
        <div className="p-6 pt-2">
          {/* User info */}
          {user && (
            <div className="flex items-center gap-3 mb-4">
              {renderAvatar('md')}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">MyShelfControl</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                router.push('/wishlist');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[44px] transition-colors text-left ${
                pathname.startsWith('/wishlist') ? 'text-primary dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              <Heart className="w-5 h-5 text-pink-500" aria-hidden="true" />
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="ml-auto bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 text-xs font-medium px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                router.push('/settings');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[44px] transition-colors text-left ${
                pathname.startsWith('/settings') ? 'text-primary dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              <span>Settings</span>
            </button>

            {user && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left text-red-600 dark:text-red-400 min-h-[44px] transition-colors disabled:opacity-50"
              >
                {loggingOut ? (
                  <>
                    <span className="w-5 h-5 border-2 border-red-300 dark:border-red-700 border-t-red-600 dark:border-t-red-400 rounded-full animate-spin" />
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
      </BottomSheet>

      {/* Desktop Menu Overlay */}
      {showMenu && (
        <div
          className="hidden md:block fixed inset-0 bg-black/50 z-50"
          style={{ animation: menuClosing ? 'fadeOut 0.2s ease-in forwards' : 'fadeIn 0.2s ease-out' }}
          onClick={closeDesktopMenu}
        >
          {/* Desktop: Slide-out panel */}
          <div
            ref={menuRef}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl"
            style={{ animation: menuClosing ? 'slideOutRight 0.2s ease-in forwards' : 'slideInRight 0.25s ease-out forwards' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                {user && (
                  <div className="flex items-center gap-3">
                    {renderAvatar('sm')}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">MyShelfControl</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={closeDesktopMenu}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <nav className="p-2">
              <button
                type="button"
                onClick={() => {
                  closeDesktopMenu();
                  router.push('/wishlist');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[44px] transition-colors text-left ${
                  pathname.startsWith('/wishlist') ? 'text-primary dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                <Heart className="w-5 h-5 text-pink-500" aria-hidden="true" />
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="ml-auto bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 text-xs font-medium px-2 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  closeDesktopMenu();
                  router.push('/settings');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[44px] transition-colors text-left ${
                  pathname.startsWith('/settings') ? 'text-primary dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                <span>Settings</span>
              </button>

              <hr className="my-2 dark:border-gray-700" />

              {user && (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left text-red-600 dark:text-red-400 min-h-[44px] transition-colors disabled:opacity-50"
                >
                  {loggingOut ? (
                    <>
                      <span className="w-5 h-5 border-2 border-red-300 dark:border-red-700 border-t-red-600 dark:border-t-red-400 rounded-full animate-spin" />
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

      {/* Search Overlay */}
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
