/**
 * Privacy Policy Page
 * Explains data collection, storage, and user rights
 * Shows links to settings pages only for logged-in users
 */
'use client';

import Link from 'next/link';
import { useAuthContext } from '@/components/providers/auth-provider';

/**
 * Conditionally render a link (logged in) or plain text (logged out)
 */
function ConditionalLink({
  href,
  children,
  isLoggedIn,
}: {
  href: string;
  children: React.ReactNode;
  isLoggedIn: boolean;
}) {
  if (isLoggedIn) {
    return (
      <Link href={href} className="text-primary dark:text-blue-400 hover:underline">
        {children}
      </Link>
    );
  }
  return <span className="font-medium">{children}</span>;
}

export default function PrivacyPage() {
  const { user } = useAuthContext();
  const isLoggedIn = !!user;

  return (
    <>
      {/* Sub-navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between min-h-[52px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center text-sm">
              <li className="flex items-center min-w-0">
                <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 hover:underline">
                  Home
                </Link>
              </li>
              <li className="mx-2 text-gray-400">/</li>
              <li className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">
                Privacy Policy
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 dark:text-gray-300 text-sm mb-8">Last updated: December 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Overview</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Book Assembly is a personal book tracking application. We are committed to protecting your privacy and
                being transparent about how we handle your data. This policy explains what information we collect, how
                we use it, and your rights regarding your data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Data We Collect</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                We collect only the data necessary to provide the service:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-6 list-disc">
                <li>
                  <strong>Account information:</strong> Email address and password (encrypted)
                </li>
                <li>
                  <strong>Book data:</strong> Books you add, including titles, authors, ISBNs, covers, genres, ratings,
                  notes, and reading dates
                </li>
                <li>
                  <strong>Wishlist data:</strong> Books you want to buy, including priority and notes
                </li>
                <li>
                  <strong>Organisation data:</strong> Custom genres and series you create
                </li>
                <li>
                  <strong>Preferences:</strong> Display settings and widget configurations
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">How We Store Your Data</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                Your data is stored securely using Google Firebase:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-6 list-disc">
                <li>
                  <strong>Authentication:</strong> Firebase Authentication handles login securely
                </li>
                <li>
                  <strong>Database:</strong> Cloud Firestore stores your books and settings
                </li>
                <li>
                  <strong>Image storage:</strong> Firebase Storage stores book images you upload
                </li>
                <li>
                  <strong>Location:</strong> Data is stored on Google Cloud servers
                </li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
                We also use your browser&apos;s local storage to cache data for faster loading and offline access. This
                cached data never leaves your device and can be cleared at any time from{' '}
                <ConditionalLink href="/settings/preferences" isLoggedIn={isLoggedIn}>
                  Settings → Preferences
                </ConditionalLink>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">What We Don&apos;t Do</h2>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-6 list-disc">
                <li>
                  <strong>No tracking:</strong> We don&apos;t use analytics, cookies, or tracking pixels
                </li>
                <li>
                  <strong>No advertising:</strong> We don&apos;t show ads or sell your data to advertisers
                </li>
                <li>
                  <strong>No third-party sharing:</strong> Your data is never shared with or sold to third parties
                </li>
                <li>
                  <strong>No profiling:</strong> We don&apos;t build profiles or analyse your reading habits for
                  commercial purposes
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">External Services</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                When you search for books or scan barcodes on the{' '}
                <ConditionalLink href="/books/add" isLoggedIn={isLoggedIn}>
                  Add Book
                </ConditionalLink>{' '}
                page, we query these external APIs to find book information:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-6 list-disc">
                <li>
                  <strong>Google Books API:</strong> For book metadata and cover images
                </li>
                <li>
                  <strong>Open Library API:</strong> As a fallback for additional book data
                </li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
                These queries include only the ISBN or search terms you enter, not your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Your Rights</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">You have full control over your data:</p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-6 list-disc">
                <li>
                  <strong>Access:</strong> View all your data within the app at any time
                </li>
                <li>
                  <strong>Export:</strong> Download all your data as a JSON file from{' '}
                  <ConditionalLink href="/settings/library" isLoggedIn={isLoggedIn}>
                    Settings → Library → Backup & Restore
                  </ConditionalLink>
                </li>
                <li>
                  <strong>Delete:</strong> Permanently delete your account and all associated data from{' '}
                  <ConditionalLink href="/settings/profile" isLoggedIn={isLoggedIn}>
                    Settings → Profile → Delete Account
                  </ConditionalLink>
                </li>
                <li>
                  <strong>Clear cache:</strong> Remove locally stored data from your browser via{' '}
                  <ConditionalLink href="/settings/preferences" isLoggedIn={isLoggedIn}>
                    Settings → Preferences → Clear Local Cache
                  </ConditionalLink>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Data Retention</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                Your data is retained for as long as you have an account. When you delete your account, all your data
                is permanently removed from our servers. Local cached data is cleared when you sign out or clear your
                browser data.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                <strong>Deleted books:</strong> When you delete a book, it moves to a bin where it can be restored for
                30 days. After 30 days, deleted books are permanently removed. You can also empty the bin manually from{' '}
                <ConditionalLink href="/settings/bin" isLoggedIn={isLoggedIn}>
                  Settings → Bin
                </ConditionalLink>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Security</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We take security seriously. Your password is never stored in plain text. All data transmission uses
                HTTPS encryption. Firebase provides enterprise-grade security for authentication and data storage.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Changes to This Policy</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We may update this privacy policy from time to time. Any changes will be reflected on this page with an
                updated &quot;Last updated&quot; date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                If you have any questions about this privacy policy or how your data is handled, please contact us via
                the{' '}
                <Link href={isLoggedIn ? '/settings/support' : '/support'} className="text-primary dark:text-blue-400 hover:underline">
                  Support
                </Link>{' '}
                page.
              </p>
            </section>
          </div>
        </article>
      </div>
    </>
  );
}
