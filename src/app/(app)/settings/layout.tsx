/**
 * Settings Layout
 * Shared layout with tab navigation for settings pages
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Library,
  Settings2,
  Wrench,
  Trash2,
  Info,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBooks, getBinBooks } from '@/lib/repositories/books';
import { analyzeLibraryHealth, getBooksWithIssues } from '@/lib/utils/library-health';

// Tab navigation items
const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', href: '/settings/profile', icon: User },
  { id: 'library', label: 'Library', href: '/settings/library', icon: Library },
  { id: 'preferences', label: 'Preferences', href: '/settings/preferences', icon: Settings2 },
  { id: 'maintenance', label: 'Maintenance', href: '/settings/maintenance', icon: Wrench },
  { id: 'bin', label: 'Bin', href: '/settings/bin', icon: Trash2 },
  { id: 'about', label: 'About', href: '/settings/about', icon: Info },
];

type Props = {
  children: React.ReactNode;
};

export default function SettingsLayout({ children }: Props) {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const [binCount, setBinCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);

  // Determine active tab
  const getActiveTab = () => {
    const tab = SETTINGS_TABS.find((t) => pathname.startsWith(t.href));
    return tab?.id || 'profile';
  };

  const activeTab = getActiveTab();

  // Load counts for badges
  const loadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [books, binBooks] = await Promise.all([
        getBooks(user.uid),
        getBinBooks(user.uid),
      ]);
      setBinCount(binBooks.length);

      const report = analyzeLibraryHealth(books);
      const booksWithIssues = getBooksWithIssues(report);
      setIssueCount(booksWithIssues.length);
    } catch (err) {
      console.error('Failed to load counts:', err);
    }
  }, [user]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  return (
    <div>
      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200" aria-label="Settings navigation">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-px">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              // Badge count
              let count = 0;
              if (tab.id === 'maintenance' && issueCount > 0) {
                count = issueCount;
              } else if (tab.id === 'bin' && binCount > 0) {
                count = binCount;
              }

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`min-w-[1.25rem] h-5 px-1.5 text-xs font-medium rounded-full flex items-center justify-center ${
                        tab.id === 'maintenance'
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {children}
    </div>
  );
}
