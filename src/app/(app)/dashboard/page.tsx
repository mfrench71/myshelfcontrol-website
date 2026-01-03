/**
 * Dashboard Page - User's book library dashboard with widgets
 * Displays reading stats, currently reading, recently added, and more
 * Protected route - unauthenticated users are redirected by middleware
 */
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  ChevronRight,
  Star,
  CheckCircle,
  Library,
  TrendingUp,
  X,
  Loader2,
  Mail,
  Heart,
  PlusCircle,
} from 'lucide-react';
import { BookCover } from '@/components/ui/book-cover';
import { sendEmailVerification } from 'firebase/auth';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { getBooks } from '@/lib/repositories/books';
import { getSeries } from '@/lib/repositories/series';
import { getWishlist } from '@/lib/repositories/wishlist';
import {
  loadWidgetSettings,
  getEnabledWidgets,
} from '@/lib/repositories/widget-settings';
import type { Book, Series, WishlistItem } from '@/lib/types';
import type { WidgetConfig } from '@/lib/types/widgets';

/** Sync settings stored in localStorage */
type SyncSettings = {
  autoRefreshEnabled: boolean;
  hiddenThreshold: number; // seconds before auto-refresh triggers
  cooldownPeriod: number; // minimum seconds between refreshes
};

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoRefreshEnabled: true,
  hiddenThreshold: 60,
  cooldownPeriod: 300,
};

const SYNC_SETTINGS_KEY = 'bookassembly_sync_settings';

