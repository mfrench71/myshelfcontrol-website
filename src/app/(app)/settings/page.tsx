/**
 * Settings Page
 * User profile and app settings
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Library,
  Palette,
  Wrench,
  Info,
  Trash2,
  ChevronRight,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBooks, getBinBooks } from '@/lib/repositories/books';
import { analyzeLibraryHealth, getBooksWithIssues } from '@/lib/utils/library-health';

// Settings menu items
const SETTINGS_SECTIONS = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Manage your account details',
    icon: User,
    href: '/settings/profile',
  },
  {
    id: 'library',
    label: 'Library',
    description: 'Genres, series, and backup',
    icon: Library,
    href: '/settings/library',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Sync and display settings',
    icon: Palette,
    href: '/settings/preferences',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    description: 'Data cleanup and fixes',
    icon: Wrench,
    href: '/settings/maintenance',
  },
  {
    id: 'bin',
    label: 'Recycle Bin',
    description: 'Deleted books (30 days)',
    icon: Trash2,
    href: '/settings/bin',
  },
  {
    id: 'about',
    label: 'About',
    description: 'Version info and changelog',
    icon: Info,
    href: '/settings/about',
  },
];

/**
 * Delete session cookie
 */
async function deleteSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });
    return response.ok;
  } catch {
    console.error('Failed to delete session');
    return false;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [binCount, setBinCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);

  // Load counts
  const loadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [books, binBooks] = await Promise.all([
        getBooks(user.uid),
        getBinBooks(user.uid),
      ]);
      setBinCount(binBooks.length);

      // Analyse library health to get issue count
      const report = analyzeLibraryHealth(books);
      const booksWithIssues = getBooksWithIssues(report);
      setIssueCount(booksWithIssues.length);
    } catch (err) {
      console.error('Failed to load counts:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadCounts();
    }
  }, [user, authLoading, loadCounts]);

  const handleLogout = async () => {
    setLoggingOut(true);
    setError(null);

    try {
      await signOut(auth);
      await deleteSession();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Failed to log out:', err);
      setError('Failed to log out. Please try again.');
      setLoggingOut(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* User Info */}
      {user && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.email}</p>
              <p className="text-sm text-gray-500">Signed in</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-3 mb-6">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          // Get count for sections that need badges
          let count = 0;
          let badgeColour = '';
          if (section.id === 'maintenance' && issueCount > 0) {
            count = issueCount;
            badgeColour = 'bg-amber-100 text-amber-700';
          } else if (section.id === 'bin' && binCount > 0) {
            count = binCount;
            badgeColour = 'bg-gray-100 text-gray-600';
          }

          return (
            <Link
              key={section.id}
              href={section.href}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-gray-600" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{section.label}</p>
                  {count > 0 && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColour}`}>
                      {count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
            </Link>
          );
        })}
      </div>

      {/* Log Out Button */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LogOut className="w-5 h-5" aria-hidden="true" />
        <span className="font-medium">{loggingOut ? 'Logging out...' : 'Log Out'}</span>
      </button>

      {/* App Version */}
      <p className="text-center text-xs text-gray-400 mt-6">
        MyShelfControl v0.1.0
      </p>
    </div>
  );
}
