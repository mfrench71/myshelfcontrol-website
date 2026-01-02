/**
 * Settings Layout
 * Mobile: Breadcrumb navigation with back to hub
 * Desktop: Persistent sidebar with content area
 */
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Library,
  Settings2,
  Wrench,
  Trash2,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getBooks, getBinBooks } from '@/lib/repositories/books';
import { analyzeLibraryHealth, getBooksWithIssues } from '@/lib/utils/library-health';
import { SettingsSidebarLink } from '@/components/ui/settings-hub-card';

// Settings sections configuration
const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile', href: '/settings/profile', icon: User },
  { id: 'library', label: 'Library', href: '/settings/library', icon: Library },
  { id: 'preferences', label: 'Preferences', href: '/settings/preferences', icon: Settings2 },
  { id: 'maintenance', label: 'Maintenance', href: '/settings/maintenance', icon: Wrench, badgeVariant: 'warning' as const },
  { id: 'bin', label: 'Bin', href: '/settings/bin', icon: Trash2, badgeVariant: 'danger' as const },
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

  // Determine active section
  const getActiveSection = () => {
    // Check if we're on the hub page
    if (pathname === '/settings') return null;
    const section = SETTINGS_SECTIONS.find((s) => pathname.startsWith(s.href));
    return section?.id || null;
  };

  const activeSection = getActiveSection();
  const activeSectionInfo = SETTINGS_SECTIONS.find((s) => s.id === activeSection);

  // Check if we're on a sub-page (not the hub)
  const isSubPage = pathname !== '/settings';

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

    // Listen for update events from other components
    const handleBinUpdate = () => loadCounts();
    const handleLibraryUpdate = () => loadCounts();

    window.addEventListener('bin-updated', handleBinUpdate);
    window.addEventListener('library-updated', handleLibraryUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener('bin-updated', handleBinUpdate);
      window.removeEventListener('library-updated', handleLibraryUpdate);
    };
  }, [user]);

  // Get badge count for a section
  const getBadgeCount = (sectionId: string): number | undefined => {
    if (sectionId === 'maintenance' && issueCount > 0) return issueCount;
    if (sectionId === 'bin' && binCount > 0) return binCount;
    return undefined;
  };

  return (
    <div className="min-h-[calc(100vh-56px)]">
      {/* Mobile: Breadcrumb/Back Navigation (hidden on desktop) */}
      {isSubPage && (
        <div className="md:hidden bg-white border-b border-gray-200 sticky top-14 z-30">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center min-h-[52px]">
            <Link
              href="/settings"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span>Settings</span>
            </Link>
            {activeSectionInfo && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1" aria-hidden="true" />
                <span className="text-sm text-gray-900 font-medium">
                  {activeSectionInfo.label}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Desktop: Sidebar + Content Layout */}
      <div className="max-w-6xl mx-auto md:flex md:gap-6 md:px-4 md:py-6">
        {/* Desktop Sidebar (hidden on mobile) */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-[120px]">
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-3">Settings</h2>
            <nav className="space-y-1" aria-label="Settings navigation">
              {SETTINGS_SECTIONS.map((section) => (
                <SettingsSidebarLink
                  key={section.id}
                  icon={section.icon}
                  title={section.label}
                  href={section.href}
                  badge={getBadgeCount(section.id)}
                  badgeVariant={section.badgeVariant}
                  isActive={activeSection === section.id}
                />
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