/** Load sync settings from localStorage */
function loadSyncSettings(): SyncSettings {
  if (typeof window === 'undefined') return DEFAULT_SYNC_SETTINGS;
  try {
    const stored = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SYNC_SETTINGS;
}

/**
 * Get reading status from book's reads array
 */
function getBookStatus(book: Book): 'want-to-read' | 'reading' | 'finished' {
  const reads = book.reads || [];
  if (reads.length === 0) return 'want-to-read';
  const latestRead = reads[reads.length - 1];
  if (latestRead.finishedAt) return 'finished';
  if (latestRead.startedAt) return 'reading';
  return 'want-to-read';
}

/**
 * Horizontal scrolling book cover card (matches old site)
 */
function HorizontalBookCard({ book, href, priority }: { book: Book; href: string; priority?: boolean }) {
  return (
    <Link href={href} className="flex-shrink-0 w-24 snap-start">
      <BookCover
        src={book.coverImageUrl}
        alt={book.title}
        width={96}
        height={144}
        className="w-24 h-36 rounded-lg shadow-cover overflow-hidden"
        priority={priority}
      />
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 line-clamp-2">{book.title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author || 'Unknown'}</p>
    </Link>
  );
}

/**
 * Widget container with header (matches old site)
 */
function WidgetContainer({
  icon: Icon,
  iconColor,
  title,
  seeAllLink,
  seeAllParams,
  emptyMessage,
  isEmpty,
  children,
  size = 12,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  seeAllLink?: string;
  seeAllParams?: Record<string, string>;
  emptyMessage?: string;
  isEmpty?: boolean;
  children: React.ReactNode;
  size?: number;
}) {
  const seeAllHref = seeAllLink
    ? seeAllParams
      ? `${seeAllLink}?${new URLSearchParams(seeAllParams).toString()}`
      : seeAllLink
    : null;

  return (
    <div className={`widget-col-${size} bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        {seeAllHref && !isEmpty && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 text-sm text-primary dark:text-blue-400 hover:underline"
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {/* Content */}
      {isEmpty ? (
        <div className="p-6 text-center">
          <Icon className={`w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto`} aria-hidden="true" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * Horizontal scroll container (matches old site widget-scroll-container)
 */
function HorizontalScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-4 overflow-x-auto overflow-y-hidden p-4 snap-x snap-mandatory no-scrollbar scroll-pl-4">
      {children}
    </div>
  );
}

/**
 * Widget skeleton for loading state
 */
function WidgetSkeleton({ size = 12 }: { size?: number }) {
  return (
    <div className={`widget-col-${size} bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse`}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-24 h-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
              <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Welcome Widget - Library stats
 */
function WelcomeWidget({
  totalBooks,
  currentlyReading,
  finishedThisYear,
  size = 12,
}: {
  totalBooks: number;
  currentlyReading: number;
  finishedThisYear: number;
  size?: number;
}) {
  return (
    <div className={`widget-col-${size} bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-6`}>
      <h2 className="text-xl font-bold mb-4">Your Library</h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <div>
          <p className="text-3xl font-bold">{totalBooks}</p>
          <p className="text-sm text-white/80">Books</p>
        </div>
        <div>
          <p className="text-3xl font-bold">{currentlyReading}</p>
          <p className="text-sm text-white/80">Reading</p>
        </div>
        <div>
          <p className="text-3xl font-bold">{finishedThisYear}</p>
          <p className="text-sm text-white/80">This Year</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Currently Reading Widget
 */
function CurrentlyReadingWidget({ books, config }: { books: Book[]; config: WidgetConfig }) {
  const count = (config.settings?.count as number) || 6;
  const displayBooks = books.slice(0, count);

  return (
    <WidgetContainer
      icon={BookOpen}
      iconColor="text-blue-600"
      title="Currently Reading"
      seeAllLink="/books"
      seeAllParams={{ status: 'reading' }}
      emptyMessage="No books currently being read"
      isEmpty={books.length === 0}
      size={config.size || 6}
    >
      <HorizontalScroll>
        {displayBooks.map((book, index) => (
          <HorizontalBookCard key={book.id} book={book} href={`/books/${book.id}`} priority={index < 4} />
        ))}
      </HorizontalScroll>
    </WidgetContainer>
  );
}

/**
 * Recently Added Widget
 */
function RecentlyAddedWidget({ books, config }: { books: Book[]; config: WidgetConfig }) {
  const count = (config.settings?.count as number) || 6;
  const displayBooks = books.slice(0, count);

  if (books.length === 0) return null;

  return (
    <WidgetContainer
      icon={PlusCircle}
      iconColor="text-green-600"
      title="Recently Added"
      seeAllLink="/books"
      seeAllParams={{ sort: 'createdAt-desc' }}
      size={config.size || 12}
    >
      <HorizontalScroll>
        {displayBooks.map((book, index) => (
          <HorizontalBookCard key={book.id} book={book} href={`/books/${book.id}`} priority={index < 4} />
        ))}
      </HorizontalScroll>
    </WidgetContainer>
  );
}

/**
 * Top Rated Widget
 */
function TopRatedWidget({ books, config }: { books: Book[]; config: WidgetConfig }) {
  const count = (config.settings?.count as number) || 6;
  const displayBooks = books.slice(0, count);

  if (books.length === 0) return null;

  return (
    <WidgetContainer
      icon={Star}
      iconColor="text-yellow-500"
      title="Top Rated"
      seeAllLink="/books"
      seeAllParams={{ sort: 'rating-desc' }}
      size={config.size || 6}
    >
      <HorizontalScroll>
        {displayBooks.map((book, index) => (
          <Link key={book.id} href={`/books/${book.id}`} className="flex-shrink-0 w-24 snap-start">
            <BookCover
              src={book.coverImageUrl}
              alt={book.title}
              width={96}
              height={144}
              className="w-24 h-36 rounded-lg shadow-md overflow-hidden"
              priority={index < 4}
            />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 line-clamp-2">{book.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author || 'Unknown'}</p>
            {book.rating != null && book.rating > 0 && (
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${star <= book.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            )}
          </Link>
        ))}
      </HorizontalScroll>
    </WidgetContainer>
  );
}

/**
 * Recently Finished Widget
 */
function RecentlyFinishedWidget({ books, config }: { books: Book[]; config: WidgetConfig }) {
  const count = (config.settings?.count as number) || 6;
  const displayBooks = books.slice(0, count);

  if (books.length === 0) return null;

  return (
    <WidgetContainer
      icon={CheckCircle}
      iconColor="text-green-600"
      title="Recently Finished"
      seeAllLink="/books"
      seeAllParams={{ status: 'finished' }}
      size={config.size || 6}
    >
      <HorizontalScroll>
        {displayBooks.map((book, index) => (
          <HorizontalBookCard key={book.id} book={book} href={`/books/${book.id}`} priority={index < 4} />
        ))}
      </HorizontalScroll>
    </WidgetContainer>
  );
}

/**
 * Wishlist Widget
 */
function WishlistWidget({ items, config }: { items: WishlistItem[]; config: WidgetConfig }) {
  const count = (config.settings?.count as number) || 6;
  const displayItems = items.slice(0, count);

  return (
    <WidgetContainer
      icon={Heart}
      iconColor="text-pink-500"
      title="Wishlist"
      seeAllLink="/wishlist"
      emptyMessage="No books on your wishlist"
      isEmpty={items.length === 0}
      size={config.size || 6}
    >
      <HorizontalScroll>
        {displayItems.map((item, index) => (
          <Link key={item.id} href="/wishlist" className="flex-shrink-0 w-24 snap-start">
            <BookCover
              src={item.coverImageUrl}
              alt={item.title}
              width={96}
              height={144}
              className="w-24 h-36 rounded-lg shadow-md overflow-hidden"
              priority={index < 4}
            />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2 line-clamp-2">{item.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.author || 'Unknown'}</p>
          </Link>
        ))}
      </HorizontalScroll>
    </WidgetContainer>
  );
}

/**
 * Series Progress Widget
 */
function SeriesProgressWidget({
  series,
  booksBySeries,
  config,
}: {
  series: Series[];
  booksBySeries: Record<string, Book[]>;
  config: WidgetConfig;
}) {
  const count = (config.settings?.count as number) || 4;
  const activeSeries = series.filter((s) => booksBySeries[s.id]?.length > 0).slice(0, count);

  if (activeSeries.length === 0) return null;

  return (
    <WidgetContainer
      icon={Library}
      iconColor="text-purple-600"
      title="Series Progress"
      seeAllLink="/books"
      size={config.size || 6}
    >
      <div className="p-4 space-y-3">
        {activeSeries.map((s) => {
          const booksInSeries = booksBySeries[s.id] || [];
          const totalBooks = s.totalBooks || booksInSeries.length;
          const percentage = totalBooks > 0 ? Math.round((booksInSeries.length / totalBooks) * 100) : 0;
          return (
            <Link
              key={s.id}
              href={`/books?series=${s.id}`}
              className="block p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {booksInSeries.length}/{totalBooks}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </WidgetContainer>
  );
}

/**
 * Email Verification Banner
 */
function EmailVerificationBanner({
  user,
  onDismiss,
}: {
  user: { email: string | null; emailVerified: boolean };
  onDismiss: () => void;
}) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setIsSending(true);
    setError(null);
    try {
      const { auth } = await import('@/lib/firebase/client');
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setSent(true);
      }
    } catch (err) {
      console.error('Failed to send verification email:', err);
      setError('Failed to send. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-amber-800 dark:text-amber-200 font-medium">Please verify your email address</p>
          <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
            We sent a verification link to <strong>{user.email}</strong>. Check your inbox.
          </p>
          {error && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>}
          {sent ? (
            <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Verification email sent!
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isSending}
              className="mt-2 text-sm text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 underline disabled:opacity-50 inline-flex items-center gap-1"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend verification email'
              )}
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Dismiss verification banner"
        >
          <X className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

const BANNER_DISMISSED_KEY = 'email-verification-banner-dismissed';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(true);

  // Auto-refresh tracking refs
  const hiddenAtRef = useRef<number | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
      setBannerDismissed(dismissed);
    }
  }, []);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    }
  };

  const showVerificationBanner = user && !user.emailVerified && !bannerDismissed;

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [userBooks, userSeries, userWishlist, userWidgets] = await Promise.all([
        getBooks(user.uid),
        getSeries(user.uid),
        getWishlist(user.uid),
        loadWidgetSettings(user.uid),
      ]);
      setBooks(userBooks);
      setSeries(userSeries);
      setWishlistItems(userWishlist);
      setWidgetConfigs(userWidgets);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, loadData]);

  // Visibility-based auto-sync with settings support
  // Uses both visibilitychange (for tab switches) and focus (for app switches)
  useEffect(() => {
    if (!user) return;

    const checkAndRefresh = async () => {
      if (!hiddenAtRef.current) return;

      const settings = loadSyncSettings();
      if (!settings.autoRefreshEnabled) {
        hiddenAtRef.current = null;
        return;
      }

      const now = Date.now();
      const hiddenDuration = (now - hiddenAtRef.current) / 1000;
      const timeSinceLastRefresh = (now - lastRefreshRef.current) / 1000;

      if (hiddenDuration >= settings.hiddenThreshold && timeSinceLastRefresh >= settings.cooldownPeriod) {
        try {
          const [userBooks, userSeries, userWishlist, userWidgets] = await Promise.all([
            getBooks(user.uid),
            getSeries(user.uid),
            getWishlist(user.uid),
            loadWidgetSettings(user.uid),
          ]);
          setBooks(userBooks);
          setSeries(userSeries);
          setWishlistItems(userWishlist);
          setWidgetConfigs(userWidgets);
          lastRefreshRef.current = Date.now();
          showToast('Dashboard refreshed', { type: 'success' });
        } catch (err) {
          console.error('Failed to auto-refresh:', err);
        }
      }

      hiddenAtRef.current = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        checkAndRefresh();
      }
    };

    const handleFocus = () => {
      // Focus event fires when window gains focus (e.g., switching from another app)
      if (hiddenAtRef.current) {
        checkAndRefresh();
      }
    };

    const handleBlur = () => {
      // Blur event fires when window loses focus
      if (!hiddenAtRef.current) {
        hiddenAtRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user, showToast]);

  const enabledWidgets = useMemo(() => getEnabledWidgets(widgetConfigs), [widgetConfigs]);

  const {
    currentlyReading,
    recentlyAdded,
    topRated,
    recentlyFinished,
    finishedThisYear,
    booksBySeries,
  } = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const currentlyReading: Book[] = [];
    const finished: Book[] = [];
    let finishedThisYearCount = 0;

    books.forEach((book) => {
      const status = getBookStatus(book);
      if (status === 'reading') {
        currentlyReading.push(book);
      } else if (status === 'finished') {
        finished.push(book);
        const latestRead = book.reads?.[book.reads.length - 1];
        if (latestRead?.finishedAt) {
          const finishTime =
            typeof latestRead.finishedAt === 'number'
              ? latestRead.finishedAt
              : new Date(latestRead.finishedAt as string).getTime();
          if (finishTime >= startOfYear) {
            finishedThisYearCount++;
          }
        }
      }
    });

    const recentlyAdded = [...books]
      .sort((a, b) => {
        const aTime = a.createdAt
          ? typeof a.createdAt === 'number'
            ? a.createdAt
            : 'toMillis' in a.createdAt
              ? a.createdAt.toMillis()
              : 0
          : 0;
        const bTime = b.createdAt
          ? typeof b.createdAt === 'number'
            ? b.createdAt
            : 'toMillis' in b.createdAt
              ? b.createdAt.toMillis()
              : 0
          : 0;
        return bTime - aTime;
      });

    const topRated = books
      .filter((b) => b.rating != null && b.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const recentlyFinished = finished
      .sort((a, b) => {
        const aRead = a.reads?.[a.reads.length - 1];
        const bRead = b.reads?.[b.reads.length - 1];
        const aTime =
          aRead?.finishedAt
            ? typeof aRead.finishedAt === 'number'
              ? aRead.finishedAt
              : new Date(aRead.finishedAt as string).getTime()
            : 0;
        const bTime =
          bRead?.finishedAt
            ? typeof bRead.finishedAt === 'number'
              ? bRead.finishedAt
              : new Date(bRead.finishedAt as string).getTime()
            : 0;
        return bTime - aTime;
      });

    const booksBySeries: Record<string, Book[]> = {};
    books.forEach((book) => {
      if (book.seriesId) {
        if (!booksBySeries[book.seriesId]) {
          booksBySeries[book.seriesId] = [];
        }
        booksBySeries[book.seriesId].push(book);
      }
    });

    return {
      currentlyReading,
      recentlyAdded,
      topRated,
      recentlyFinished,
      finishedThisYear: finishedThisYearCount,
      booksBySeries,
    };
  }, [books]);

  // Show loading skeletons while auth or data is loading
  if (authLoading || loading) {
    return (
      <div id="loading-state" className="max-w-6xl mx-auto px-4 py-6 pb-24">
        <h1 className="sr-only">Book Assembly Dashboard</h1>
        <div className="widget-grid">
          <WidgetSkeleton size={12} />
          <WidgetSkeleton size={6} />
          <WidgetSkeleton size={6} />
          <WidgetSkeleton size={12} />
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard" className="max-w-6xl mx-auto px-4 py-6 pb-24">
      <h1 className="sr-only">Book Assembly Dashboard</h1>

      {showVerificationBanner && (
        <EmailVerificationBanner user={user!} onDismiss={handleDismissBanner} />
      )}

      {/* Widget Grid (12-column responsive) */}
      <div className="widget-grid">
        {enabledWidgets.map((config) => {
          switch (config.id) {
            case 'welcome':
              return (
                <WelcomeWidget
                  key={config.id}
                  totalBooks={books.length}
                  currentlyReading={currentlyReading.length}
                  finishedThisYear={finishedThisYear}
                  size={config.size || 12}
                />
              );
            case 'currentlyReading':
              return (
                <CurrentlyReadingWidget
                  key={config.id}
                  books={currentlyReading}
                  config={config}
                />
              );
            case 'recentlyAdded':
              return recentlyAdded.length > 0 ? (
                <RecentlyAddedWidget
                  key={config.id}
                  books={recentlyAdded}
                  config={config}
                />
              ) : null;
            case 'topRated':
              return topRated.length > 0 ? (
                <TopRatedWidget
                  key={config.id}
                  books={topRated}
                  config={config}
                />
              ) : null;
            case 'wishlist':
              return (
                <WishlistWidget
                  key={config.id}
                  items={wishlistItems}
                  config={config}
                />
              );
            case 'recentlyFinished':
              return recentlyFinished.length > 0 ? (
                <RecentlyFinishedWidget
                  key={config.id}
                  books={recentlyFinished}
                  config={config}
                />
              ) : null;
            case 'seriesProgress':
              return series.length > 0 ? (
                <SeriesProgressWidget
                  key={config.id}
                  series={series}
                  booksBySeries={booksBySeries}
                  config={config}
                />
              ) : null;
            default:
              return null;
          }
        })}
      </div>

      {/* Empty State */}
      {books.length === 0 && (
        <div className="text-center py-12 mt-6">
          <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">Start Your Collection</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Add your first book to see your reading stats here.
          </p>
          <Link
            href="/books/add"
            className="inline-flex items-center gap-2 px-6 py-3 mt-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            Add Your First Book
          </Link>
        </div>
      )}

      {/* Floating Action Button */}
      <Link
        href="/books/add"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg flex items-center justify-center transition-all z-30 active:scale-[0.92] active:shadow-md"
        aria-label="Add book"
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </Link>
    </div>
  );
}
