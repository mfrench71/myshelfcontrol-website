/**
 * Settings Hub Page
 * Mobile: Shows hub with cards for each settings section
 * Desktop: Redirects to /settings/profile (sidebar handles navigation)
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Library, Settings2, Wrench, Trash2, Info } from 'lucide-react';
import { SettingsHubCard } from '@/components/ui/settings-hub-card';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBooks, getBinBooks } from '@/lib/repositories/books';
import { analyzeLibraryHealth, getBooksWithIssues } from '@/lib/utils/library-health';
import { useState } from 'react';

// Settings sections configuration
const SETTINGS_SECTIONS = [
  {
    id: 'profile',
    title: 'Profile',
    description: 'Account, email, password',
    href: '/settings/profile',
    icon: User,
  },
  {
    id: 'library',
    title: 'Library',
    description: 'Genres, series, backup & restore',
    href: '/settings/library',
    icon: Library,
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Widgets, sync, cache',
    href: '/settings/preferences',
    icon: Settings2,
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    description: 'Fix issues in your library',
    href: '/settings/maintenance',
    icon: Wrench,
    badgeVariant: 'warning' as const,
  },
  {
    id: 'bin',
    title: 'Bin',
    description: 'Deleted books (30-day restore)',
    href: '/settings/bin',
    icon: Trash2,
    badgeVariant: 'danger' as const,
  },
  {
    id: 'about',
    title: 'About',
    description: 'Version, changelog, credits',
    href: '/settings/about',
    icon: Info,
  },
];

export default function SettingsHubPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [binCount, setBinCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);

  // On desktop, redirect to profile (sidebar handles navigation)
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) {
      router.replace('/settings/profile');
    }
  }, [router]);

  // Load counts for badges
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadCounts() {
      try {
        const [books, binBooks] = await Promise.all([
          getBooks(user!.uid),
          getBinBooks(user!.uid),
        ]);
        if (cancelled) return;
        setBinCount(binBooks.length);

        const report = analyzeLibraryHealth(books);
        const booksWithIssues = getBooksWithIssues(report);
        setIssueCount(booksWithIssues.length);
      } catch (err) {
        console.error('Failed to load counts:', err);
      }
    }

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Get badge count for a section
  const getBadgeCount = (sectionId: string): number | undefined => {
    if (sectionId === 'maintenance' && issueCount > 0) return issueCount;
    if (sectionId === 'bin' && binCount > 0) return binCount;
    return undefined;
  };

  return (
    <div className="md:hidden">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>

        <div className="space-y-3">
          {SETTINGS_SECTIONS.map((section) => (
            <SettingsHubCard
              key={section.id}
              icon={section.icon}
              title={section.title}
              description={section.description}
              href={section.href}
              badge={getBadgeCount(section.id)}
              badgeVariant={section.badgeVariant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
